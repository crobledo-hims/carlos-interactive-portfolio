import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { rexChannels, rexDefaultChannel, rexWorkspace } from "../data/rex";
import type { RexCard, RexChannel, RexMessage } from "../data/rex";
import { useScreenLive } from "../screenLive";
import { keepWheelIfScrollable } from "../wheel";

/** The scripted intro plays once per page session, not once per window. */
let demoPlayed = false;

const REVEAL_MS = 620; // pause between Avery's question and Carlos's reply
const BEAT_MS = 520; // beat before Carlos starts typing at the composer
const SEND_MS = 380; // finger-off-Enter pause between the last keystroke and the post
const TYPING_MS = 900; // "Rex is generating a report…" — spec asks for 700–1000ms

// Carlos types 85-90 WPM, which at five characters per word is ~130-140ms per
// character. A metronome reads as fake, so the base is jittered, letter runs
// inside a word are a touch quicker, and there are real beats at word
// boundaries and before the parenthetical.
const CHAR_BASE = 122;
const CHAR_JITTER = 0.22;
const WORD_PAUSE = 110;
const PAREN_PAUSE = 300;
const LETTER = /[A-Za-z]/;

function charDelay(script: string, i: number) {
  const ch = script[i];
  const prev = i > 0 ? script[i - 1] : " ";
  let d = CHAR_BASE * (1 - CHAR_JITTER + Math.random() * CHAR_JITTER * 2);
  if (LETTER.test(ch) && LETTER.test(prev)) d *= 0.9;
  if (ch === " ") d += WORD_PAUSE;
  if (ch === "(") d += PAREN_PAUSE;
  return d;
}

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

function RexAppImpl() {
  const live = useScreenLive();
  const [activeId, setActiveId] = useState(rexDefaultChannel);
  const [revealed, setRevealed] = useState(() => (demoPlayed || reducedMotion() ? DEMO_TOTAL : 0));
  const [typing, setTyping] = useState(false);
  const [composer, setComposer] = useState<string | null>(null);

  const timers = useRef<number[]>([]);
  const streamRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  /** `animate: false` jumps straight to the finished conversation. */
  const play = useCallback((animate = true) => {
    clearTimers();
    setComposer(null);
    if (!animate || reducedMotion()) {
      setTyping(false);
      setRevealed(DEMO_TOTAL);
      return;
    }

    const at = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));

    // Avery asks, Carlos answers, then Carlos types the Rex command out at the
    // composer before it posts and Rex goes to work.
    setTyping(false);
    setRevealed(1);
    at(REVEAL_MS, () => setRevealed(COMPOSER_AFTER));
    at(REVEAL_MS + BEAT_MS, () => {
      setComposer("");
      let i = 0;
      const key = () => {
        i += 1;
        setComposer(SCRIPT.slice(0, i));
        if (i < SCRIPT.length) {
          at(charDelay(SCRIPT, i), key);
          return;
        }
        at(SEND_MS, () => {
          setComposer(null);
          setRevealed(COMPOSER_AFTER + 1);
          setTyping(true);
          at(TYPING_MS, () => {
            setTyping(false);
            setRevealed(DEMO_TOTAL);
          });
        });
      };
      at(charDelay(SCRIPT, 0), key);
    });
  }, []);

  // Wait for the monitor to actually be on camera before telling the story.
  // A window that mounted before the demo ran elsewhere simply catches up.
  useEffect(() => {
    if (!live) return;
    const firstRun = !demoPlayed;
    demoPlayed = true;
    // A beat after the monitor comes into view, so the story does not start
    // mid cross-fade.
    const id = window.setTimeout(() => play(firstRun), 220);
    return () => clearTimeout(id);
  }, [live, play]);

  useEffect(() => clearTimers, []);

  const active = rexChannels.find((c) => c.id === activeId) ?? DEMO;
  const isDemo = active.id === DEMO.id;
  const messages = isDemo ? active.messages.slice(0, revealed) : active.messages;
  // The live keystrokes only belong to the channel that is telling the story.
  const typedText = isDemo ? composer : null;

  // Channels open at the top, and the newest message is only scrolled to when
  // it would otherwise be out of sight — so the whole question → answer →
  // report story stays on screen instead of snapping to the report card.
  const shownChannel = useRef(activeId);
  useEffect(() => {
    const s = streamRef.current;
    if (!s) return;
    if (shownChannel.current !== activeId) {
      shownChannel.current = activeId;
      s.scrollTop = 0;
      return;
    }
    const last = s.querySelector<HTMLElement>(".rex-msg[data-last]");
    if (!last || s.scrollHeight <= s.clientHeight) return;
    const top = last.offsetTop;
    const visible = top >= s.scrollTop && top <= s.scrollTop + s.clientHeight - 48;
    if (visible) return;
    s.scrollTo({
      top: Math.max(top - 10, 0),
      behavior: reducedMotion() ? "auto" : "smooth",
    });
  }, [revealed, typing, activeId]);

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
    setActiveId(id2);
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
        onClick={() => setActiveId(c.id)}
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
            <div className="rex-msg rex-typing" data-last="" role="status">
              <div className="rex-avatar" style={{ background: "#4d6bd8" }} aria-hidden="true">
                RX
              </div>
              <div className="rex-msg-main">
                <div className="rex-typing-row">
                  <span className="rex-dots" aria-hidden="true">
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

        <div className="rex-composer">
          {/* Never an editable control — the demo "types" into static text, so
              clicking it mid-sequence cannot hijack the composer. The
              keystroke animation is presentational and hidden from assistive
              tech; the posted message in the stream carries the content. */}
          <div className={`rex-composer-box${typedText !== null ? " typing" : ""}`}>
            {typedText === null ? (
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
          <p className="rex-composer-note">
            Read-only demo · Rex posts reports and drafts follow-ups, recruiters approve them
          </p>
        </div>
      </div>
    </div>
  );
}

export const RexApp = memo(RexAppImpl);
