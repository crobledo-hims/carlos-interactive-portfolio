import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { cadenceChannels, cadenceDefaultChannel, cadenceFootnote, cadenceWorkspace } from "../data/cadence";
import type { FeedbackState, CadenceBlock, CadenceChannel, CadenceMessage } from "../data/cadence";
import { useScreenLive } from "../screenLive";
import { makeClock, typeOut, typingDurationMs } from "./cadence/clock";
import type { Clock } from "./cadence/clock";

/** The scripted opening plays once per page session, not once per window. */
let demoPlayed = false;
/** The offer story also plays once per page session, when its channel opens. */
let offerDemoPlayed = false;

/*
 * The opening conversation, at conversation speed.
 *
 * The channel starts empty and fills the way a real one does: Avery types,
 * her question lands, Carlos reads it, answers in the composer, asks Cadence,
 * and Cadence takes a moment before the report. Nothing here is hurried — the
 * Skip control exists so nobody has to wait who does not want to.
 *
 *   0ms       the Slack interface, settled and empty
 *   600ms     Avery starts typing
 *   2000ms    her message lands
 *   2850ms    Carlos begins typing his reply (~150 WPM)
 *              ...then sends it and types the @cadence request at the same rate
 *              ...Cadence prepares and posts the pipeline report
 */
const ORIENT_MS = 600; // beat before anything moves, so the UI reads first
const AVERY_TYPING_MS = 1400; // spec: 1.2-1.6s
const READ_MS = 850; // spec: 700-1000ms reading pause
const SEND_PAUSE_MS = 420; // spec: 350-500ms between finishing and sending
const BETWEEN_MS = 900; // beat between Carlos's two messages
const PROCESS_MS = 2500; // spec: 2-3s of believable bot work
const TAIL_MS = 500; // grace after the report before scroll-follow lets go

/** Reduced motion: no typing, just each message in turn with a beat between. */
const RM_STEP_MS = 700;

/** Timing around the feedback workflow; human typing uses the shared 150 WPM rate. */
const FEEDBACK_SEND_MS = 900;
const FEEDBACK_READ_MS = 900;

/** The offer channel opens on the earlier conversation, then compresses hours. */
const OFFER_PRELUDE_COUNT = 3;
const OFFER_ORIENT_MS = 4200;
const OFFER_AFTER_ALERT_MS = 850;
const OFFER_TAIL_MS = 500;

function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Cadence's mark: three checkpoints stepping upward, joined by the path
 * between them. Coordination and forward movement, drawn small enough to hold
 * up inside a 26px Slack avatar.
 */
export function CadenceMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.5">
        <path d="M9.7 20.1 13.6 17.2" />
        <path d="M18.9 14.3 22.7 11.5" />
      </g>
      <circle cx="7" cy="22" r="3.1" fill="currentColor" opacity="0.62" />
      <circle cx="16" cy="16" r="3.1" fill="currentColor" opacity="0.82" />
      <circle cx="25" cy="10" r="3.4" fill="currentColor" />
    </svg>
  );
}

/** The one mention the composer knows how to resolve as it is typed. */
const MENTION = "@cadence";

/**
 * The composer's live text.
 *
 * A real Slack composer resolves a mention the moment you finish typing it,
 * then carries on in plain text. So does this one: the moment the leading
 * "@cadence" is complete it becomes the mention chip, and the rest of the
 * sentence keeps typing beside it.
 */
