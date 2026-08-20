import { useCallback, useEffect, useRef, useState } from "react";
import {
  WORDS_PER_MINUTE,
  speakingTime,
  talkClarifications,
  talkFixtures,
  talkGuardrails,
  talkOverrides,
  talkSources,
  wordCount,
} from "../../data/relay";
import type { TalkVariant } from "../../data/relay";
import { reducedMotion } from "./helpers";
import { Guardrails, Segmented, SourceList, Synthetic } from "./parts";

export type TalkPhase = "gaps" | "working" | "ready";

interface Props {
  phase: TalkPhase;
  variant: TalkVariant;
  screen: boolean;
  onGenerate: () => void;
  onVariant: (v: TalkVariant) => void;
  onScreen: (on: boolean) => void;
  onReset: () => void;
}

const VARIANTS: { id: TalkVariant; label: string }[] = [
  { id: "base", label: "Default" },
  { id: "short", label: "Shorten" },
  { id: "technical", label: "Add technical depth" },
  { id: "conversational", label: "More conversational" },
];

/* ------------------------------------------------------------ screen mode */

function ScreenMode({
  paragraphs,
  onClose,
}: {
  paragraphs: string[];
  onClose: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const [playing, setPlaying] = useState(false);
  const calm = reducedMotion();

  const words = wordCount(paragraphs);
  const time = speakingTime(paragraphs);

  useEffect(() => {
    rootRef.current?.focus({ preventScroll: true });
  }, []);

  const updateBar = useCallback(() => {
    const el = scrollRef.current;
    const bar = barRef.current;
    if (!el || !bar) return;
    const max = el.scrollHeight - el.clientHeight;
    bar.style.width = `${max <= 0 ? 100 : Math.min(100, (el.scrollTop / max) * 100)}%`;
  }, []);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    setPlaying(false);
  }, []);

  useEffect(() => () => stop(), [stop]);

  const start = useCallback(() => {
    const el = scrollRef.current;
    if (!el || calm) return;
    const max = el.scrollHeight - el.clientHeight;
    if (max <= 0) return;
    setPlaying(true);
    // Advance at the same pace the script is written to be read at.
    const remainingWords = words * (1 - el.scrollTop / max);
    const durationMs = (remainingWords / WORDS_PER_MINUTE) * 60000;
    const startTop = el.scrollTop;
    const t0 = performance.now();
    const step = (now: number) => {
      const el2 = scrollRef.current;
      if (!el2) return;
      const t = Math.min((now - t0) / durationMs, 1);
      el2.scrollTop = startTop + (max - startTop) * t;
      updateBar();
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }
      rafRef.current = 0;
      setPlaying(false);
    };
    rafRef.current = requestAnimationFrame(step);
  }, [calm, updateBar, words]);

  const reset = useCallback(() => {
    stop();
    const el = scrollRef.current;
    if (el) el.scrollTop = 0;
    updateBar();
  }, [stop, updateBar]);

  return (
    <div
      className="relay-screen"
      role="dialog"
      aria-modal="true"
      aria-label="Talk track, screen mode"
      tabIndex={-1}
      ref={rootRef}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="relay-screen-bar">
        <div className="relay-screen-meta">
          <strong>{time}</strong>
          <span>estimated at {WORDS_PER_MINUTE} words per minute</span>
        </div>
        <div className="relay-screen-controls">
          {calm ? (
            <span className="relay-screen-calm">Auto-scroll off while reduced motion is on</span>
          ) : (
            <button type="button" className="relay-btn sm" onClick={playing ? stop : start}>
              {playing ? "Pause" : "Start"}
            </button>
          )}
          <button type="button" className="relay-btn sm ghost" onClick={reset}>
            Reset
          </button>
          <button type="button" className="relay-btn sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <div className="relay-screen-progress" aria-hidden="true">
        <span ref={barRef} />
      </div>
      <div className="relay-screen-scroll" ref={scrollRef} onScroll={updateBar}>
        <div className="relay-screen-text">
          {paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <p className="relay-screen-end">End of script</p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- the panel */

export function TalkTrack({ phase, variant, screen, onGenerate, onVariant, onScreen, onReset }: Props) {
  const fixture = talkFixtures[variant];
  const sources = talkSources.map((c) =>
    c.id === "overrides" && phase !== "gaps"
      ? { ...c, lines: talkOverrides, empty: false, note: "Supplied after the clarifying questions" }
      : c,
  );

  return (
    <div className="relay-panel">
      <header className="relay-panel-head">
        <div>
          <h2 className="relay-h2">Talk Track</h2>
          <p className="relay-sub">
            A recruiter-screen script written in Carlos's voice, to be read aloud on the call.
          </p>
        </div>
        <Synthetic />
      </header>

      <div className="relay-body">
        <div className="relay-col-inputs">
          <SourceList cards={sources} title="Role context" />
          <p className="relay-priority">Intake notes, then roadmap, then job description. Overrides win.</p>
          <Guardrails items={talkGuardrails} />
        </div>

        <div className="relay-col-output">
          {phase !== "ready" ? (
            <section className="relay-clarify">
              <h3 className="relay-h3">Clarification needed before drafting</h3>
              <p className="relay-clarify-lead">
                The intake notes cover the work, but three things are missing. The workflow asks rather than
                inventing an answer.
              </p>
              <ol className="relay-clarify-list">
                {talkClarifications.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ol>
              <button
                type="button"
                className="relay-btn primary"
                onClick={onGenerate}
                disabled={phase === "working"}
              >
                {phase === "working" ? "Drafting…" : "Use sample answers and draft"}
              </button>
              <p className="relay-clarify-foot">
                These go back to the hiring manager. The answers land in the overrides card, and the script
                is written from them.
              </p>
            </section>
          ) : (
            <>
              <div className="relay-controls">
                <Segmented label="Revision" value={variant} options={VARIANTS} onChange={onVariant} />
                <button type="button" className="relay-btn sm" onClick={() => onScreen(true)}>
                  Screen mode
                </button>
                <button type="button" className="relay-btn ghost sm" onClick={onReset}>
                  Reset
                </button>
              </div>
              <p className="relay-variant-note">
                {fixture.note}. About {speakingTime(fixture.paragraphs)} spoken, {wordCount(fixture.paragraphs)}{" "}
                words.
              </p>
              <article className="relay-script">
                {fixture.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </article>
            </>
          )}
        </div>
      </div>

      {screen && phase === "ready" && (
        <ScreenMode paragraphs={fixture.paragraphs} onClose={() => onScreen(false)} />
      )}
    </div>
  );
}
