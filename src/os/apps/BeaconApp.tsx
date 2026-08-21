import { memo, useRef, useState } from "react";
import { ScrollArea } from "../ScrollArea";
import {
  SIGNAL_LABEL,
  beaconDefaultRole,
  beaconDisclaimer,
  beaconHowItWorks,
  beaconRoles,
  beaconSummary,
} from "../data/beacon";
import type { BeaconRole, BeaconSignal } from "../data/beacon";

/* ------------------------------------------------------------------ icons */

/**
 * One small glyph per signal. Decorative only: the written label sits beside
 * every one of them, so neither colour nor shape ever carries meaning alone.
 */
function SignalIcon({ signal }: { signal: BeaconSignal }) {
  return (
    <svg className="beacon-sig-icon" viewBox="0 0 12 12" aria-hidden="true">
      {signal === "needs-review" && <path d="M6 1.6l4.6 8.2H1.4L6 1.6zM6 5v2.1M6 8.6v.1" />}
      {signal === "watch" && <path d="M1.2 6S3.3 2.6 6 2.6 10.8 6 10.8 6 8.7 9.4 6 9.4 1.2 6 1.2 6zM6 4.8v2.4" />}
      {signal === "on-track" && <path d="M2.2 6.3l2.6 2.5 5-5.6" />}
    </svg>
  );
}

/**
 * The header mark: the same lighthouse the app icon uses, drawn small and
 * flat. Two straight beams, never rings.
 */
function BeaconMark() {
  return (
    <svg className="beacon-mark" viewBox="0 0 22 22" aria-hidden="true">
      <g fill="currentColor" opacity="0.42">
        <path d="M8.6 6.8 2 4.6v4.6Z" />
        <path d="M13.4 6.8 20 4.6v4.6Z" />
      </g>
      <g fill="currentColor">
        <path d="M8.3 18.2 9.3 9h3.4l1 9.2Z" />
        <rect x="8.4" y="7.6" width="5.2" height="1.6" rx="0.8" />
        <path d="M9.1 7.6V5.1h3.8v2.5Z" />
        <path d="M8.7 5.1 11 2.7l2.3 2.4Z" opacity="0.75" />
      </g>
      <rect x="6.6" y="18" width="8.8" height="1.9" rx="0.95" fill="currentColor" opacity="0.75" />
    </svg>
  );
}

/* ------------------------------------------------------------------ chip */

function SignalChip({ signal, small }: { signal: BeaconSignal; small?: boolean }) {
  return (
    <span className={`beacon-chip ${signal}${small ? " sm" : ""}`}>
      <SignalIcon signal={signal} />
      {SIGNAL_LABEL[signal]}
    </span>
  );
}

/* ------------------------------------------------------------------ brief */

interface BriefProps {
  role: BeaconRole;
  open: boolean;
  onToggle: () => void;
}

