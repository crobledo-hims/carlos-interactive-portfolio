// Editable sample content for the Pulse dashboard window.
// Roles, scores and forecast points are fictional placeholders.

export type Health = "green" | "yellow" | "red";

export interface PulseMetric {
  label: string;
  value: string;
  hint: string;
}

export interface PulseRole {
  id: string;
  title: string;
  team: string;
  health: Health;
  openings: number;
  daysOpen: number;
  /** Sparkline samples, 0..100, oldest first. */
  trend: number[];
  metrics: PulseMetric[];
  /** The deterministic rule that produced the colour. */
  rule: string;
}

export interface PulseRisk {
  id: string;
  severity: Health;
  role: string;
  rule: string;
  detail: string;
  action: string;
}

export const pulseSummary = {
  quarter: "Q3 FY26",
  synced: "4 min ago",
  headline: [
    { label: "Hires to date", value: "14", sub: "of 21 planned" },
    { label: "Pipeline coverage", value: "2.8x", sub: "target 3.0x" },
    { label: "Reqs at risk", value: "2", sub: "red this week" },
    { label: "Forecast to plan", value: "19 / 21", sub: "by Dec 31" },
  ],
};

export const pulseForecast = {
  months: ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  /** Cumulative actual hires; nulls are the future. */
  actual: [4, 9, 14, null, null, null, null] as (number | null)[],
  /** Cumulative rules-based forecast, anchored on the last actual. */
  projected: [null, null, 14, 16, 17, 18, 19] as (number | null)[],
  /** Headcount plan. */
  plan: [3, 6, 9, 12, 15, 18, 21],
  max: 24,
};

export const pulseRoles: PulseRole[] = [
  {
    id: "r1",
    title: "Staff Backend Engineer",
    team: "Payments Platform",
    health: "red",
    openings: 2,
    daysOpen: 62,
    trend: [72, 68, 61, 55, 48, 40, 33],
    metrics: [
      { label: "Coverage", value: "1.4x", hint: "target 3.0x" },
      { label: "Screen → onsite", value: "22%", hint: "bar 35%" },
      { label: "Onsites / wk", value: "1", hint: "target 4" },
      { label: "Offer accept", value: "—", hint: "no offers yet" },
    ],
    rule: "PH-04 · onsite volume < 2x remaining hires for 7 consecutive days",
  },
  {
    id: "r2",
    title: "Principal Engineer",
    team: "Infrastructure",
    health: "red",
    openings: 1,
    daysOpen: 88,
    trend: [58, 55, 51, 47, 44, 38, 30],
    metrics: [
      { label: "Coverage", value: "1.1x", hint: "target 3.0x" },
      { label: "Screen → onsite", value: "31%", hint: "bar 35%" },
      { label: "Onsites / wk", value: "0", hint: "target 2" },
      { label: "Age", value: "88d", hint: "SLA 70d" },
    ],
    rule: "PH-01 · req age > SLA and coverage < 1.5x",
  },
  {
    id: "r3",
    title: "Applied AI Engineer",
    team: "AI Platform",
    health: "yellow",
    openings: 1,
    daysOpen: 34,
    trend: [40, 48, 55, 58, 61, 59, 62],
    metrics: [
      { label: "Coverage", value: "2.4x", hint: "target 3.0x" },
      { label: "Screen → onsite", value: "33%", hint: "bar 35%" },
      { label: "Onsites / wk", value: "3", hint: "target 3" },
      { label: "Offer accept", value: "100%", hint: "1 of 1" },
    ],
    rule: "PH-02 · recruiter-screen pass-through below bar for 2 weeks",
  },
  {
    id: "r4",
    title: "Sr. Data Engineer",
    team: "Data Platform",
    health: "yellow",
    openings: 2,
    daysOpen: 41,
    trend: [66, 62, 60, 57, 59, 56, 58],
    metrics: [
      { label: "Coverage", value: "2.6x", hint: "target 3.0x" },
      { label: "Screen → onsite", value: "36%", hint: "bar 35%" },
      { label: "Onsites / wk", value: "2", hint: "target 3" },
      { label: "Offer accept", value: "50%", hint: "1 of 2" },
    ],
    rule: "PH-06 · offer accept rate below 60% on 2+ offers",
  },
  {
    id: "r5",
    title: "Sr. iOS Engineer",
    team: "Mobile",
    health: "green",
    openings: 1,
    daysOpen: 22,
    trend: [45, 52, 60, 68, 74, 80, 86],
    metrics: [
      { label: "Coverage", value: "4.1x", hint: "target 3.0x" },
      { label: "Screen → onsite", value: "44%", hint: "bar 35%" },
      { label: "Onsites / wk", value: "4", hint: "target 3" },
      { label: "Offer accept", value: "100%", hint: "2 of 2" },
    ],
    rule: "All health rules passing",
  },
  {
    id: "r6",
    title: "Engineering Manager",
    team: "Platform",
    health: "green",
    openings: 1,
    daysOpen: 29,
    trend: [50, 55, 63, 66, 70, 75, 78],
    metrics: [
      { label: "Coverage", value: "3.3x", hint: "target 3.0x" },
      { label: "Screen → onsite", value: "39%", hint: "bar 35%" },
      { label: "Onsites / wk", value: "3", hint: "target 2" },
      { label: "Offer accept", value: "—", hint: "offer pending" },
    ],
    rule: "All health rules passing",
  },
];

export const pulseRisks: PulseRisk[] = [
  {
    id: "k1",
    severity: "red",
    role: "Staff Backend Engineer · Payments",
    rule: "PH-04",
    detail:
      "Onsite volume has been below 2x remaining hires for 9 days. At the current rate this req closes 5 weeks past plan.",
    action: "Re-engage 12 Q2 silver medalists and add a second sourcing sprint.",
  },
  {
    id: "k2",
    severity: "red",
    role: "Principal Engineer · Infrastructure",
    rule: "PH-01",
    detail:
      "Req is 18 days past its age SLA with coverage at 1.1x. Calibration has not been refreshed since the req opened.",
    action: "Schedule a re-calibration with the hiring manager before adding pipeline.",
  },
  {
    id: "k3",
    severity: "yellow",
    role: "Applied AI Engineer · AI Platform",
    rule: "PH-02",
    detail:
      "Recruiter-screen pass-through is 33% against a 35% bar — two weeks running. Volume is healthy; qualification is the constraint.",
    action: "Tighten the screening rubric and review the last 10 rejects for pattern drift.",
  },
  {
    id: "k4",
    severity: "yellow",
    role: "Sr. Data Engineer · Data Platform",
    rule: "PH-06",
    detail: "1 of 2 offers declined, both citing scope. Sample is small but the signal repeats last quarter.",
    action: "Add a scope-and-charter conversation before the offer call.",
  },
];
