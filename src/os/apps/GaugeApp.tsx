import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ScrollArea } from "../ScrollArea";
import { LockGlyph } from "../icons";
import {
  gaugeCandidate,
  gaugeCriteria,
  gaugeCta,
  gaugeRecommendation,
  gaugeRole,
  gaugeZones,
} from "../data/gauge";
import type { CriterionStatus, GaugeZone } from "../data/gauge";

const MARK: Record<CriterionStatus, string> = { pass: "✓", partial: "!", fail: "✕" };

/** The evaluation is run once per page session, like the Rex demo. */
let gaugeEvaluated = false;

type Phase = "idle" | "sweeping" | "done";

const SWEEP_MS = 1900;
const OVERSHOOT = 1.09; // the needle passes the reading, then settles back
const RISE = 0.45; // fraction of the sweep spent climbing

function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Needle position over time: a smooth climb past the reading, then a damped
 * settle onto it. f(0) = 0 and f(1) = target exactly, so wherever the frames
 * land the dial ends on the real score.
 */
function sweepValue(t: number, target: number) {
  if (t <= 0) return 0;
  if (t >= 1) return target;
  if (t < RISE) {
    const u = t / RISE;
    return target * OVERSHOOT * (u * u * (3 - 2 * u));
  }
  const u = (t - RISE) / (1 - RISE);
  const decay = Math.exp(-5 * u) * Math.cos(6.2 * u);
  return target * (1 + (OVERSHOOT - 1) * decay);
}

function zoneFor(score: number): GaugeZone {
  return gaugeZones.find((z) => score < z.max) ?? gaugeZones[gaugeZones.length - 1];
}

/* --------------------------------------------------------------- the dial */

const CX = 100;
const CY = 100;
const R = 78;

function pt(score: number, r = R) {
  const a = (score / 100) * Math.PI;
  return { x: CX - r * Math.cos(a), y: CY - r * Math.sin(a) };
}