function ComposerText({ text }: { text: string }) {
  if (text.length >= MENTION.length && text.startsWith(MENTION)) {
    return (
      <>
        <span className="cad-mention">{MENTION}</span>
        {text.slice(MENTION.length)}
      </>
    );
  }
  return <>{text}</>;
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
            <span className="cad-mention" key={i}>
              {part}
            </span>
          );
        }
        if (part.length > 2 && part.startsWith("[") && part.endsWith("]")) {
          return (
            <span className="cad-link" key={i}>
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
  const delivered = state === "sent" || state === "replying" || state === "replied";
  if (delivered || state === "declined") {
    const sent = delivered;
    return (
      <div className="cad-b-result">
        <p className={`cad-b-done${sent ? " ok" : ""}`}>
          <span className="cad-b-done-icon" aria-hidden="true">
            {sent ? "✓" : "○"}
          </span>
          {sent
            ? "Reminder sent to Jordan Lee in a direct message."
            : "Feedback marked not required. No reminder was sent to Jordan Lee."}
        </p>
        <button type="button" className="cad-btn ghost" onClick={onReset}>
          Reset example
        </button>
      </div>
    );
  }

  const busy = state === "sending";
  return (
    <div className="cad-b-actions">
      <button type="button" className="cad-btn primary" onClick={onSend} disabled={busy}>
        {busy ? "Sending…" : "Send follow-up to interviewer"}
      </button>
      <button type="button" className="cad-btn" onClick={onDecline} disabled={busy}>
        Mark not required
      </button>
    </div>
  );
}

/* ------------------------------------------------------------- blocks */

function Blocks({ blocks, feedback }: { blocks: CadenceBlock[]; feedback: FeedbackProps }) {
  return (
    <div className="cad-blocks">
      {blocks.map((b, i) => {
        switch (b.kind) {
          case "title":
            return (
              <h3 className="cad-b-title" key={i}>
                {b.icon && (
                  <span className="cad-b-icon" aria-hidden="true">
                    {b.icon}
                  </span>
                )}
                {b.text}
              </h3>
            );
          case "subhead":
            return (
              <h4 className="cad-b-subhead" key={i}>
                {b.text}
              </h4>
            );
          case "text":
            return (
              <p className="cad-text" key={i}>
                <RichText text={b.text} />
              </p>
            );
          case "fields":
            return (
              <dl className="cad-b-fields" key={i}>
                {b.items.map((f) => (
                  <div className="cad-b-field" key={f.label}>
                    <dt>{f.label}:</dt>
                    <dd className={f.link ? "cad-link" : undefined}>{f.value}</dd>
                  </div>
                ))}
              </dl>
            );
          case "group":
            return (
              <div className="cad-b-group" key={i}>
                <p className="cad-b-group-head">
                  {b.heading}
                  {b.count !== undefined && <span className="cad-b-count"> ({b.count})</span>}
                </p>
                <ul className="cad-b-list">
                  {b.items.map((it) => (
                    <li key={it.name}>
                      <span className="cad-link">{it.name}</span>
                      {/* rows with a status glyph get their gap from the icon;
                          glyph-less rows need explicit punctuation */}
                      {it.icon ? (
                        <span className="cad-b-icon sm" aria-hidden="true">
                          {it.icon}
                        </span>
                      ) : (
                        <span className="cad-b-sep">{" — "}</span>
                      )}
                      <span className="cad-b-detail">{it.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          case "list":
            return (
              <ul className="cad-b-list plain" key={i}>
                {b.items.map((l) => (
                  <li key={l.text}>
                    {l.icon && (
                      <span className="cad-b-icon sm" aria-hidden="true">
                        {l.icon}
                      </span>
                    )}
                    <span>{l.text}</span>
                  </li>
                ))}
              </ul>
            );
          case "divider":
            return <hr className="cad-b-divider" key={i} />;
          case "context":
            return (
              <p className="cad-b-context" key={i}>
                {b.text}
              </p>
            );
          case "actions":
            return (
              <p className="cad-b-links" key={i}>
                <span className="cad-sr">Illustrative controls, not connected to anything: </span>
                {b.items.map((a) => (
                  <span className="cad-b-link-btn" key={a}>
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

function Message({ m, last, feedback }: { m: CadenceMessage; last: boolean; feedback: FeedbackProps }) {
  return (
    <div className="cad-msg-wrap" data-last={last ? "" : undefined}>
      {m.dividerBefore && (
        <div className="cad-time-jump" aria-label={m.dividerBefore}>
          <span>{m.dividerBefore}</span>
        </div>
      )}
      {m.label && <p className="cad-msg-label">{m.label}</p>}
      <div className="cad-msg">
        <div className="cad-avatar" style={{ background: m.color }} aria-hidden="true">
          {m.mark ? <CadenceMark className="cad-avatar-mark" /> : m.initials}
        </div>
        <div className="cad-msg-main">
          <div className="cad-msg-head">
            <span className="cad-author">{m.author}</span>
            {m.bot && <span className="cad-badge">APP</span>}
            {m.role && <span className="cad-role">{m.role}</span>}
            <span className="cad-time">{m.time}</span>
          </div>
          <Blocks blocks={m.blocks} feedback={feedback} />
          {m.reactions && (
            <div className="cad-reactions">
              {m.reactions.map((r) => (
                <span className="cad-reaction" key={r.emoji}>
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

const CHANNELS = cadenceChannels.filter((c) => c.kind === "channel");
const WORKFLOWS = cadenceChannels.filter((c) => c.kind === "workflow");
const DIRECT_MESSAGES = cadenceChannels.filter((c) => c.kind === "dm");
const DEMO = cadenceChannels.find((c) => c.id === cadenceDefaultChannel) as CadenceChannel;
const FEEDBACK_DM = cadenceChannels.find((c) => c.id === "jordan-lee") as CadenceChannel;
const OFFER = cadenceChannels.find((c) => c.id === "offer-accepted") as CadenceChannel;
const DEMO_TOTAL = DEMO.messages.length;
const OFFER_TOTAL = OFFER.messages.length;
/** Indexes the composer types out live, in order. */
const TYPED = DEMO.typed ?? [];

/** The headline of a message, for the live region and the composer script. */
function firstText(m: CadenceMessage | undefined) {
  if (!m) return "";
  for (const b of m.blocks) if (b.kind === "title" || b.kind === "text") return b.text;
  return "";
}

/** Who the three-dot indicator is standing in for. */
interface Indicator {
  initials: string;
  color: string;
  mark?: boolean;
  label: string;
}

function indicatorFor(m: CadenceMessage, label: string): Indicator {
  return { initials: m.initials, color: m.color, mark: m.mark, label };
}

function CadenceAppImpl() {
  const live = useScreenLive();
  const [activeId, setActiveId] = useState(cadenceDefaultChannel);
  const [revealed, setRevealed] = useState(() => (demoPlayed ? DEMO_TOTAL : 0));
  /** Who is currently shown as typing, if anyone. */
  const [indicator, setIndicator] = useState<Indicator | null>(null);
  /** null collapses the composer to its footer; a string shows the box. */
  const [composer, setComposer] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [offerRevealed, setOfferRevealed] = useState(() =>
    offerDemoPlayed ? OFFER_TOTAL : OFFER_PRELUDE_COUNT,
  );
  const [offerIndicator, setOfferIndicator] = useState<Indicator | null>(null);
  const [offerPlaying, setOfferPlaying] = useState(false);
  const [feedbackIndicator, setFeedbackIndicator] = useState<Indicator | null>(null);
  const [announce, setAnnounce] = useState("");
  const [feedback, setFeedbackState] = useState<FeedbackState>("pending");

  /** The clock driving the sequence in flight, if any. */
  const clockRef = useRef<Clock | null>(null);
  const offerClockRef = useRef<Clock | null>(null);
  const feedbackClockRef = useRef<Clock | null>(null);
  const playingRef = useRef(false);
  const offerPlayingRef = useRef(false);
  const streamRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const scrollMem = useRef<Record<string, number>>({});
  const shownChannel = useRef(activeId);
  const activeRef = useRef(activeId);
  const feedbackRef = useRef<FeedbackState>("pending");

  useEffect(() => {
    activeRef.current = activeId;
  }, [activeId]);

  const setFeedback = useCallback((s: FeedbackState) => {
    feedbackRef.current = s;
    setFeedbackState(s);
  }, []);

  const cancel = useCallback(() => {
    clockRef.current?.cancel();
    clockRef.current = null;
  }, []);

  const cancelOffer = useCallback(() => {
    offerClockRef.current?.cancel();
    offerClockRef.current = null;
  }, []);

  const cancelFeedback = useCallback(() => {
    feedbackClockRef.current?.cancel();
    feedbackClockRef.current = null;
  }, []);

  const setPlay = useCallback((on: boolean) => {
    playingRef.current = on;
    setPlaying(on);
  }, []);

  const setOfferPlay = useCallback((on: boolean) => {
    offerPlayingRef.current = on;
    setOfferPlaying(on);
  }, []);

  /** Jump to the finished conversation and drop everything in flight. */
  const complete = useCallback(() => {
    cancel();
    setRevealed(DEMO_TOTAL);
    setIndicator(null);
    setComposer(null);
    setPlay(false);
  }, [cancel, setPlay]);

  const completeOffer = useCallback(() => {
    cancelOffer();
    setOfferRevealed(OFFER_TOTAL);
    setOfferIndicator(null);
    setOfferPlay(false);
  }, [cancelOffer, setOfferPlay]);

  const completeFeedback = useCallback(() => {
    cancelFeedback();
    setFeedbackIndicator(null);
    if (
      feedbackRef.current === "sending" ||
      feedbackRef.current === "sent" ||
      feedbackRef.current === "replying"
    ) {
      setFeedback("replied");
    }
  }, [cancelFeedback, setFeedback]);

  /**
   * Skip. Same jump to the end, but it says so: the report is the thing the
   * conversation was for, and someone who skips still needs to hear that it
   * arrived. Switching channels calls plain complete() instead, because
   * navigating away is not a result worth announcing.
   */
  const skip = useCallback(() => {
    complete();
    const report = DEMO.messages[DEMO_TOTAL - 1];
    setAnnounce(`${report.author}: ${firstText(report)}`);
  }, [complete]);

  const skipOffer = useCallback(() => {
    completeOffer();
    const reply = OFFER.messages[OFFER_TOTAL - 1];
    setAnnounce(`${reply.author}: ${firstText(reply)}`);
  }, [completeOffer]);

  /**
   * The offer channel opens on the earlier recruiter / hiring-manager exchange.
   * A short pause represents the intervening hours, then the event and Avery's
   * incoming reply arrive the way they would in Slack: whole messages, with a
   * real typing indicator before the human response.
   */
  const playOffer = useCallback(() => {
    cancelOffer();
    const clock = makeClock();
    offerClockRef.current = clock;
    const alive = () => clock.alive();
    const accepted = OFFER.messages[OFFER_PRELUDE_COUNT];
    const reply = OFFER.messages[OFFER_TOTAL - 1];

    setOfferRevealed(OFFER_PRELUDE_COUNT);
    setOfferIndicator(null);
    setOfferPlay(true);

    const run = async () => {
      if (reducedMotion()) {
        setOfferRevealed(OFFER_TOTAL);
        setAnnounce(`${reply.author}: ${firstText(reply)}`);
        setOfferPlay(false);
        return;
      }

      await clock.sleep(OFFER_ORIENT_MS);
      if (!alive()) return;
      setOfferRevealed(OFFER_PRELUDE_COUNT + 1);
      setAnnounce(`${accepted.author}: ${firstText(accepted)}`);

      await clock.sleep(OFFER_AFTER_ALERT_MS);
      if (!alive()) return;
      setOfferIndicator(indicatorFor(reply, `${reply.author} is typing…`));
      await clock.sleep(typingDurationMs(firstText(reply)));
      if (!alive()) return;

      setOfferIndicator(null);
      setOfferRevealed(OFFER_TOTAL);
      setAnnounce(`${reply.author}: ${firstText(reply)}`);
      await clock.sleep(OFFER_TAIL_MS);
      if (!alive()) return;
      setOfferPlay(false);
    };

    void run();
  }, [cancelOffer, setOfferPlay]);

  /**
   * The opening conversation.
   *
   * Written as one straight line of awaits so it reads like the script it is.
   * Every await is followed by an `alive()` check: cancel() releases all
   * pending sleeps at once, so Skip and channel-switching unwind the whole
   * sequence on the next tick instead of leaving half-typed state behind.
   */
  const play = useCallback(() => {
    cancel();
    const clock = makeClock();
    clockRef.current = clock;
    const alive = () => clock.alive();

    setRevealed(0);
    setIndicator(null);
    setComposer(null);
    setPlay(true);
    if (streamRef.current) streamRef.current.scrollTop = 0;

    const post = (index: number) => {
      const m = DEMO.messages[index];
      setRevealed(index + 1);
      // The live region only ever carries a message that has actually been
      // sent — never a keystroke, never a message still being composed.
      setAnnounce(`${m.author}: ${firstText(m)}`);
    };

    const reduced = reducedMotion();

    const run = async () => {
      if (reduced) {
        // No typing and no indicators: each complete message in turn, with a
        // beat between so a screen reader announces them one at a time.
        for (let i = 0; i < DEMO_TOTAL; i++) {
          await clock.sleep(i === 0 ? ORIENT_MS : RM_STEP_MS);
          if (!alive()) return;
          post(i);
        }
        await clock.sleep(TAIL_MS);
        if (!alive()) return;
        setPlay(false);
        return;
      }

      // 1-2. the interface, then a beat to take it in.
      await clock.sleep(ORIENT_MS);
      if (!alive()) return;

      // 3-4. Avery types, then her message lands whole, the way a received
      // message actually arrives.
      setIndicator(indicatorFor(DEMO.messages[0], `${DEMO.messages[0].author} is typing…`));
      await clock.sleep(AVERY_TYPING_MS);
      if (!alive()) return;
      setIndicator(null);
      post(0);

      // 5-8. Carlos reads, then answers in the composer, twice.
      for (const index of TYPED) {
        await clock.sleep(index === TYPED[0] ? READ_MS : BETWEEN_MS);
        if (!alive()) return;
        setComposer("");
        await typeOut(clock, firstText(DEMO.messages[index]), setComposer);
        if (!alive()) return;
        await clock.sleep(SEND_PAUSE_MS);
        if (!alive()) return;
        setComposer(null); // the composer clears the moment it sends
        post(index);
      }

      // 9. Cadence takes a moment before answering.
      const report = DEMO.messages[DEMO_TOTAL - 1];
      setIndicator(indicatorFor(report, DEMO.processingLabel ?? "Cadence is working…"));
      await clock.sleep(PROCESS_MS);
      if (!alive()) return;

      // 10-11. the report, then control comes back.
      setIndicator(null);
      post(DEMO_TOTAL - 1);
      await clock.sleep(TAIL_MS);
      if (!alive()) return;
      setPlay(false);
    };

    void run();
  }, [cancel, setPlay]);

  /**
   * Arm the sequence once the monitor has arrived AND the camera has settled
   * (ScreenLiveContext only flips after a sustained-alpha hold, so this covers
   * Enter Workspace, manual scrolling and the monitor switcher alike).
   */
  useEffect(() => {
    if (!live) return;
    const firstRun = !demoPlayed && activeRef.current === DEMO.id;
    demoPlayed = true;
    if (!firstRun) return;
    play();
  }, [live, play]);

  /**
   * A hidden tab freezes the story where it stands and picks it up at the same
   * millisecond when the visitor comes back — never restarting, never
   * fast-forwarding through the part they came back to watch.
   */
  useEffect(() => {
    const onVisibility = () => {
      for (const clock of [clockRef.current, offerClockRef.current, feedbackClockRef.current]) {
        if (!clock) continue;
        if (document.hidden) clock.pause();
        else clock.resume();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(
    () => () => {
      cancel();
      cancelOffer();
      cancelFeedback();
    },
    [cancel, cancelFeedback, cancelOffer],
  );

  /* ------------------------------------------- feedback workflow actions */

  const sendFollowUp = useCallback(() => {
    if (feedbackRef.current !== "pending") return;
    if (playingRef.current) complete();
    if (offerPlayingRef.current) completeOffer();
    cancelFeedback();
    setActiveId(FEEDBACK_DM.id);

    const outgoing = FEEDBACK_DM.messages[0];
    const reply = FEEDBACK_DM.messages[1];
    if (reducedMotion()) {
      setFeedback("replied");
      setFeedbackIndicator(null);
      setAnnounce(`${reply.author}: ${firstText(reply)}`);
      return;
    }

    const clock = makeClock();
    feedbackClockRef.current = clock;
    const alive = () => clock.alive();
    setFeedback("sending");
    setFeedbackIndicator(indicatorFor(outgoing, "Cadence is sending the follow-up…"));

    const run = async () => {
      await clock.sleep(FEEDBACK_SEND_MS);
      if (!alive()) return;
      setFeedback("sent");
      setFeedbackIndicator(null);
      setAnnounce(`${outgoing.author}: ${firstText(outgoing)}`);

      await clock.sleep(FEEDBACK_READ_MS);
      if (!alive()) return;
      setFeedback("replying");
      setFeedbackIndicator(indicatorFor(reply, `${reply.author} is typing…`));
      await clock.sleep(typingDurationMs(firstText(reply)));
      if (!alive()) return;

      setFeedback("replied");
      setFeedbackIndicator(null);
      setAnnounce(`${reply.author}: ${firstText(reply)}`);
      feedbackClockRef.current = null;
    };

    void run();
  }, [cancelFeedback, complete, completeOffer, setFeedback]);

  const declineFollowUp = useCallback(() => {
    if (feedbackRef.current !== "pending") return;
    setFeedback("declined");
    setAnnounce("Feedback marked not required");
  }, [setFeedback]);

  const resetFeedback = useCallback(() => {
    cancelFeedback();
    setFeedbackIndicator(null);
    setFeedback("pending");
    setActiveId("feedback-reminder");
    setAnnounce("Feedback example reset.");
  }, [cancelFeedback, setFeedback]);

  const feedbackProps: FeedbackProps = {
    state: feedback,
    onSend: sendFollowUp,
    onDecline: declineFollowUp,
    onReset: resetFeedback,
  };

  // Keep the newest part of the recruiter-triggered DM in view without ever
  // allowing its scroll to escape the Slack conversation pane.
  useEffect(() => {
    if (activeId !== FEEDBACK_DM.id || feedback === "pending" || feedback === "declined") return;
    const s = streamRef.current;
    if (!s) return;
    s.scrollTo({ top: s.scrollHeight, behavior: reducedMotion() ? "auto" : "smooth" });
  }, [activeId, feedback, feedbackIndicator]);

  /* --------------------------------------------------------- navigation */

  const active = cadenceChannels.find((c) => c.id === activeId) ?? DEMO;
  const isDemo = active.id === DEMO.id;
  const isOffer = active.id === OFFER.id;
  const isFeedbackDm = active.id === FEEDBACK_DM.id;
  const visible = active.messages.filter((m) => {
    if (!m.showWhen) return true;
    return Array.isArray(m.showWhen) ? m.showWhen.includes(feedback) : m.showWhen === feedback;
  });
  const messages = isDemo
    ? visible.slice(0, revealed)
    : isOffer
      ? visible.slice(0, offerRevealed)
      : visible;
  const activeIndicator = isDemo
    ? indicator
    : isOffer
      ? offerIndicator
      : isFeedbackDm
        ? feedbackIndicator
        : null;
  const activeStoryPlaying = playing || offerPlaying || Boolean(feedbackIndicator);
  const showDirectMessages = feedback !== "pending" && feedback !== "declined";
  const channelOrder = [
    ...CHANNELS,
    ...WORKFLOWS,
    ...(showDirectMessages ? DIRECT_MESSAGES : []),
  ].map((c) => c.id);
  // Composer keystrokes and the read-only footer belong to the story channel.
  const typedText = isDemo ? composer : null;

  /** Switching channels banks the scroll position and stops any playback. */
  const selectChannel = useCallback(
    (id: string) => {
      if (id === activeId) return;
      const s = streamRef.current;
      if (s) scrollMem.current[activeId] = s.scrollTop;
      if (playingRef.current) complete();
      if (offerPlayingRef.current) completeOffer();
      if (
        feedbackRef.current === "sending" ||
        feedbackRef.current === "sent" ||
        feedbackRef.current === "replying"
      ) {
        completeFeedback();
      }
      if (id === OFFER.id && !offerDemoPlayed) {
        offerDemoPlayed = true;
        playOffer();
      }
      setActiveId(id);
    },
    [activeId, complete, completeFeedback, completeOffer, playOffer],
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
    if (!activeStoryPlaying) return;
    const s = streamRef.current;
    if (!s) return;
    const last = s.querySelector<HTMLElement>("[data-last]");
    const max = s.scrollHeight - s.clientHeight;
    if (!last || max <= 0) return;
    s.scrollTo({
      top: Math.min(Math.max(last.offsetTop - 10, 0), max),
      behavior: reducedMotion() ? "auto" : "smooth",
    });
  }, [activeIndicator, activeStoryPlaying, feedback, offerRevealed, revealed]);

  const onTabKey = (e: ReactKeyboardEvent, id: string) => {
    const i = channelOrder.indexOf(id);
    let next = -1;
    if (e.key === "ArrowDown") next = (i + 1) % channelOrder.length;
    else if (e.key === "ArrowUp") next = (i - 1 + channelOrder.length) % channelOrder.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = channelOrder.length - 1;
    else return;
    e.preventDefault();
    const id2 = channelOrder[next];
    selectChannel(id2);
    tabRefs.current[id2]?.focus();
  };

  const renderTab = (c: CadenceChannel) => {
    const selected = c.id === activeId;
    return (
      <button
        key={c.id}
        ref={(el) => {
          tabRefs.current[c.id] = el;
        }}
        id={`cad-tab-${c.id}`}
        type="button"
        role="tab"
        aria-selected={selected}
        aria-controls={`cad-panel-${c.id}`}
        tabIndex={selected ? 0 : -1}
        className={`cad-chan${selected ? " active" : ""}`}
        onClick={() => selectChannel(c.id)}
        onKeyDown={(e) => onTabKey(e, c.id)}
      >
        {c.kind === "dm" ? (
          <span className="cad-dm-avatar" aria-hidden="true">
            {c.avatar}
          </span>
        ) : (
          <span className="cad-hash" aria-hidden="true">
            {c.kind === "workflow" ? "⚡" : "#"}
          </span>
        )}
        <span className="cad-chan-name">{c.name}</span>
        {c.unread > 0 && (
          <span className="cad-unread">
            {c.unread}
            <span className="cad-sr"> unread</span>
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="cad">
      <div className="cad-rail">
        <div className="cad-workspace">
          <div className="cad-ws-tile" aria-hidden="true">
            <CadenceMark className="cad-ws-mark" />
          </div>
          <div>
            <div className="cad-ws-name">{cadenceWorkspace.name}</div>
            <div className="cad-ws-sub">{cadenceWorkspace.tagline}</div>
          </div>
        </div>

        <div
          className="cad-channels"
          role="tablist"
          aria-orientation="vertical"
          aria-label="Cadence channels, workflows, and direct messages"
        >
          <p className="cad-group" aria-hidden="true">
            Channels
          </p>
          {CHANNELS.map(renderTab)}
          <p className="cad-group" aria-hidden="true">
            Cadence workflows
          </p>
          {WORKFLOWS.map(renderTab)}
          {showDirectMessages && (
            <>
              <p className="cad-group" aria-hidden="true">
                Direct messages
              </p>
              {DIRECT_MESSAGES.map(renderTab)}
            </>
          )}
        </div>
      </div>

      <div className="cad-main">
        <div className="cad-topbar">
          <div className="cad-topbar-text">
            <h2 className="cad-topbar-title">
              {active.kind === "channel" ? `#${active.name}` : active.name}
            </h2>
            <p className="cad-topbar-topic">{active.topic}</p>
          </div>
          {/* One control, two jobs: get me past this, or show me again. */}
          {isDemo ? (
            playing ? (
              <button
                className="cad-replay"
                type="button"
                aria-label="Skip the opening conversation and show the finished report"
                onClick={skip}
              >
                <span aria-hidden="true">⏭</span> Skip animation
              </button>
            ) : (
              <button
                className="cad-replay"
                type="button"
                aria-label="Replay the opening conversation"
                onClick={play}
              >
                <span aria-hidden="true">↻</span> Replay conversation
              </button>
            )
          ) : isOffer ? (
            offerPlaying ? (
              <button
                className="cad-replay"
                type="button"
                aria-label="Skip the offer conversation and show its outcome"
                onClick={skipOffer}
              >
                <span aria-hidden="true">⏭</span> Skip animation
              </button>
            ) : (
              <button
                className="cad-replay"
                type="button"
                aria-label="Replay the offer acceptance conversation"
                onClick={playOffer}
              >
                <span aria-hidden="true">↻</span> Replay conversation
              </button>
            )
          ) : null}
        </div>

        {/* One restrained live region for the whole app: it carries the newest
            message or workflow result only, never the conversation again. */}
        <p className="cad-sr" role="status" aria-live="polite">
          {announce}
        </p>

        <section
          className="cad-stream"
          id={`cad-panel-${active.id}`}
          role="tabpanel"
          aria-labelledby={`cad-tab-${active.id}`}
          tabIndex={0}
          ref={streamRef}
        >
          <div className="cad-divider">
            <span>Today</span>
          </div>
          {messages.map((m, i) => (
            <Message
              key={m.id}
              m={m}
              last={!activeIndicator && i === messages.length - 1}
              feedback={feedbackProps}
            />
          ))}
          {/* Whoever is composing right now, wearing their own avatar. The
              words in the label carry the meaning; the dots are decoration. */}
          {activeIndicator && (
            <div className="cad-msg cad-typing" data-last="" aria-hidden="true">
              <div className="cad-avatar" style={{ background: activeIndicator.color }}>
                {activeIndicator.mark ? (
                  <CadenceMark className="cad-avatar-mark" />
                ) : (
                  activeIndicator.initials
                )}
              </div>
              <div className="cad-msg-main">
                <div className="cad-typing-row">
                  <span className="cad-dots">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span className="cad-typing-label">{activeIndicator.label}</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {typedText === null ? (
          // Read-only demo: once the command is sent the composer gives its
          // vertical space back to the message.
          <p className="cad-footnote">{cadenceFootnote}</p>
        ) : (
          <div className="cad-composer">
            {/* Never an editable control — the demo "types" into static text, so
                clicking it mid-sequence cannot hijack the composer. The
                keystroke animation is presentational and hidden from assistive
                tech; the posted message in the stream carries the content. */}
            <div className={`cad-composer-box${typedText ? " typing" : ""}`}>
              {typedText === "" ? (
                <span className="cad-composer-placeholder">
                  Message {active.kind === "channel" ? `#${active.name}` : active.name}
                </span>
              ) : (
                <span className="cad-composer-typed" aria-hidden="true">
                  <ComposerText text={typedText} />
                  <span className="cad-caret" />
                </span>
              )}
              <span className={`cad-send${typedText ? " ready" : ""}`} aria-hidden="true">
                ➤
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const CadenceApp = memo(CadenceAppImpl);