function Brief({ role, open, onToggle }: BriefProps) {
  return (
    <section className={`beacon-brief ${role.signal}`} aria-labelledby="beacon-brief-title">
      <p className="beacon-eyebrow">Role brief</p>

      <div className="beacon-brief-head">
        <div>
          <h3 className="beacon-brief-title" id="beacon-brief-title">
            {role.title}
          </h3>
          <p className="beacon-brief-team">{role.team}</p>
          <p className="beacon-role-meta">
            <span>Hiring manager: {role.hiringManager}</span>
            <span>{role.location}</span>
            <span>
              {role.openings} {role.openings === 1 ? "opening" : "openings"}
            </span>
          </p>
        </div>
        <div className="beacon-brief-status">
          <SignalChip signal={role.signal} />
          <p className="beacon-trend">{role.trendLabel}</p>
        </div>
      </div>

      <p className="beacon-reason">{role.reason}</p>

      <section className="beacon-pipeline" aria-label="Pipeline shape">
        <h4>Pipeline shape</h4>
        <dl>
          {role.pipeline.map((stage) => (
            <div key={stage.label}>
              <dt>{stage.label}</dt>
              <dd>{stage.count}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="beacon-role-context">
        <section>
          <h4>Priority profile</h4>
          <p>{role.priorityProfile}</p>
        </section>
        <section>
          <h4>Recent movement</h4>
          <p>{role.recentMovement}</p>
        </section>
        <section>
          <h4>Next milestone</h4>
          <p>{role.nextMilestone}</p>
        </section>
      </div>

      <div className="beacon-evidence">
        <h4>Current snapshot</h4>
        <p>
          {role.evidence.map((e, i) => (
            <span key={e}>
              {i > 0 && <span aria-hidden="true"> · </span>}
              {e}
            </span>
          ))}
        </p>
      </div>

      <dl className="beacon-next">
        <div>
          <dt>Review focus</dt>
          <dd>{role.reviewFocus}</dd>
        </div>
        <div>
          <dt>Review with</dt>
          <dd>{role.reviewWith}</dd>
        </div>
      </dl>

      <button
        type="button"
        className="beacon-why"
        aria-expanded={open}
        aria-controls="beacon-why-panel"
        onClick={onToggle}
      >
        <span className="beacon-why-caret" aria-hidden="true">
          {open ? "▾" : "▸"}
        </span>
        Why this signal
      </button>

      {open && (
        <div className="beacon-why-panel" id="beacon-why-panel">
          <p>{role.explanation}</p>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------- app */

function BeaconAppImpl() {
  const [activeId, setActiveId] = useState(beaconDefaultRole);
  const [whyOpen, setWhyOpen] = useState(false);
  const [announce, setAnnounce] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);

  const active = beaconRoles.find((r) => r.id === activeId) ?? beaconRoles[0];
  const others = beaconRoles.filter((r) => r.id !== active.id);
  const summary = beaconSummary(beaconRoles);

  // Selecting a role swaps it into the brief in place. Nothing navigates, and
  // the disclosure keeps its state so two explanations can be compared.
  const select = (role: BeaconRole) => {
    setActiveId(role.id);
    setAnnounce(`Now showing ${role.title}, ${role.team}. Signal: ${SIGNAL_LABEL[role.signal]}.`);
    bodyRef.current?.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  };

  const toggleWhy = () => setWhyOpen((v) => !v);

  return (
    <div className="beacon">
      <header className="beacon-head">
        <div className="beacon-brand">
          <BeaconMark />
          <div>
            <p className="beacon-name">Beacon</p>
            <p className="beacon-tagline">Role signals with supporting evidence</p>
          </div>
        </div>
        <p className="beacon-updated">Demo snapshot</p>
      </header>

      <p className="beacon-summary">
        {summary.map((s, i) => (
          <span key={s}>
            {i > 0 && <span aria-hidden="true"> · </span>}
            {s}
          </span>
        ))}
      </p>

      {/* One polite region for the whole app: it carries the newly selected
          role only, never the brief again. */}
      <p className="beacon-sr" role="status" aria-live="polite">
        {announce}
      </p>

      <ScrollArea className="beacon-body" innerRef={bodyRef}>
        <Brief role={active} open={whyOpen} onToggle={toggleWhy} />

        <h3 className="beacon-eyebrow standalone">Other roles</h3>
        <ul className="beacon-rows">
          {others.map((r) => (
            <li key={r.id}>
              <button type="button" className={`beacon-row ${r.signal}`} onClick={() => select(r)}>
                <span className="beacon-row-main">
                  <span className="beacon-row-title">{r.title}</span>
                  <span className="beacon-row-team">{r.team}</span>
                </span>
                <SignalChip signal={r.signal} small />
                <span className="beacon-row-meta">
                  {r.pipeline.reduce((sum, stage) => sum + stage.count, 0)} active
                  <span aria-hidden="true"> · </span>
                  {r.evidence[0]}
                  <span aria-hidden="true"> · </span>
                  HM: {r.hiringManager}
                </span>
                <span className="beacon-row-reason">{r.reason}</span>
              </button>
            </li>
          ))}
        </ul>

        <section className="beacon-how" aria-label="How Beacon works">
          <p className="beacon-steps">
            {beaconHowItWorks.steps.map((s, i) => (
              <span key={s}>
                {i > 0 && (
                  <span className="beacon-arrow" aria-hidden="true">
                    →
                  </span>
                )}
                {s}
              </span>
            ))}
          </p>
          <p className="beacon-how-body">{beaconHowItWorks.body}</p>
        </section>

        <footer className="beacon-foot">
          <p className="beacon-disclaimer">{beaconDisclaimer}</p>
        </footer>
      </ScrollArea>
    </div>
  );
}

export const BeaconApp = memo(BeaconAppImpl);
