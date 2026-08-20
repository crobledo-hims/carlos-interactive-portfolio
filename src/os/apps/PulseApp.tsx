import { memo, useState } from "react";
import { ScrollArea } from "../ScrollArea";
import { pulseForecast, pulseRisks, pulseRoles, pulseSummary } from "../data/pulse";
import type { Health, PulseRole } from "../data/pulse";

const HEALTH_LABEL: Record<Health, string> = {
  green: "On track",
  yellow: "Watch",
  red: "At risk",
};

/* ------------------------------------------------------------- sparkline */

function Sparkline({ values, health }: { values: number[]; health: Health }) {
  const w = 104;
  const h = 30;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = Math.max(max - min, 1);
  const pts = values
    .map((v, i) => {
      const x = (i * w) / (values.length - 1);
      const y = h - 3 - ((v - min) / span) * (h - 6);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg className={`pulse-spark ${health}`} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline points={pts} fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* -------------------------------------------------------------- forecast */

const CW = 640;
const CH = 236;
const PAD = { l: 30, r: 14, t: 16, b: 26 };

function px(i: number, n: number) {
  return PAD.l + (i * (CW - PAD.l - PAD.r)) / (n - 1);
}
function py(v: number) {
  return CH - PAD.b - (v / pulseForecast.max) * (CH - PAD.t - PAD.b);
}
function linePath(vals: (number | null)[]) {
  let d = "";
  vals.forEach((v, i) => {
    if (v === null) return;
    d += `${d ? "L" : "M"}${px(i, vals.length).toFixed(1)} ${py(v).toFixed(1)} `;
  });
  return d.trim();
}

function ForecastChart() {
  const { months, actual, projected, plan, max } = pulseForecast;
  const n = months.length;
  const areaTop = linePath(actual);
  const lastActual = actual.reduce<number>((acc, v, i) => (v === null ? acc : i), 0);
  const area = areaTop
    ? `${areaTop} L${px(lastActual, n).toFixed(1)} ${py(0).toFixed(1)} L${px(0, n).toFixed(1)} ${py(0).toFixed(1)} Z`
    : "";

  return (
    <svg className="pulse-chart" viewBox={`0 0 ${CW} ${CH}`} role="img" aria-label="Cumulative hires versus plan">
      <defs>
        <linearGradient id="pulseFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6f8ff0" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#6f8ff0" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0, max / 3, (max * 2) / 3, max].map((v) => (
        <g key={v}>
          <line className="pulse-gridline" x1={PAD.l} x2={CW - PAD.r} y1={py(v)} y2={py(v)} />
          <text className="pulse-axis" x={PAD.l - 8} y={py(v) + 3.5} textAnchor="end">
            {Math.round(v)}
          </text>
        </g>
      ))}

      {area && <path d={area} fill="url(#pulseFill)" />}
      <path className="pulse-plan" d={linePath(plan)} />
      <path className="pulse-actual" d={linePath(actual)} />
      <path className="pulse-projected" d={linePath(projected)} />

      {actual.map((v, i) =>
        v === null ? null : <circle key={`a${i}`} className="pulse-dot" cx={px(i, n)} cy={py(v)} r="3.4" />,
      )}
      {projected.map((v, i) =>
        v === null || i === lastActual ? null : (
          <circle key={`p${i}`} className="pulse-dot ghost" cx={px(i, n)} cy={py(v)} r="3.2" />
        ),
      )}

      {months.map((m, i) => (
        <text key={m} className="pulse-axis" x={px(i, n)} y={CH - 8} textAnchor="middle">
          {m}
        </text>
      ))}
    </svg>
  );
}

/* ----------------------------------------------------------- role cards */

function RoleCard({ role, active, onSelect }: { role: PulseRole; active: boolean; onSelect: () => void }) {
  return (
    <button className={`pulse-card ${role.health}${active ? " active" : ""}`} onClick={onSelect}>
      <div className="pulse-card-head">
        <div>
          <div className="pulse-card-title">{role.title}</div>
          <div className="pulse-card-team">{role.team}</div>
        </div>
        <span className={`pulse-pill ${role.health}`}>{HEALTH_LABEL[role.health]}</span>
      </div>
      <div className="pulse-card-metrics">
        {role.metrics.map((m) => (
          <div className="pulse-metric" key={m.label}>
            <div className="pulse-metric-value">{m.value}</div>
            <div className="pulse-metric-label">{m.label}</div>
            <div className="pulse-metric-hint">{m.hint}</div>
          </div>
        ))}
      </div>
      <div className="pulse-card-foot">
        <Sparkline values={role.trend} health={role.health} />
        <div className="pulse-card-meta">
          {role.openings} opening{role.openings > 1 ? "s" : ""} · {role.daysOpen}d open
        </div>
      </div>
      <div className="pulse-rule">{role.rule}</div>
    </button>
  );
}

function PulseAppImpl() {
  const [activeRole, setActiveRole] = useState<string | null>(null);

  return (
    <div className="pulse">
      <div className="pulse-topbar">
        <div>
          <div className="pulse-title">Pipeline health</div>
          <div className="pulse-sub">
            {pulseSummary.quarter} · rules-based scoring · synced {pulseSummary.synced}
          </div>
        </div>
        <div className="pulse-chips">
          <span className="pulse-chip active">Health</span>
          <span className="pulse-chip">Forecast</span>
          <span className="pulse-chip">Rules</span>
        </div>
      </div>

      <ScrollArea className="pulse-body">
        <div className="pulse-headline">
          {pulseSummary.headline.map((h) => (
            <div className="pulse-stat" key={h.label}>
              <div className="pulse-stat-label">{h.label}</div>
              <div className="pulse-stat-value">{h.value}</div>
              <div className="pulse-stat-sub">{h.sub}</div>
            </div>
          ))}
        </div>

        <div className="pulse-panel">
          <div className="pulse-panel-head">
            <h3>Hiring forecast — cumulative</h3>
            <div className="pulse-legend">
              <span className="lg actual">Actual</span>
              <span className="lg projected">Forecast</span>
              <span className="lg plan">Plan</span>
            </div>
          </div>
          <ForecastChart />
          <div className="pulse-panel-note">
            Forecast extends the trailing 8-week conversion rates against remaining capacity. No model, no black
            box — the same arithmetic a recruiter would do by hand, run every night.
          </div>
        </div>

        <h3 className="pulse-section">Role scorecards</h3>
        <div className="pulse-cards">
          {pulseRoles.map((r) => (
            <RoleCard
              key={r.id}
              role={r}
              active={activeRole === r.id}
              onSelect={() => setActiveRole(activeRole === r.id ? null : r.id)}
            />
          ))}
        </div>

        <h3 className="pulse-section">Risk callouts</h3>
        <div className="pulse-risks">
          {pulseRisks.map((k) => (
            <div className={`pulse-risk ${k.severity}`} key={k.id}>
              <div className="pulse-risk-head">
                <span className={`pulse-pill ${k.severity}`}>{HEALTH_LABEL[k.severity]}</span>
                <span className="pulse-risk-role">{k.role}</span>
                <span className="pulse-risk-rule">Rule {k.rule}</span>
              </div>
              <p className="pulse-risk-detail">{k.detail}</p>
              <p className="pulse-risk-action">
                <span>Recommended action</span> {k.action}
              </p>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export const PulseApp = memo(PulseAppImpl);
