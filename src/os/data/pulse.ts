// Pulse — synthetic demonstration fixtures.
//
// Pulse turns recruiting activity into explainable role-level signals, helping
// recruiters understand where attention is needed, why, and what to examine
// next. It surfaces conditions for human review; it does not score candidates,
// predict outcomes, or decide anything.
//
// This is a compact decision brief, not a dashboard. The fixture supplies the
// signal directly: there is no scoring engine here, and none is described. The
// app demonstrates how explainable intelligence is *presented*.
//
// Every role, team, number and sentence below is invented for this portfolio.
//
// Editing rules:
//   - No thresholds, formulas, rule identifiers, precedence or pass/fail lists.
//     Explain the result, never the mechanism.
//   - No forecasts, plan attainment, conversion rates or company-level claims.
//   - Say what was observed and what a human might look at next. Nothing that
//     implies Pulse knows the cause.

/** Written status is primary; colour and icon only ever support it. */
export type PulseSignal = "needs-action" | "watch" | "on-track";

/** How long the condition has been visible, in plain words. */
export type PulseTrend = "new" | "persistent" | "improving";

export interface PulseRole {
  id: string;
  title: string;
  team: string;
  signal: PulseSignal;
  trend: PulseTrend;
  /** Short supporting phrase, e.g. "Persistent · 12 days". */
  trendLabel: string;
  daysOpen: number;
  activeCandidates: number;
  lateStageCandidates: number;
  staleCandidates: number;
  /** One plain sentence naming what was observed. */
  reason: string;
  /** The "why this signal" body: still observation, never mechanism. */
  explanation: string;
  suggestedReview: string;
  owner: string;
}

export const SIGNAL_LABEL: Record<PulseSignal, string> = {
  "needs-action": "Needs action",
  watch: "Watch",
  "on-track": "On track",
};

export const pulseRoles: PulseRole[] = [
  {
    id: "role-1",
    title: "Staff Data Engineer",
    team: "Data Infrastructure",
    signal: "needs-action",
    trend: "persistent",
    trendLabel: "Persistent · 12 days",
    daysOpen: 58,
    activeCandidates: 3,
    lateStageCandidates: 0,
    staleCandidates: 0,
    reason: "No candidate has reached a late-stage interview during an extended search.",
    explanation:
      "The role has remained open while the active pipeline has not progressed into late-stage interviews. Pulse is surfacing the combination for review, not determining why it happened.",
    suggestedReview: "Revisit search calibration",
    owner: "Recruiter + Hiring Manager",
  },
  {
    id: "role-2",
    title: "Platform Engineer",
    team: "Developer Platform",
    signal: "watch",
    trend: "new",
    trendLabel: "New this week",
    daysOpen: 41,
    activeCandidates: 5,
    lateStageCandidates: 1,
    staleCandidates: 2,
    reason: "Candidate movement has slowed in two active stages.",
    explanation:
      "Two candidates have remained in their current stages without recent movement. The signal indicates that the recorded pipeline may no longer reflect the role's current state.",
    suggestedReview: "Review stalled candidate activity",
    owner: "Recruiter",
  },
  {
    id: "role-3",
    title: "Product Lead",
    team: "Customer Experience",
    signal: "on-track",
    trend: "improving",
    trendLabel: "Improving since last update",
    daysOpen: 27,
    activeCandidates: 6,
    lateStageCandidates: 2,
    staleCandidates: 0,
    reason: "Pipeline coverage and candidate movement are currently supporting the search.",
    explanation:
      "No defined operating signal currently requires intervention. Pulse continues monitoring the role for changes.",
    suggestedReview: "Maintain the current recruiting cadence",
    owner: "Recruiter",
  },
  {
    id: "role-4",
    title: "Design Manager",
    team: "Core Product",
    signal: "watch",
    trend: "persistent",
    trendLabel: "Persistent",
    daysOpen: 35,
    activeCandidates: 6,
    lateStageCandidates: 1,
    staleCandidates: 0,
    reason: "Most active candidates are concentrated in the same interview stage.",
    explanation:
      "The pipeline is active, but candidate movement is concentrated in one stage. Pulse is surfacing that concentration so the recruiting team can investigate the cause.",
    suggestedReview: "Review the stage bottleneck",
    owner: "Recruiter",
  },
];

/** The role the brief opens on. */
export const pulseDefaultRole = "role-1";

/**
 * The observed evidence line, built from the role's own counts so it can never
 * drift from the fixture. Stale candidates are named when there are any,
 * because that is the observation the signal rests on; otherwise the late-stage
 * count is the more useful third number.
 */
export function pulseEvidence(role: PulseRole): string[] {
  return [
    `${role.daysOpen} days open`,
    `${role.activeCandidates} active`,
    role.staleCandidates > 0 ? `${role.staleCandidates} stale` : `${role.lateStageCandidates} late-stage`,
  ];
}

/** Portfolio summary, derived so it always matches the roles above. */
export function pulseSummary(roles: PulseRole[]): string[] {
  const attention = roles.filter((r) => r.signal !== "on-track").length;
  const improving = roles.filter((r) => r.trend === "improving").length;
  return [
    `${roles.length} roles monitored`,
    `${attention} need attention`,
    `${improving} improving`,
  ];
}

export const pulseHowItWorks = {
  steps: ["Snapshot", "Signals", "Explainable role brief"],
  body: "Pulse reviews synthetic recruiting activity against a defined set of operating signals, then presents the evidence and a suggested area for human review.",
};

export const pulseDisclaimer = {
  primary: "Conceptual portfolio simulation · Synthetic recruiting data",
  secondary:
    "This experience demonstrates the product principles and capabilities of a recruiting intelligence system. Its interface, examples, and signal behavior were created specifically for this portfolio.",
};
