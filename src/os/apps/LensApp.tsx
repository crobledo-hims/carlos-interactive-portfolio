import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ScrollArea } from "../ScrollArea";
import { LockGlyph } from "../icons";
import {
  lensAssessment,
  lensCandidate,
  lensCriteriaLock,
  lensCta,
  lensEvidence,
  lensGaps,
  lensResponsibleUse,
  lensRole,
  lensZones,
} from "../data/lens";
import type { LensZone } from "../data/lens";

/** The evaluation is run once per page session, like the Cadence demo. */
let lensEvaluated = false;

/**
 * The attention nudge on the evaluate button also runs once per page session.
 * Anything that proves the visitor has found the button — a hover, a focus, a
 * click — sets this too, so the nudge never argues with someone already there.
 */
let lensNudged = false;

type Phase = "idle" | "sweeping" | "done";

const SWEEP_MS = 820; // restrained evaluation state, not a progress theatre
const OVERSHOOT = 1.09; // the needle passes the reading, then settles back
const RISE = 0.45; // fraction of the sweep spent climbing

const NUDGE_DELAY_MS = 900; // let the window settle before drawing the eye
const NUDGE_RUN_MS = 4800; // three 1.6s breaths, matching the keyframes
const NUDGE_STATIC_MS = 2400; // reduced motion: hold the emphasis, then release

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

function zoneFor(score: number): LensZone {
  return lensZones.find((z) => score < z.max) ?? lensZones[lensZones.length - 1];
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
    <svg className="lens-dial" viewBox="0 0 200 112" role="presentation">
      {lensZones.map((z, i) => {
        const from = i === 0 ? 0 : lensZones[i - 1].max;
        return (
          <path key={z.label} className={`lens-dial-zone ${z.tone}`} d={arcPath(from, Math.min(z.max, 100))} />
        );
      })}

      {TICKS.map((t) => {
        const outer = pt(t, R - 9);
        const inner = pt(t, t % 50 === 0 ? R - 21 : R - 15);
        return (
          <line
            key={t}
            className={`lens-dial-tick${t % 50 === 0 ? " major" : ""}`}
            x1={outer.x}
            y1={outer.y}
            x2={inner.x}
            y2={inner.y}
          />
        );
      })}

      <path
        ref={progressRef}
        className="lens-dial-progress"
        d={arcPath(0, 100)}
        pathLength={100}
        style={{ strokeDasharray: `${dash} 100` }}
      />

      <g
        ref={needleRef}
        className="lens-dial-needle"
        style={{
          transformBox: "view-box",
          transformOrigin: `${CX}px ${CY}px`,
          transform: `rotate(${angle}deg)`,
        }}
      >
        <path d={`M${CX - 5} ${CY - 4.5} L${CX - 66} ${CY} L${CX - 5} ${CY + 4.5} L${CX + 13} ${CY} Z`} />
      </g>
      <circle className="lens-dial-hub" cx={CX} cy={CY} r="6" />
    </svg>
  );
}

/* ------------------------------------------------------------------- app */

