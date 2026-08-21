import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { rexChannels, rexDefaultChannel, rexFootnote, rexWorkspace } from "../data/rex";
import type { FeedbackState, RexBlock, RexChannel, RexMessage } from "../data/rex";
import { useScreenLive } from "../screenLive";

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
 *   1060ms   "Rex is generating the pipeline report…"
 *   1660ms   the pipeline snapshot
 */
const PRE_TYPE_MS = 420;
const TYPE_MS = 480;
const SEND_MS = 160;
const THINK_MS = 600;
const SETTLE_MS = 400; // grace after the report before scroll-follow lets go

/** How long the simulated Slack DM takes to "send". */
const FEEDBACK_MS = 700;

function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** *bold* spans, @mentions and [links], without a markdown dependency. */
const TOKEN = /(\*[^*]+\*|@[A-Za-z][\w-]*|\[[^\]]+\])/g;

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
        if (part.length > 2 && part.startsWith("[") && part.endsWith("]")) {
          return (
            <span className="rex-link" key={i}>
              {part.slice(1, -1)}
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

/* ------------------------------------------------- interactive workflow */

interface FeedbackProps {
  state: FeedbackState;
  onSend: () => void;
  onDecline: () => void;
  onReset: () => void;
}

/**
 * The one interactive workflow in the demo. Detection and the alert above are
 * automatic; this reminder goes to the interviewer only when the recruiter
 * presses the button. Nothing leaves the page: the outcome is React state.
 *
 * Every state carries a glyph *and* words, so none of them is distinguished by
 * colour alone.
 */
function Feedback({ state, onSend, onDecline, onReset }: FeedbackProps) {
  if (state === "sent" || state === "declined") {
    const sent = state === "sent";
    return (
      <div className="rex-b-result">
        <p className={`rex-b-done${sent ? " ok" : ""}`}>
          <span className="rex-b-done-icon" aria-hidden="true">
            {sent ? "✓" : "○"}
          </span>
          {sent
            ? "Reminder sent to Jordan Lee."
            : "Feedback marked not required. No reminder was sent to Jordan Lee."}
        </p>
        <button type="button" className="rex-btn ghost" onClick={onReset}>
          Reset example
        </button>
      </div>
    );
  }

  const busy = state === "sending";
  return (
    <div className="rex-b-actions">
      <button type="button" className="rex-btn primary" onClick={onSend} disabled={busy}>
        {busy ? "Sending…" : "Send follow-up to interviewer"}
      </button>
      <button type="button" className="rex-btn" onClick={onDecline} disabled={busy}>
        Mark not required
      </button>
    </div>
  );
}

/* ------------------------------------------------------------- blocks */

function Blocks({ blocks, feedback }: { blocks: RexBlock[]; feedback: FeedbackProps }) {
  return (
    <div className="rex-blocks">
      {blocks.map((b, i) => {
        switch (b.kind) {
          case "title":
            return (
              <h3 className="rex-b-title" key={i}>
                {b.icon && (
                  <span className="rex-b-icon" aria-hidden="true">
                    {b.icon}
                  </span>
                )}
                {b.text}
              </h3>
            );
          case "subhead":
            return (
              <h4 className="rex-b-subhead" key={i}>
                {b.text}
              </h4>
            );
          case "text":
            return (
              <p className="rex-text" key={i}>
                <RichText text={b.text} />
              </p>
            );
          case "fields":
            return (
              <dl className="rex-b-fields" key={i}>
                {b.items.map((f) => (
                  <div className="rex-b-field" key={f.label}>
                    <dt>{f.label}:</dt>
                    <dd className={f.link ? "rex-link" : undefined}>{f.value}</dd>
                  </div>
                ))}
              </dl>
            );
          case "group":
            return (
              <div className="rex-b-group" key={i}>
                <p className="rex-b-group-head">
                  {b.heading}
                  {b.count !== undefined && <span className="rex-b-count"> ({b.count})</span>}
                </p>
                <ul className="rex-b-list">
                  {b.items.map((it) => (
                    <li key={it.name}>
                      <span className="rex-link">{it.name}</span>
                      {it.icon && (
                        <span className="rex-b-icon sm" aria-hidden="true">
                          {it.icon}
                        </span>
                      )}
                      <span className="rex-b-detail">{it.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          case "list":
            return (
              <ul className="rex-b-list plain" key={i}>
                {b.items.map((l) => (
                  <li key={l.text}>
                    {l.icon && (
                      <span className="rex-b-icon sm" aria-hidden="true">
                        {l.icon}
                      </span>
                    )}
                    <span>{l.text}</span>
                  </li>
                ))}
              </ul>
            );
          case "divider":
            return <hr className="rex-b-divider" key={i} />;
          case "context":
            return (
              <p className="rex-b-context" key={i}>
                {b.text}
              </p>
            );
          case "actions":
            return (
              <p className="rex-b-links" key={i}>
                <span className="rex-sr">Illustrative controls, not connected to anything: </span>
                {b.items.map((a) => (
                  <span className="rex-b-link-btn" key={a}>
                    {a}
                  </span>
                ))}
              </p>
            );
          case "feedback":
            return <Feedback key={i} {...feedback} />;
        }
      })}
    </div>
  );
}

/* --------------------------------------------------------------- message */

function Message({ m, last, feedback }: { m: RexMessage; last: boolean; feedback: FeedbackProps }) {
  return (
    <div className="rex-msg-wrap" data-last={last ? "" : undefined}>
      {m.label && <p className="rex-msg-label">{m.label}</p>}
      <div className="rex-msg">
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
          <Blocks blocks={m.blocks} feedback={feedback} />
          {m.reactions && (
            <div className="rex-reactions">
              {m.reactions.map((r) => (
                <span className="rex-reaction" key={r.emoji}>
                  {r.emoji} <b>{r.count}</b>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- app */

const CHANNELS = rexChannels.filter((c) => c.kind === "channel");
const WORKFLOWS = rexChannels.filter((c) => c.kind === "workflow");
/** Arrow-key order follows the order the rail actually renders. */
const CHANNEL_ORDER = [...CHANNELS, ...WORKFLOWS].map((c) => c.id);

const DEMO = rexChannels.find((c) => c.id === rexDefaultChannel) as RexChannel;
const DEMO_TOTAL = DEMO.messages.length;
/** Messages on screen while the composer types the next one out. */
const COMPOSER_AFTER = DEMO.composerAfter ?? DEMO_TOTAL;
/** Messages already on screen when Rex opens — the channel is never empty. */
const SEED = COMPOSER_AFTER;

/** The headline of a message, for the live region and the composer script. */
function firstText(m: RexMessage | undefined) {
  if (!m) return "";
  for (const b of m.blocks) if (b.kind === "title" || b.kind === "text") return b.text;
  return "";
}

const SCRIPT = firstText(DEMO.messages[COMPOSER_AFTER]);

function RexAppImpl() {
  const live = useScreenLive();
  const [activeId, setActiveId] = useState(rexDefaultChannel);
  const [revealed, setRevealed] = useState(() => (demoPlayed || reducedMotion() ? DEMO_TOTAL : SEED));
  const [typing, setTyping] = useState(false);
  /** null collapses the composer to its footer; a string shows the box. */
  const [composer, setComposer] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [feedback, setFeedbackState] = useState<FeedbackState>("pending");

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
  /** The feedback simulation runs on its own timer, outside the story's token. */
  const fbTimer = useRef(0);
  const feedbackRef = useRef<FeedbackState>("pending");

  useEffect(() => {
    activeRef.current = activeId;
  }, [activeId]);

  const setFeedback = useCallback((s: FeedbackState) => {
    feedbackRef.current = s;
    setFeedbackState(s);
  }, []);

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
        setAnnounce(`${cmd.author} sent: ${firstText(cmd)}`);
        at(THINK_MS, () => {
          const report = DEMO.messages[DEMO_TOTAL - 1];
          setTyping(false);
          setRevealed(DEMO_TOTAL);
          setAnnounce(`${report.author} posted: ${firstText(report)}`);
          // Let the follow-scroll land, then stop steering.
          at(SETTLE_MS, () => setPlay(false));
        });
      };

      at(PRE_TYPE_MS, () => {
        setComposer("");
        const t0 = performance.now();
        const step = (now: number) => {
          // Stop touching the composer once the command has posted. If rAF is
          // paused mid-type (backgrounded tab) the stall fallback sends first,
          // and a late frame resuming here would otherwise refill the composer
          // and leave it on screen for good.
          if (!alive() || sent.current) return;
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
  useEffect(() => () => clearTimeout(fbTimer.current), []);

  /* ------------------------------------------- feedback workflow actions */

  const sendFollowUp = useCallback(() => {
    if (feedbackRef.current !== "pending") return;
    const done = () => {
      setFeedback("sent");
      setAnnounce("Reminder sent to Jordan Lee.");
    };
    if (reducedMotion()) {
      done();
      return;
    }
    setFeedback("sending");
    clearTimeout(fbTimer.current);
    fbTimer.current = window.setTimeout(done, FEEDBACK_MS);
  }, [setFeedback]);

  const declineFollowUp = useCallback(() => {
    if (feedbackRef.current !== "pending") return;
    setFeedback("declined");
    setAnnounce("Feedback marked not required");
  }, [setFeedback]);

  const resetFeedback = useCallback(() => {
    clearTimeout(fbTimer.current);
    setFeedback("pending");
    setAnnounce("Feedback example reset.");
  }, [setFeedback]);

  const feedbackProps: FeedbackProps = {
    state: feedback,
    onSend: sendFollowUp,
    onDecline: declineFollowUp,
    onReset: resetFeedback,
  };

  // The simulated DM appears below the fold; bring it into view once, in
  // direct response to the visitor's own button press.
  useEffect(() => {
    if (feedback !== "sent") return;
    const s = streamRef.current;
    if (!s) return;
    s.scrollTo({ top: s.scrollHeight, behavior: reducedMotion() ? "auto" : "smooth" });
  }, [feedback]);

  /* --------------------------------------------------------- navigation */

  const active = rexChannels.find((c) => c.id === activeId) ?? DEMO;
  const isDemo = active.id === DEMO.id;
  const visible = active.messages.filter((m) => !m.showWhen || m.showWhen === feedback);
  const messages = isDemo ? visible.slice(0, revealed) : visible;
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

  // While the demo runs, keep the newest thing on screen. Once playback is
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
        className={`rex-chan${selected ? " active" : ""}`}
        onClick={() => selectChannel(c.id)}
        onKeyDown={(e) => onTabKey(e, c.id)}
      >
        <span className="rex-hash" aria-hidden="true">
          {c.kind === "workflow" ? "⚡" : "#"}
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
          aria-label="Rex channels and workflows"
        >
          <p className="rex-group" aria-hidden="true">
            Channels
          </p>
          {CHANNELS.map(renderTab)}
          <p className="rex-group" aria-hidden="true">
            Rex workflows
          </p>
          {WORKFLOWS.map(renderTab)}
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
            message or workflow result only, never the conversation again. */}
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
        >
          <div className="rex-divider">
            <span>Today</span>
          </div>
          {messages.map((m, i) => (
            <Message
              key={m.id}
              m={m}
              last={!typing && i === messages.length - 1}
              feedback={feedbackProps}
            />
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
          // vertical space back to the message.
          <p className="rex-footnote">{rexFootnote}</p>
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
