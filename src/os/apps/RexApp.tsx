import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { rexChannels, rexDefaultChannel, rexWorkspace } from "../data/rex";
import type { RexCard, RexChannel, RexMessage } from "../data/rex";
import { useScreenLive } from "../screenLive";
import { keepWheelIfScrollable } from "../wheel";

/** The scripted intro plays once per page session, not once per window. */
let demoPlayed = false;

/*
 * Accelerated first run. Avery's question and Carlos's reply are on screen the
 * moment Rex opens — the channel is never empty — and only the part that shows
 * what Rex *does* is animated:
 *
 *   0ms      two messages already visible
 *   420ms    the @Rex command fills the composer
 *   900ms    ...and posts; the composer collapses to its read-only footer
 *   1060ms   "Rex is generating a pipeline report…"
 *   1660ms   the report card
 */
const PRE_TYPE_MS = 420;
const TYPE_MS = 480;
const SEND_MS = 160;
const THINK_MS = 600;
const SETTLE_MS = 400; // grace after the report before scroll-follow lets go

function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** *bold* spans and @mentions, without pulling in a markdown dependency. */
const TOKEN = /(\*[^*]+\*|@[A-Za-z][\w-]*)/g;

function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(TOKEN).map((part, i) => {
        if (!part) return null;
        if (part.startsWith("@")) {
          return (
            <span className="rex-mention" key={i}>
              {part}
            </span>
          );
        }
        if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) {
          return <strong key={i}>{part.slice(1, -1)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

/* ------------------------------------------------------------------ card */

function Card({ card }: { card: RexCard }) {
  const { status, fields, stages, progress, sections, footer, actions } = card;
  const maxStage = stages ? Math.max(...stages.map((s) => s.count), 1) : 1;
  const hasLeft = Boolean(status || fields || stages || progress);

  return (
    <article className="rex-card" style={{ borderLeftColor: card.accent }}>
      <h3 className="rex-card-title">{card.title}</h3>

      <div className="rex-card-body">
        {hasLeft && (
          <div className="rex-card-col">
            {status && (
              <p className={`rex-status ${status.tone}`}>
                <span className="rex-status-icon" aria-hidden="true">
                  {status.icon}
                </span>
                <span className="rex-status-key">Status</span>
                <span className="rex-status-label">{status.label}</span>
              </p>
            )}

            {fields && (
              <dl className="rex-fields">
                {fields.map((f) => (
                  <div className={`rex-field${f.wide ? " wide" : ""}`} key={f.label}>
                    <dt className="rex-field-label">{f.label}</dt>
                    <dd className="rex-field-value">{f.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {stages && (
              <div className="rex-stages">
                <p className="rex-stages-head">Pipeline</p>
                <ul>
                  {stages.map((s) => (
                    <li className="rex-stage" key={s.label}>
                      <span className="rex-stage-label">{s.label}</span>
                      <span className="rex-stage-bar" aria-hidden="true">
                        <span style={{ width: `${Math.round((s.count / maxStage) * 100)}%` }} />
                      </span>
                      <span className="rex-stage-count">{s.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {progress && (
              <div className="rex-progress">
                <div
                  className="rex-progress-track"
                  role="img"
                  aria-label={`${progress.label}: ${progress.value} of ${progress.max}`}
                >
                  {Array.from({ length: progress.max }, (_, i) => (
                    <span key={i} className={i < progress.value ? "on" : ""} />
                  ))}
                </div>
                <p className="rex-progress-note">{progress.note}</p>
              </div>
            )}
          </div>
        )}

        {sections && (
          <div className="rex-card-col">
            {sections.map((sec) => (
              <section className="rex-section" key={sec.heading}>
                <h4>{sec.heading}</h4>
                {sec.ordered ? (
                  <ol>
                    {sec.items.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ol>
                ) : (
                  <ul>
                    {sec.items.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        )}
      </div>

      {(footer || actions) && (
        <div className="rex-card-foot">
          {footer && <p className="rex-card-footer">{footer}</p>}
          {actions && (
            <div className="rex-actions">
              <span className="rex-sr">Read-only demo controls:</span>
              {actions.map((a) => (
                <span className="rex-action" key={a}>
                  {a}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

/* --------------------------------------------------------------- message */

function Message({ m, last }: { m: RexMessage; last: boolean }) {
  return (
    <div className="rex-msg" data-last={last ? "" : undefined}>
      <div className="rex-avatar" style={{ background: m.color }} aria-hidden="true">
        {m.initials}
      </div>
      <div className="rex-msg-main">
        <div className="rex-msg-head">
          <span className="rex-author">{m.author}</span>
          {m.bot && <span className="rex-badge">APP</span>}
          {m.role && <span className="rex-role">{m.role}</span>}
          <span className="rex-time">{m.time}</span>
        </div>
        {m.text && (
          <p className="rex-text">
            <RichText text={m.text} />
          </p>
        )}
        {m.card && <Card card={m.card} />}
        {m.reactions && (
          <div className="rex-reactions">
            {m.reactions.map((r) => (
              <span className="rex-reaction" key={r.emoji}>
                {r.emoji} <b>{r.count}</b>
              </span>
            ))}
          </div>
        )}
        {m.thread && <div className="rex-thread">{m.thread}</div>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- app */

const CHANNEL_ORDER = rexChannels.map((c) => c.id);
const DEMO = rexChannels.find((c) => c.id === rexDefaultChannel) as RexChannel;
const DEMO_TOTAL = DEMO.messages.length;
/** Messages on screen while the composer types the next one out. */
const COMPOSER_AFTER = DEMO.composerAfter ?? DEMO_TOTAL;
const SCRIPT = DEMO.messages[COMPOSER_AFTER]?.text ?? "";
/** Messages already on screen when Rex opens — the channel is never empty. */
const SEED = COMPOSER_AFTER;

function RexAppImpl() {
  const live = useScreenLive();
  const [activeId, setActiveId] = useState(rexDefaultChannel);
  const [revealed, setRevealed] = useState(() => (demoPlayed || reducedMotion() ? DEMO_TOTAL : SEED));
  const [typing, setTyping] = useState(false);
  /** null collapses the composer to its footer; a string shows the box. */
  const [composer, setComposer] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [announce, setAnnounce] = useState("");

  const timers = useRef<number[]>([]);
  const rafRef = useRef(0);
  /** Bumped on every cancel; stale callbacks check it and bail. */
  const token = useRef(0);
  const sent = useRef(false);
  const playingRef = useRef(false);
  const streamRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const scrollMem = useRef<Record<string, number>>({});
  const shownChannel = useRef(activeId);
  const activeRef = useRef(activeId);

  useEffect(() => {
    activeRef.current = activeId;
  }, [activeId]);

  const cancel = useCallback(() => {
    token.current += 1;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
  }, []);

  const setPlay = useCallback((on: boolean) => {
    playingRef.current = on;
    setPlaying(on);
  }, []);

  /** Jump to the finished conversation and drop everything in flight. */
  const complete = useCallback(() => {
    cancel();
    setRevealed(DEMO_TOTAL);
    setTyping(false);
    setComposer(null);
    setPlay(false);
  }, [cancel, setPlay]);

  /** `animate: false` shows the completed conversation immediately. */
  const play = useCallback(
    (animate = true) => {
      cancel();
      if (!animate || reducedMotion()) {
        complete();
        return;
      }
      const mine = token.current;
      const alive = () => token.current === mine;
      const at = (ms: number, fn: () => void) =>
        timers.current.push(
          window.setTimeout(() => {
            if (alive()) fn();
          }, ms),
        );

      sent.current = false;
      setRevealed(SEED);
      setTyping(false);
      setComposer(null);
      setPlay(true);
      // Replays start from the top of the conversation.
      if (streamRef.current) streamRef.current.scrollTop = 0;

      const send = () => {
        if (sent.current || !alive()) return;
        sent.current = true;
        const cmd = DEMO.messages[SEED];
        setComposer(null); // the composer collapses the moment it sends
        setRevealed(SEED + 1);
        setTyping(true);
        setAnnounce(`${cmd.author} sent: ${cmd.text}`);
        at(THINK_MS, () => {
          const report = DEMO.messages[DEMO_TOTAL - 1];
          setTyping(false);
          setRevealed(DEMO_TOTAL);
          setAnnounce(`${report.author} posted: ${report.text ?? ""}`);
          // Let the follow-scroll land, then stop steering.
          at(SETTLE_MS, () => setPlay(false));
        });
      };

      at(PRE_TYPE_MS, () => {
        setComposer("");
        const t0 = performance.now();
        const step = (now: number) => {
          if (!alive()) return;
          const t = Math.min((now - t0) / TYPE_MS, 1);
          const eased = 1 - (1 - t) * (1 - t); // fast in, settles into the send
          setComposer(SCRIPT.slice(0, Math.max(1, Math.round(eased * SCRIPT.length))));
          if (t < 1) {
            rafRef.current = requestAnimationFrame(step);
            return;
          }
          at(SEND_MS, send);
        };
        rafRef.current = requestAnimationFrame(step);
        // If rAF is throttled the command still fills in and posts on time.
        at(TYPE_MS + 300, () => {
          if (sent.current) return;
          setComposer(SCRIPT);
          at(SEND_MS, send);
        });
      });
    },
    [cancel, complete, setPlay],
  );

  // The story waits until this monitor is actually on camera.
  useEffect(() => {
    if (!live) return;
    const firstRun = !demoPlayed && activeRef.current === DEMO.id;
    demoPlayed = true;
    const id = window.setTimeout(() => play(firstRun), 200);
    return () => clearTimeout(id);
  }, [live, play]);

  useEffect(() => cancel, [cancel]);

  const active = rexChannels.find((c) => c.id === activeId) ?? DEMO;
  const isDemo = active.id === DEMO.id;
  const messages = isDemo ? active.messages.slice(0, revealed) : active.messages;
  // Composer keystrokes and the read-only footer belong to the story channel.
  const typedText = isDemo ? composer : null;

  /** Switching channels banks the scroll position and stops any playback. */
  const selectChannel = useCallback(
    (id: string) => {
      if (id === activeId) return;
      const s = streamRef.current;
      if (s) scrollMem.current[activeId] = s.scrollTop;
      if (playingRef.current) complete();
      setActiveId(id);
    },
    [activeId, complete],
  );

  // Each channel comes back to where it was left; new ones open at the top.
  useEffect(() => {
    const s = streamRef.current;
    if (!s || shownChannel.current === activeId) return;
    shownChannel.current = activeId;
    s.scrollTop = scrollMem.current[activeId] ?? 0;
  }, [activeId]);

  // While the demo runs, keep the newest thing on screen. Scrolling the newest
  // message to the top of the stream is what puts the report's title, status,
  // metrics and first recommended action in view at once. Once playback is
  // over this stops entirely, so a visitor's own scrolling is never fought.
  useEffect(() => {
    if (!playing) return;
    const s = streamRef.current;
    if (!s) return;
    const last = s.querySelector<HTMLElement>("[data-last]");
    const max = s.scrollHeight - s.clientHeight;
    if (!last || max <= 0) return;
    s.scrollTo({
      top: Math.min(Math.max(last.offsetTop - 10, 0), max),
      behavior: reducedMotion() ? "auto" : "smooth",
    });
  }, [playing, revealed, typing]);

  const onTabKey = (e: ReactKeyboardEvent, id: string) => {
    const i = CHANNEL_ORDER.indexOf(id);
    let next = -1;
    if (e.key === "ArrowDown") next = (i + 1) % CHANNEL_ORDER.length;
    else if (e.key === "ArrowUp") next = (i - 1 + CHANNEL_ORDER.length) % CHANNEL_ORDER.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = CHANNEL_ORDER.length - 1;
    else return;
    e.preventDefault();
    const id2 = CHANNEL_ORDER[next];
    selectChannel(id2);
    tabRefs.current[id2]?.focus();
  };

  const renderTab = (c: RexChannel) => {
    const selected = c.id === activeId;
    return (
      <button
        key={c.id}
        ref={(el) => {
          tabRefs.current[c.id] = el;
        }}
        id={`rex-tab-${c.id}`}
        type="button"
        role="tab"
        aria-selected={selected}
        aria-controls={`rex-panel-${c.id}`}
        tabIndex={selected ? 0 : -1}
        className={`rex-chan${selected ? " active" : ""}${c.primary ? " primary" : ""}`}
        onClick={() => selectChannel(c.id)}
        onKeyDown={(e) => onTabKey(e, c.id)}
      >
        <span className="rex-hash" aria-hidden="true">
          {c.kind === "dm" ? "●" : "#"}
        </span>
        <span className="rex-chan-name">{c.name}</span>
        {c.unread > 0 && (
          <span className="rex-unread">
            {c.unread}
            <span className="rex-sr"> unread</span>
          </span>
        )}
      </button>
    );
  };

  const primary = rexChannels.filter((c) => c.primary);
  const secondary = rexChannels.filter((c) => !c.primary && c.kind === "channel");
  const dms = rexChannels.filter((c) => c.kind === "dm");

  return (
    <div className="rex">
      <div className="rex-rail">
        <div className="rex-workspace">
          <div className="rex-ws-tile" aria-hidden="true">
            {rexWorkspace.initials}
          </div>
          <div>
            <div className="rex-ws-name">{rexWorkspace.name}</div>
            <div className="rex-ws-sub">{rexWorkspace.tagline}</div>
          </div>
        </div>

        <div
          className="rex-channels"
          role="tablist"
          aria-orientation="vertical"
          aria-label="Rex channels"
          onWheel={keepWheelIfScrollable}
        >
          <p className="rex-group" aria-hidden="true">
            Channels
          </p>
          {primary.map(renderTab)}
          <p className="rex-group" aria-hidden="true">
            More
          </p>
          {secondary.map(renderTab)}
          <p className="rex-group" aria-hidden="true">
            Direct messages
          </p>
          {dms.map(renderTab)}
        </div>
      </div>

      <div className="rex-main">
        <div className="rex-topbar">
          <div className="rex-topbar-text">
            <h2 className="rex-topbar-title">
              {active.kind === "channel" ? `#${active.name}` : active.name}
            </h2>
            <p className="rex-topbar-topic">{active.topic}</p>
          </div>
          {isDemo && (
            <button
              className="rex-replay"
              type="button"
              aria-label="Replay the Rex report demo"
              onClick={() => play()}
            >
              <span aria-hidden="true">↻</span> Replay demo
            </button>
          )}
        </div>

        {/* One restrained live region for the whole app: it carries the newest
            message only, never the conversation again. */}
        <p className="rex-sr" role="status" aria-live="polite">
          {announce}
        </p>

        <section
          className="rex-stream"
          id={`rex-panel-${active.id}`}
          role="tabpanel"
          aria-labelledby={`rex-tab-${active.id}`}
          tabIndex={0}
          ref={streamRef}
          onWheel={keepWheelIfScrollable}
        >
          <div className="rex-divider">
            <span>Today</span>
          </div>
          {messages.map((m, i) => (
            <Message key={m.id} m={m} last={!typing && i === messages.length - 1} />
          ))}
          {typing && (
            <div className="rex-msg rex-typing" data-last="" aria-hidden="true">
              <div className="rex-avatar" style={{ background: "#4d6bd8" }}>
                RX
              </div>
              <div className="rex-msg-main">
                <div className="rex-typing-row">
                  <span className="rex-dots">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span className="rex-typing-label">{active.typingLabel}</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {typedText === null ? (
          // Read-only demo: once the command is sent the composer gives its
          // vertical space back to the report cards.
          <p className="rex-footnote">
            Read-only demo · Rex drafts and reports; recruiters review and approve.
          </p>
        ) : (
          <div className="rex-composer">
            {/* Never an editable control — the demo "types" into static text, so
                clicking it mid-sequence cannot hijack the composer. The
                keystroke animation is presentational and hidden from assistive
                tech; the posted message in the stream carries the content. */}
            <div className={`rex-composer-box${typedText ? " typing" : ""}`}>
              {typedText === "" ? (
                <span className="rex-composer-placeholder">
                  Message {active.kind === "channel" ? `#${active.name}` : active.name}
                </span>
              ) : (
                <span className="rex-composer-typed" aria-hidden="true">
                  {typedText}
                  <span className="rex-caret" />
                </span>
              )}
              <span className={`rex-send${typedText ? " ready" : ""}`} aria-hidden="true">
                ➤
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const RexApp = memo(RexAppImpl);
