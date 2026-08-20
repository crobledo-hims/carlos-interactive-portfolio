import { memo, useState } from "react";
import { ScrollArea } from "../ScrollArea";
import { LockGlyph } from "../icons";
import { gaugeCandidate, gaugeCriteria, gaugeRecommendation, gaugeRole } from "../data/gauge";
import type { CriterionStatus } from "../data/gauge";

const MARK: Record<CriterionStatus, string> = { pass: "✓", partial: "!", fail: "✕" };

function ScoreArc({ score }: { score: number }) {
  // 180° arc, filled proportionally to the score.
  const r = 46;
  const c = Math.PI * r;
  const filled = (score / 100) * c;
  return (
    <svg className="gauge-arc" viewBox="0 0 120 68" aria-label={`Score ${score} of 100`} role="img">
      <path d="M14 58a46 46 0 0 1 92 0" className="gauge-arc-track" />
      <path
        d="M14 58a46 46 0 0 1 92 0"
        className="gauge-arc-fill"
        strokeDasharray={`${filled.toFixed(1)} ${c.toFixed(1)}`}
      />
      <text x="60" y="52" textAnchor="middle" className="gauge-arc-num">
        {score}
      </text>
    </svg>
  );
}

function GaugeAppImpl() {
  const [panelOpen, setPanelOpen] = useState(true);

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
                <div className="gauge-panel-sub">Evaluated against locked criteria</div>
              </div>
              <button className="gauge-panel-x" onClick={() => setPanelOpen(false)} title="Hide panel">
                ×
              </button>
            </div>

            <ScrollArea className="gauge-panel-body">
              <div className="gauge-role">
                <div className="gauge-role-title">{gaugeRole.title}</div>
                <div className="gauge-role-meta">
                  <LockGlyph /> {gaugeRole.locked}
                </div>
              </div>

              <div className="gauge-verdict">
                <ScoreArc score={gaugeRecommendation.score} />
                <div>
                  <div className="gauge-band">{gaugeRecommendation.band}</div>
                  <div className="gauge-action">{gaugeRecommendation.verdict}</div>
                </div>
              </div>

              <div className="gauge-crit-head">
                Criteria checks
                <span>
                  {gaugeCriteria.filter((c) => c.status === "pass").length}/{gaugeCriteria.length} clear
                </span>
              </div>
              <ul className="gauge-crits">
                {gaugeCriteria.map((c) => (
                  <li className={`gauge-crit ${c.status}`} key={c.id}>
                    <span className="gauge-mark">{MARK[c.status]}</span>
                    <div>
                      <div className="gauge-crit-label">{c.label}</div>
                      <div className="gauge-crit-weight">{c.weight}</div>
                      <div className="gauge-crit-evidence">{c.evidence}</div>
                    </div>
                  </li>
                ))}
              </ul>

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

              <div className="gauge-hitl">{gaugeRecommendation.disclaimer}</div>
              <div className="gauge-panel-actions">
                <span className="gauge-btn primary">Copy summary</span>
                <span className="gauge-btn">Log decision</span>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}

export const GaugeApp = memo(GaugeAppImpl);