function LensAppImpl() {
  const [panelOpen, setPanelOpen] = useState(true);
  const [criteriaOpen, setCriteriaOpen] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(true);
  const [phase, setPhase] = useState<Phase>(() => (lensEvaluated ? "done" : "idle"));
  const [cascade, setCascade] = useState(false);
  const [nudge, setNudge] = useState(false);

  const needleRef = useRef<SVGGElement | null>(null);
  const progressRef = useRef<SVGPathElement | null>(null);
  const numRef = useRef<HTMLSpanElement | null>(null);
  const zoneRef = useRef<HTMLParagraphElement | null>(null);
  const rafRef = useRef(0);
  const timerRef = useRef(0);

  const score = lensAssessment.score;
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
      lensEvaluated = true;
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
        zoneRef.current.className = `lens-zone ${z.tone}`;
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

  /**
   * Ends the nudge for the rest of the session. Dropping the class is what
   * actually cancels the animation: CSS alone cannot stop a running one, and
   * the button's existing transform transition eases the last 2.5% back.
   */
  const stopNudge = useCallback(() => {
    lensNudged = true;
    setNudge(false);
  }, []);

  // Arm the nudge a beat after the panel settles, and hold a timer behind it:
  // animationend never arrives if the tab is throttled, and reduced motion has
  // no animation to end at all.
  useEffect(() => {
    if (phase !== "idle" || lensNudged) return;
    let run = 0;
    const arm = window.setTimeout(() => {
      if (lensNudged) return;
      setNudge(true);
      run = window.setTimeout(
        () => {
          lensNudged = true;
          setNudge(false);
        },
        reducedMotion() ? NUDGE_STATIC_MS : NUDGE_RUN_MS + 400,
      );
    }, NUDGE_DELAY_MS);
    return () => {
      clearTimeout(arm);
      if (run) clearTimeout(run);
    };
  }, [phase]);

  const evaluate = useCallback(() => {
    stop();
    if (reducedMotion()) {
      setPhase("done");
      setCascade(false);
      lensEvaluated = true;
      return;
    }
    setCascade(false);
    setPhase("sweeping");
  }, [stop]);

  const reveal = (i: number): CSSProperties => ({ "--i": i }) as CSSProperties;
  const revealClass = cascade ? "lens-reveal" : undefined;

  return (
    <div className="lens">
      {/* ------------------------------------------------- browser chrome */}
      <div className="lens-chrome">
        <div className="lens-tabs">
          <div className="lens-tab active">
            <span className="lens-favicon" />
            <span className="lens-tab-title">LinkedIn Recruiter — Candidate profile</span>
            <span className="lens-tab-x">×</span>
          </div>
          <div className="lens-tab">
            <span className="lens-favicon alt" />
            <span className="lens-tab-title">Project: {lensRole.project}</span>
          </div>
          <span className="lens-newtab">+</span>
        </div>
        <div className="lens-toolbar">
          <span className="lens-nav">‹</span>
          <span className="lens-nav dim">›</span>
          <span className="lens-nav">⟳</span>
          <div className="lens-omnibox">
            <LockGlyph />
            <span>linkedin.com/talent/profile/AEQ4b2…</span>
          </div>
          <button
            className={`lens-ext${panelOpen ? " on" : ""}`}
            type="button"
            aria-pressed={panelOpen}
            onClick={() => setPanelOpen(!panelOpen)}
            title="Toggle the Lens extension panel"
          >
            <span className="lens-ext-tile">L</span>
            Lens
          </button>
        </div>
      </div>

      {/* --------------------------------------------------- page content */}
      <div className="lens-page">
        <ScrollArea className="lens-profile">
          <div className="lens-site-head">
            <span className="lens-site-mark">R</span>
            <span className="lens-site-name">Recruiter</span>
            <span className="lens-site-project">Project · {lensRole.project}</span>
          </div>

          <div className="lens-hero">
            <div className="lens-avatar">{lensCandidate.initials}</div>
            <div className="lens-hero-main">
              <div className="lens-name">{lensCandidate.name}</div>
              <div className="lens-headline">{lensCandidate.headline}</div>
              <div className="lens-meta">
                {lensCandidate.company} · {lensCandidate.location} · {lensCandidate.connections}
              </div>
              <div className="lens-open">{lensCandidate.openTo}</div>
              <div className="lens-hero-actions">
                <span className="lens-btn primary">Message</span>
                <span className="lens-btn">Save to project</span>
                <span className="lens-btn">More</span>
              </div>
            </div>
          </div>

          <section className="lens-sec">
            <h4>About</h4>
            <p>{lensCandidate.about}</p>
          </section>

          <section className="lens-sec">
            <h4>Experience</h4>
            {lensCandidate.experience.map((e) => (
              <div className="lens-exp" key={`${e.company}-${e.title}`}>
                <div className="lens-exp-logo">{e.company.slice(0, 1)}</div>
                <div>
                  <div className="lens-exp-title">{e.title}</div>
                  <div className="lens-exp-company">{e.company}</div>
                  <div className="lens-exp-dates">{e.dates}</div>
                  <p className="lens-exp-detail">{e.detail}</p>
                </div>
              </div>
            ))}
          </section>

          <section className="lens-sec">
            <h4>Skills</h4>
            <div className="lens-skills">
              {lensCandidate.skills.map((s) => (
                <span className="lens-skill" key={s}>
                  {s}
                </span>
              ))}
            </div>
          </section>

          <section className="lens-sec">
            <h4>Education</h4>
            <p>{lensCandidate.education}</p>
          </section>

          <div className="lens-fiction">Fictional profile — sample data for this portfolio demo.</div>
        </ScrollArea>

        {/* ------------------------------------------- the extension panel */}
        {panelOpen && (
          <div className="lens-panel">
            <div className="lens-panel-head">
              <span className="lens-ext-tile lg">L</span>
              <div>
                <div className="lens-panel-title">Lens</div>
                <div className="lens-panel-sub">
                  {phase === "done" ? "Evaluated against locked criteria" : "Criteria locked · not yet evaluated"}
                </div>
              </div>
              <button
                className="lens-panel-x"
                type="button"
                aria-label="Hide the Lens panel"
                onClick={() => setPanelOpen(false)}
              >
                ×
              </button>
            </div>

            <ScrollArea className="lens-panel-body">
              {/* Title, then one row carrying the lock badge and the drawer
                  toggle. Two rows is the whole card: the operational metadata
                  that used to sit between them said nothing a visitor needs. */}
              <div className="lens-role">
                <div className="lens-role-title">{lensRole.title}</div>
                <div className="lens-role-lock">
                  <span className="lens-lock-badge">
                    <LockGlyph /> Criteria locked
                  </span>
                  <button
                    type="button"
                    className="lens-criteria-toggle"
                    aria-expanded={criteriaOpen}
                    aria-controls="lens-criteria-drawer"
                    onClick={() => setCriteriaOpen(!criteriaOpen)}
                  >
                    {criteriaOpen ? "Hide locked criteria" : "View locked criteria"}
                  </button>
                </div>
              </div>

              {criteriaOpen && (
                <div className="lens-drawer" id="lens-criteria-drawer">
                  <h4>Role scope</h4>
                  <p>{lensCriteriaLock.scope}</p>
                  <h4>Non-negotiables</h4>
                  <ol>
                    {lensCriteriaLock.nonNegotiables.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ol>
                  <h4>Nice to have</h4>
                  <ol>
                    {lensCriteriaLock.niceToHaves.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ol>
                  <p className="lens-drawer-note">{lensCriteriaLock.note}</p>
                </div>
              )}

              {phase === "idle" ? (
                <div className="lens-precheck">
                  <Dial score={score} phase={phase} needleRef={needleRef} progressRef={progressRef} />
                  <p className="lens-precheck-note">{lensCta}</p>
                  <button
                    className={`lens-evaluate${nudge ? " nudge" : ""}`}
                    type="button"
                    onClick={() => {
                      stopNudge();
                      evaluate();
                    }}
                    onPointerEnter={stopNudge}
                    onFocus={stopNudge}
                    onAnimationEnd={stopNudge}
                  >
                    Evaluate candidate
                  </button>
                  <p className="lens-hitl">{lensResponsibleUse}</p>
                </div>
              ) : (
                <>
                  {/* The sweeping dial is decoration: the number changes every
                      frame, so it is hidden from assistive tech and the result
                      is announced once from the status line below. */}
                  <div
                    className={`lens-dial-stage ${phase}`}
                    aria-hidden={phase === "sweeping" ? true : undefined}
                  >
                    <Dial score={score} phase={phase} needleRef={needleRef} progressRef={progressRef} />
                    <div className="lens-readout">
                      {phase === "done" ? (
                        <>
                          <p className="lens-verdict-head">{lensAssessment.recommendation}</p>
                          <p className="lens-verdict-sub">
                            Domain context: {lensAssessment.domainContext.level}
                          </p>
                          <p className="lens-score-line">
                            <span ref={numRef}>{score}</span>
                            <small>/100</small>
                            <span ref={zoneRef} className={`lens-zone ${finalZone.tone}`}>
                              {finalZone.label}
                            </span>
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="lens-verdict-head dim">Evaluating</p>
                          <p className="lens-score-line">
                            <span ref={numRef}>0</span>
                            <small>/100</small>
                            <span ref={zoneRef} className={`lens-zone ${zoneFor(0).tone}`}>
                              {zoneFor(0).label}
                            </span>
                          </p>
                          <p className="lens-verdict-sub">Reading the profile against locked criteria</p>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="lens-sr" role="status">
                    {phase === "sweeping"
                      ? `Evaluating ${lensCandidate.name} against the locked criteria`
                      : `Recommendation: ${lensAssessment.recommendation}. Domain context ${lensAssessment.domainContext.level}. Score ${score} of 100.`}
                  </p>

                  {phase === "done" && (
                    <>
                      <div className={revealClass} style={reveal(0)}>
                        <section className="lens-block">
                          <h4>Summary</h4>
                          <p>{lensAssessment.summary}</p>
                        </section>
                      </div>

                      <div className={revealClass} style={reveal(1)}>
                        <section className="lens-block">
                          <h4>Domain context</h4>
                          <p>
                            <strong>{lensAssessment.domainContext.level}</strong>{" "}
                            {lensAssessment.domainContext.why}
                          </p>
                        </section>
                      </div>

                      <div className={revealClass} style={reveal(2)}>
                        <section className="lens-block">
                          <div className="lens-block-head">
                            <h4>Evidence used</h4>
                            <button
                              type="button"
                              className="lens-mini-toggle"
                              aria-expanded={evidenceOpen}
                              aria-controls="lens-evidence"
                              onClick={() => setEvidenceOpen(!evidenceOpen)}
                            >
                              {evidenceOpen ? "Collapse" : "Expand"}
                            </button>
                          </div>
                          {evidenceOpen && (
                            <ul className="lens-evidence" id="lens-evidence">
                              {lensEvidence.map((e) => (
                                <li key={e.conclusion}>
                                  <span className="lens-ev-conclusion">{e.conclusion}</span>
                                  <span className="lens-ev-quote">{e.quote}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </section>
                      </div>

                      <div className={revealClass} style={reveal(3)}>
                        <section className="lens-block">
                          <h4>Missing or unconfirmed evidence</h4>
                          <ul className="lens-gaps">
                            {lensGaps.map((g) => (
                              <li key={g.item}>
                                <span className="lens-gap-item">{g.item}</span>
                                <span className="lens-gap-why">{g.why}</span>
                              </li>
                            ))}
                          </ul>
                        </section>
                      </div>

                      <div className={revealClass} style={reveal(4)}>
                        <p className="lens-source">Source: {lensAssessment.source}</p>
                        <div className="lens-hitl">{lensResponsibleUse}</div>
                        <div className="lens-panel-actions">
                          <span className="lens-btn primary">Copy summary</span>
                          <span className="lens-btn">Log decision</span>
                          <button className="lens-rerun" type="button" onClick={evaluate}>
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

export const LensApp = memo(LensAppImpl);
