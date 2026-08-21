import { memo, useState } from "react";
import { ScrollArea } from "../ScrollArea";
import {
  SIGNAL_LABEL,
  pulseDefaultRole,
  pulseDisclaimer,
  pulseEvidence,
  pulseHowItWorks,
  pulseRoles,
  pulseSummary,
} from "../data/pulse";
import type { PulseRole, PulseSignal } from "../data/pulse";

/* ------------------------------------------------------------------ icons */

/**
 * One small glyph per signal. Decorative only: the written label sits beside
 * every one of them, so neither colour nor shape ever carries meaning alone.
 */
function SignalIcon({ signal }: { signal: PulseSignal }) {
  return (
    <svg className="pulse-sig-icon" viewBox="0 0 12 12" aria-hidden="true">
      {signal === "needs-action" && <path d="M6 1.6l4.6 8.2H1.4L6 1.6zM6 5v2.1M6 8.6v.1" />}
      {signal === "watch" && <path d="M1.2 6S3.3 2.6 6 2.6 10.8 6 10.8 6 8.7 9.4 6 9.4 1.2 6 1.2 6zM6 4.8v2.4" />}
      {signal === "on-track" && <path d="M2.2 6.3l2.6 2.5 5-5.6" />}
    </svg>
  );
}

/** The header motif: a quiet waveform, not a chart. */
function Waveform() {
  return (
    <svg className="pulse-wave" viewBox="0 0 44 14" aria-hidden="true">
      <path d="M1 7h6l2.5-5 3 10 3-8 2.5 3H26l2.5-4 3 8 2.5-4h7" />
    </svg>
  );
}

/* ------------------------------------------------------------------ chip */

function SignalChip({ signal, small }: { signal: PulseSignal; small?: boolean }) {
  return (
    <span className={`pulse-chip ${signal}${small ? " sm" : ""}`}>
      <SignalIcon signal={signal} />
      {SIGNAL_LABEL[signal]}
    </span>
  );
}

/* ------------------------------------------------------------------ brief */

interface BriefProps {
  role: PulseRole;
  open: boolean;
  onToggle: () => void;
}

function Brief({ role, open, onToggle }: BriefProps) {
  const evidence = pulseEvidence(role);
  return (
    <section className={`pulse-brief ${role.signal}`} aria-labelledby="pulse-brief-title">
      <p className="pulse-eyebrow">Focus now</p>

      <div className="pulse-brief-head">
        <div>
          <h3 className="pulse-brief-title" id="pulse-brief-title">
            {role.title}
          </h3>
          <p className="pulse-brief-team">{role.team}</p>
        </div>
        <div className="pulse-brief-status">
          <SignalChip signal={role.signal} />
          <p className="pulse-trend">{role.trendLabel}</p>
        </div>
      </div>

      <p className="pulse-reason">{role.reason}</p>

      <div className="pulse-evidence">
        <h4>Observed evidence</h4>
        <p>
          {evidence.map((e, i) => (
            <span key={e}>
              {i > 0 && <span aria-hidden="true"> · </span>}
              {e}
            </span>
          ))}
        </p>
      </div>

      <dl className="pulse-next">
        <div>
          <dt>Suggested review</dt>
          <dd>{role.suggestedReview}</dd>
        </div>
        <div>
          <dt>Owner</dt>
          <dd>{role.owner}</dd>
        </div>
      </dl>

      <button
        type="button"
        className="pulse-why"
        aria-expanded={open}
        aria-controls="pulse-why-panel"
        onClick={onToggle}
      >
        <span className="pulse-why-caret" aria-hidden="true">
          {open ? "▾" : "▸"}
        </span>
        Why this signal
      </button>

      {open && (
        <div className="pulse-why-panel" id="pulse-why-panel">
          <p>{role.explanation}</p>
          <p className="pulse-why-note">
            Pulse is surfacing this condition for review. It does not determine the cause.
          </p>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------- app */

function PulseAppImpl() {
  const [activeId, setActiveId] = useState(pulseDefaultRole);
  const [whyOpen, setWhyOpen] = useState(false);
  const [announce, setAnnounce] = useState("");

  const active = pulseRoles.find((r) => r.id === activeId) ?? pulseRoles[0];
  const others = pulseRoles.filter((r) => r.id !== active.id);
  const summary = pulseSummary(pulseRoles);

  // Selecting a role swaps it into the brief in place. Nothing navigates, and
  // the disclosure keeps its state so two explanations can be compared.
  const select = (role: PulseRole) => {
    setActiveId(role.id);
    setAnnounce(`Now showing ${role.title}, ${role.team}. Signal: ${SIGNAL_LABEL[role.signal]}.`);
  };

  const toggleWhy = () => setWhyOpen((v) => !v);

  return (
    <div className="pulse">
      <header className="pulse-head">
        <div className="pulse-brand">
          <Waveform />
          <div>
            <p className="pulse-name">Pulse</p>
            <p className="pulse-tagline">Explainable role intelligence</p>
          </div>
        </div>
        <p className="pulse-updated">Updated today</p>
      </header>

      <p className="pulse-summary">
        {summary.map((s, i) => (
          <span key={s}>
            {i > 0 && <span aria-hidden="true"> · </span>}
            {s}
          </span>
        ))}
      </p>

      {/* One polite region for the whole app: it carries the newly selected
          role only, never the brief again. */}
      <p className="pulse-sr" role="status" aria-live="polite">
        {announce}
      </p>

      <ScrollArea className="pulse-body">
        <Brief role={active} open={whyOpen} onToggle={toggleWhy} />

        <h3 className="pulse-eyebrow standalone">Other signals</h3>
        <ul className="pulse-rows">
          {others.map((r) => (
            <li key={r.id}>
              <button type="button" className={`pulse-row ${r.signal}`} onClick={() => select(r)}>
                <span className="pulse-row-main">
                  <span className="pulse-row-title">{r.title}</span>
                  <span className="pulse-row-team">{r.team}</span>
                </span>
                <SignalChip signal={r.signal} small />
                <span className="pulse-row-reason">{r.reason}</span>
              </button>
            </li>
          ))}
        </ul>

        <section className="pulse-how" aria-label="How Pulse works">
          <p className="pulse-steps">
            {pulseHowItWorks.steps.map((s, i) => (
              <span key={s}>
                {i > 0 && (
                  <span className="pulse-arrow" aria-hidden="true">
                    →
                  </span>
                )}
                {s}
              </span>
            ))}
          </p>
          <p className="pulse-how-body">{pulseHowItWorks.body}</p>
        </section>

        <footer className="pulse-foot">
          <p className="pulse-disclaimer">{pulseDisclaimer.primary}</p>
          <p className="pulse-disclaimer sub">{pulseDisclaimer.secondary}</p>
        </footer>
      </ScrollArea>
    </div>
  );
}

export const PulseApp = memo(PulseAppImpl);
