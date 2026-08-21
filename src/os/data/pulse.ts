// Pulse - synthetic demonstration fixtures.
//
// Pulse reads a snapshot of recruiting activity and shows, per role, what is
// happening, the data behind it, and who should take a look. It surfaces
// conditions for a person to review; it does not score candidates, predict
// outcomes, or decide anything.
//
// This is a compact decision brief, not a dashboard. The fixture supplies the
// signal directly: there is no scoring engine here, and none is described. The
// app demonstrates how a role brief is *presented*.
//
// Every role, team, number and sentence below is invented for this portfolio.
//
// Editing rules:
//   - No thresholds, formulas, rule identifiers, precedence or pass/fail lists.
//     Explain the result, never the mechanism.
//   - No forecasts, plan attainment, conversion rates or company-level claims.
//   - Each role's reason must be supported by that role's own evidence items.
//     Never claim more than the fixture shows.
//   - Static snapshot language only. No relative timestamps, no implied live
//     connection to an applicant tracking system.

/** Written status is primary; colour and icon only ever support it. */
export type PulseSignal = "needs-review" | "watch" | "on-track";

/** How long the condition has been visible, in plain words. */
export type PulseTrend = "new" | "persistent" | "improving";

export interface PulseRole {
  id: string;
  title: string;
  team: string;
  signal: PulseSignal;
  trend: PulseTrend;
  /** Short supporting phrase, e.g. "Needs review for 12 days". */
  trendLabel: string;
  /** One plain sentence naming what this role's snapshot shows. */
  reason: string;
  /**
   * The role's own snapshot items, written out rather than derived, so each
   * brief can say exactly what its reason rests on.
   */
  evidence: string[];
  /** The "why this signal" body: still observation, never mechanism. */
  explanation: string;
  reviewFocus: string;
  reviewWith: string;
}

export const SIGNAL_LABEL: Record<PulseSignal, string> = {
  "needs-review": "Needs review",
  watch: "Watch",
  "on-track": "On track",
};

export const pulseRoles: PulseRole[] = [
  {
    id: "role-1",
    title: "Staff Data Engineer",
    team: "Data Infrastructure",
    signal: "needs-review",
    trend: "persistent",
    trendLabel: "Needs review for 12 days",
    reason: "This role has been open 58 days with no late-stage candidates.",
    evidence: ["58 days open", "3 active candidates", "0 late-stage candidates"],
    explanation:
      "Three candidates are active, but none has reached a late-stage interview. The combination of role age and limited progression is why this role is flagged for review.",
    reviewFocus: "Revisit search calibration",
    reviewWith: "Recruiter + Hiring Manager",
  },
  {
    id: "role-2",
    title: "Platform Engineer",
    team: "Developer Platform",
    signal: "watch",
    trend: "new",
    trendLabel: "New this week",
    reason: "Two of five active candidates have not moved recently.",
    evidence: ["41 days open", "5 active candidates", "2 with no recent movement"],
    explanation:
      "Two active candidates have remained in their current stages without recent movement. Reviewing their current status will help confirm that the recorded pipeline is up to date.",
    reviewFocus: "Confirm next steps for the two inactive candidates",
    reviewWith: "Recruiter",
  },
  {
    id: "role-3",
    title: "Product Lead",
    team: "Customer Experience",
    signal: "on-track",
    trend: "improving",
    trendLabel: "Improving since the last snapshot",
    reason: "Six candidates are active, including two in late-stage interviews.",
    evidence: [
      "27 days open",
      "6 active candidates",
      "2 late-stage candidates",
      "Late-stage candidates increased from 1 to 2",
    ],
    explanation:
      "The current snapshot does not show a condition that needs attention. Late-stage representation has improved since the previous snapshot, and Pulse will continue monitoring the role for changes.",
    reviewFocus: "No immediate review needed",
    reviewWith: "Recruiter",
  },
  {
    id: "role-4",
    title: "Design Manager",
    team: "Core Product",
    signal: "watch",
    trend: "persistent",
    trendLabel: "Unchanged for 7 days",
    reason: "Four of six active candidates are in the hiring-manager screen stage.",
    evidence: [
      "35 days open",
      "6 active candidates",
      "4 in hiring-manager screen",
      "1 late-stage candidate",
    ],
    explanation:
      "The pipeline is active, but four of six candidates are currently in the same stage. Pulse is surfacing that concentration so the recruiting team can review candidate progression.",
    reviewFocus: "Review progression through hiring-manager screens",
    reviewWith: "Recruiter + Hiring Manager",
  },
];

/** The role the brief opens on. */
export const pulseDefaultRole = "role-1";

/**
 * Header summary, counted from the roles above so it can never drift from
 * them. Each role is counted once by signal, then improving trends are named
 * separately.
 */
export function pulseSummary(roles: PulseRole[]): string[] {
  const count = (signal: PulseSignal) => roles.filter((r) => r.signal === signal).length;
  return [
    `${roles.length} sample roles`,
    `${count("needs-review")} needs review`,
    `${count("watch")} to watch`,
    `${roles.filter((r) => r.trend === "improving").length} improving`,
  ];
}

export const pulseHowItWorks = {
  steps: ["Snapshot", "Signals", "Explainable role brief"],
  body: "Pulse checks recruiting activity for conditions that may need attention, then shows the supporting data and who should review it.",
};

export const pulseDisclaimer =
  "Portfolio simulation using synthetic data. The interface and examples were created specifically for this demo.";