function arcPath(from: number, to: number, r = R) {
  const p1 = pt(from, r);
  const p2 = pt(to, r);
  return `M${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A${r} ${r} 0 0 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
}

const TICKS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

interface DialProps {
  score: number;
  phase: Phase;
  needleRef: React.RefObject<SVGGElement | null>;
  progressRef: React.RefObject<SVGPathElement | null>;
}

function Dial({ score, phase, needleRef, progressRef }: DialProps) {
  // Rendered from state so a remount (or a skipped animation) still lands on
  // the right reading; the sweep overwrites these same properties per frame.
  const angle = phase === "idle" ? 0 : (score / 100) * 180;
  const dash = phase === "idle" ? 0 : score;

  return (
    <svg className="gauge-dial" viewBox="0 0 200 112" role="presentation">
      {gaugeZones.map((z, i) => {
        const from = i === 0 ? 0 : gaugeZones[i - 1].max;
        return (
          <path key={z.label} className={`gauge-dial-zone ${z.tone}`} d={arcPath(from, Math.min(z.max, 100))} />
        );
      })}

      {TICKS.map((t) => {
        const outer = pt(t, R - 9);
        const inner = pt(t, t % 50 === 0 ? R - 21 : R - 15);
        return (
          <line
            key={t}
            className={`gauge-dial-tick${t % 50 === 0 ? " major" : ""}`}
            x1={outer.x}
            y1={outer.y}
            x2={inner.x}
            y2={inner.y}
          />
        );
      })}

      <path
        ref={progressRef}
        className="gauge-dial-progress"
        d={arcPath(0, 100)}
        pathLength={100}
        style={{ strokeDasharray: `${dash} 100` }}
      />

      <g
        ref={needleRef}
        className="gauge-dial-needle"
        style={{
          transformBox: "view-box",
          transformOrigin: `${CX}px ${CY}px`,
          transform: `rotate(${angle}deg)`,
        }}
      >
        <path d={`M${CX - 5} ${CY - 4.5} L${CX - 66} ${CY} L${CX - 5} ${CY + 4.5} L${CX + 13} ${CY} Z`} />
      </g>
      <circle className="gauge-dial-hub" cx={CX} cy={CY} r="6" />
    </svg>
  );
}

/* ------------------------------------------------------------------- app */

function GaugeAppImpl() {
  const [panelOpen, setPanelOpen] = useState(true);
  const [phase, setPhase] = useState<Phase>(() => (gaugeEvaluated ? "done" : "idle"));
  const [cascade, setCascade] = useState(false);

  const needleRef = useRef<SVGGElement | null>(null);
  const progressRef = useRef<SVGPathElement | null>(null);
  const numRef = useRef<HTMLSpanElement | null>(null);
  const zoneRef = useRef<HTMLParagraphElement | null>(null);
  const rafRef = useRef(0);
  const timerRef = useRef(0);

  const score = gaugeRecommendation.score;
  const finalZone = zoneFor(score);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    rafRef.current = 0;
    timerRef.current = 0;
  }, []);

  useEffect(() => stop, [stop]);

  // The sweep runs from an effect so the dial's refs are attached before the
  // first frame, and it only ever starts from a click.
  useEffect(() => {
    if (phase !== "sweeping") return;
    const start = performance.now();

    const land = () => {
      stop();
      setPhase("done");
      setCascade(true);
      gaugeEvaluated = true;
    };

    const frame = (now: number) => {
      const t = Math.min((now - start) / SWEEP_MS, 1);
      const v = sweepValue(t, score);
      const shown = Math.max(0, Math.min(v, score));
      if (needleRef.current) {
        needleRef.current.style.transform = `rotate(${((v / 100) * 180).toFixed(2)}deg)`;
      }
      if (progressRef.current) {
        progressRef.current.style.strokeDasharray = `${Math.max(0, Math.min(v, 100)).toFixed(2)} 100`;
      }
      if (numRef.current) numRef.current.textContent = String(Math.round(shown));
      if (zoneRef.current) {
        const z = zoneFor(shown);
        zoneRef.current.textContent = z.label;
        zoneRef.current.className = `gauge-zone ${z.tone}`;
      }
      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame);
        return;
      }
      land();
    };

    rafRef.current = requestAnimationFrame(frame);
    // If rAF is throttled (hidden tab), still land on the real reading.
    timerRef.current = window.setTimeout(land, SWEEP_MS + 900);
    return stop;
  }, [phase, score, stop]);

  const evaluate = useCallback(() => {
    stop();
    if (reducedMotion()) {
      setPhase("done");
      setCascade(false);
      gaugeEvaluated = true;
      return;
    }
    setCascade(false);
    setPhase("sweeping");
  }, [stop]);

  const reveal = (i: number): CSSProperties => ({ "--i": i }) as CSSProperties;
  const revealClass = cascade ? "gauge-reveal" : undefined;

  return (
    <div className="gauge">
      {/* ------------------------------------------------- browser chrome */}
      <div className="gauge-chrome">
        <div className="gauge-tabs">
          <div className="gauge-tab active">
            <span className="gauge-favicon" />
            <span className="gauge-tab-title">LinkedIn Recruiter — Candidate profile</span>
            <span className="gauge-tab-x">×</span>
          </div>
          <div className="gauge-tab">
            <span className="gauge-favicon alt" />
            <span className="gauge-tab-title">Project: {gaugeRole.project}</span>
          </div>
          <span className="gauge-newtab">+</span>
        </div>
        <div className="gauge-toolbar">
          <span className="gauge-nav">‹</span>
          <span className="gauge-nav dim">›</span>
          <span className="gauge-nav">⟳</span>
          <div className="gauge-omnibox">
            <LockGlyph />
            <span>linkedin.com/talent/profile/AEQ4b2…</span>
          </div>
          <button
            className={`gauge-ext${panelOpen ? " on" : ""}`}
            type="button"
            aria-pressed={panelOpen}
            onClick={() => setPanelOpen(!panelOpen)}
            title="Toggle the Gauge extension panel"
          >
            <span className="gauge-ext-tile">G</span>
            Gauge
          </button>
        </div>
      </div>

      {/* --------------------------------------------------- page content */}
      <div className="gauge-page">
        <ScrollArea className="gauge-profile">
          <div className="gauge-site-head">
            <span className="gauge-site-mark">R</span>
            <span className="gauge-site-name">Recruiter</span>
            <span className="gauge-site-project">Project · {gaugeRole.project}</span>
          </div>

          <div className="gauge-hero">
            <div className="gauge-avatar">{gaugeCandidate.initials}</div>
            <div className="gauge-hero-main">
              <div className="gauge-name">{gaugeCandidate.name}</div>
              <div className="gauge-headline">{gaugeCandidate.headline}</div>
              <div className="gauge-meta">
                {gaugeCandidate.company} · {gaugeCandidate.location} · {gaugeCandidate.connections}
              </div>
              <div className="gauge-open">{gaugeCandidate.openTo}</div>
              <div className="gauge-hero-actions">
                <span className="gauge-btn primary">Message</span>
                <span className="gauge-btn">Save to project</span>
                <span className="gauge-btn">More</span>
              </div>
            </div>
          </div>

          <section className="gauge-sec">
            <h4>About</h4>
            <p>{gaugeCandidate.about}</p>
          </section>

          <section className="gauge-sec">
            <h4>Experience</h4>
            {gaugeCandidate.experience.map((e) => (
              <div className="gauge-exp" key={`${e.company}-${e.title}`}>
                <div className="gauge-exp-logo">{e.company.slice(0, 1)}</div>
                <div>
                  <div className="gauge-exp-title">{e.title}</div>
                  <div className="gauge-exp-company">{e.company}</div>
                  <div className="gauge-exp-dates">{e.dates}</div>
                  <p className="gauge-exp-detail">{e.detail}</p>
                </div>
              </div>
            ))}
          </section>

          <section className="gauge-sec">
            <h4>Skills</h4>
            <div className="gauge-skills">
              {gaugeCandidate.skills.map((s) => (
                <span className="gauge-skill" key={s}>
                  {s}
                </span>
              ))}
            </div>
          </section>

          <section className="gauge-sec">
            <h4>Education</h4>
            <p>{gaugeCandidate.education}</p>
          </section>

          <div className="gauge-fiction">Fictional profile — sample data for this portfolio demo.</div>
        </ScrollArea>

        {/* ------------------------------------------- the extension panel */}
        {panelOpen && (
          <div className="gauge-panel">
            <div className="gauge-panel-head">
              <span className="gauge-ext-tile lg">G</span>
              <div>
                <div className="gauge-panel-title">Gauge</div>
                <div className="gauge-panel-sub">
                  {phase === "done" ? "Evaluated against locked criteria" : "Criteria locked · not yet evaluated"}
                </div>
              </div>
              <button
                className="gauge-panel-x"
                type="button"
                aria-label="Hide the Gauge panel"
                onClick={() => setPanelOpen(false)}
              >
                ×
              </button>
            </div>

            <ScrollArea className="gauge-panel-body">
              <div className="gauge-role">
                <div className="gauge-role-title">{gaugeRole.title}</div>
                <div className="gauge-role-meta">
                  <LockGlyph /> {gaugeRole.locked}
                </div>
                <div className="gauge-role-stage">{gaugeRole.stage}</div>
              </div>

              {phase === "idle" ? (
                <div className="gauge-precheck">
                  <Dial score={score} phase={phase} needleRef={needleRef} progressRef={progressRef} />
                  <p className="gauge-precheck-note">
                    Nothing has been scored yet. Gauge reads this profile against the locked criteria and
                    returns a recommendation — it never rejects anyone.
                  </p>
                  <button className="gauge-evaluate" type="button" onClick={evaluate}>
                    {gaugeCta}
                  </button>
                </div>
              ) : (
                <>
                  {/* The sweeping dial is decoration: the number changes every
                      frame, so it is hidden from assistive tech and the result
                      is announced once from the status line below. */}
                  <div
                    className={`gauge-dial-stage ${phase}`}
                    aria-hidden={phase === "sweeping" ? true : undefined}
                  >
                    <Dial score={score} phase={phase} needleRef={needleRef} progressRef={progressRef} />
                    <div className="gauge-readout">
                      <p className="gauge-score">
                        <span ref={numRef}>{phase === "done" ? score : 0}</span>
                        <small>/100</small>
                      </p>
                      <p
                        ref={zoneRef}
                        className={`gauge-zone ${phase === "done" ? finalZone.tone : zoneFor(0).tone}`}
                      >
                        {phase === "done" ? finalZone.label : zoneFor(0).label}
                      </p>
                      <p className="gauge-verdict-line">
                        {phase === "done" ? gaugeRecommendation.verdict : "Evaluating against locked criteria…"}
                      </p>
                    </div>
                  </div>

                  <p className="gauge-sr" role="status">
                    {phase === "sweeping"
                      ? `Evaluating ${gaugeCandidate.name} against the locked criteria`
                      : `Score ${score} of 100. ${finalZone.label}. ${gaugeRecommendation.verdict}.`}
                  </p>

                  {phase === "done" && (
                    <>
                      <div className={revealClass} style={reveal(0)}>
                        <div className="gauge-crit-head">
                          Criteria checks
                          <span>
                            {gaugeCriteria.filter((c) => c.status === "pass").length}/{gaugeCriteria.length} clear
                          </span>
                        </div>
                      </div>
                      <ul className="gauge-crits">
                        {gaugeCriteria.map((c, i) => (
                          <li className={`gauge-crit ${c.status} ${revealClass ?? ""}`} key={c.id} style={reveal(i + 1)}>
                            <span className="gauge-mark" aria-hidden="true">
                              {MARK[c.status]}
                            </span>
                            <div>
                              <div className="gauge-crit-label">{c.label}</div>
                              <div className="gauge-crit-weight">
                                {c.weight} · {c.status === "pass" ? "Met" : c.status === "partial" ? "Partial" : "Not evidenced"}
                              </div>
                              <div className="gauge-crit-evidence">{c.evidence}</div>
                            </div>
                          </li>
                        ))}
                      </ul>

                      <div className={revealClass} style={reveal(gaugeCriteria.length + 1)}>
                        <div className="gauge-summary">
                          <h5>Why</h5>
                          <p>{gaugeRecommendation.summary}</p>
                          <h5>Probe on the screen</h5>
                          <ul>
                            {gaugeRecommendation.probe.map((p) => (
                              <li key={p}>{p}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className={revealClass} style={reveal(gaugeCriteria.length + 2)}>
                        <div className="gauge-hitl">{gaugeRecommendation.disclaimer}</div>
                        <div className="gauge-panel-actions">
                          <span className="gauge-btn primary">Copy summary</span>
                          <span className="gauge-btn">Log decision</span>
                          <button className="gauge-rerun" type="button" onClick={evaluate}>
                            <span aria-hidden="true">↻</span> Re-run evaluation
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}

export const GaugeApp = memo(GaugeAppImpl);
