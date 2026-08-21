// Beacon - synthetic demonstration fixtures.
//
// Beacon reads a snapshot of recruiting activity and shows, per role, what is
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
export type BeaconSignal = "needs-review" | "watch" | "on-track";

/** How long the condition has been visible, in plain words. */
export type BeaconTrend = "new" | "persistent" | "improving";

export interface BeaconStage {
  label: string;
  count: number;
}

export interface BeaconRole {
  id: string;
  title: string;
  team: string;
  hiringManager: string;
  location: string;
  openings: number;
  signal: BeaconSignal;
  trend: BeaconTrend;
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
  /** A concise recruiter-calibration summary, not a copied job description. */
  priorityProfile: string;
  /** Aggregate pipeline shape only; Beacon deliberately does not list candidates. */
  pipeline: BeaconStage[];
  recentMovement: string;
  nextMilestone: string;
  reviewFocus: string;
  reviewWith: string;
}

export const SIGNAL_LABEL: Record<BeaconSignal, string> = {
  "needs-review": "Needs review",
  watch: "Watch",
  "on-track": "On track",
};

export const beaconRoles: BeaconRole[] = [
  {
    id: "role-1",
    title: "Staff Data Engineer",
    team: "Data Infrastructure",
    hiringManager: "Priya Raman",
    location: "Remote · United States",
    openings: 1,
    signal: "needs-review",
    trend: "persistent",
    trendLabel: "Needs review for 12 days",
    reason: "This role has been open 58 days with no late-stage candidates.",
    evidence: ["58 days open", "3 active candidates", "0 late-stage candidates"],
    explanation:
      "Three candidates are active, but none has reached a late-stage interview. The combination of role age and limited progression is why this role is flagged for review.",
    priorityProfile: "Platform-minded data engineer with streaming systems ownership",
    pipeline: [
      { label: "Recruiter screen", count: 2 },
      { label: "Hiring manager", count: 1 },
      { label: "Interview loop", count: 0 },
      { label: "Offer", count: 0 },
    ],
    recentMovement: "1 new candidate · 0 stage advances in the last 7 days",
    nextMilestone: "Search calibration with Priya · Aug 22",
    reviewFocus: "Revisit must-haves and the outbound target pool",
    reviewWith: "Recruiter + Hiring Manager",
  },
  {
    id: "role-2",
    title: "Platform Engineer",
    team: "Developer Platform",
    hiringManager: "Devon Price",
    location: "Remote · US or Canada",
    openings: 2,
    signal: "watch",
    trend: "new",
    trendLabel: "New this week",
    reason: "Two of five active candidates have not moved recently.",
    evidence: ["41 days open", "5 active candidates", "2 with no recent movement"],
    explanation:
      "Two active candidates have remained in their current stages without recent movement. Reviewing their current status will help confirm that the recorded pipeline is up to date.",
    priorityProfile: "Backend engineer with developer tooling and Kubernetes depth",
    pipeline: [
      { label: "Recruiter screen", count: 1 },
      { label: "Hiring manager", count: 2 },
      { label: "Interview loop", count: 2 },
      { label: "Offer", count: 0 },
    ],
    recentMovement: "1 stage advance · 2 candidates awaiting next steps",
    nextMilestone: "Two technical interviews scheduled by Aug 26",
    reviewFocus: "Confirm next steps for the two inactive candidates",
    reviewWith: "Recruiter",
  },
  {
    id: "role-3",
    title: "Product Lead",
    team: "Customer Experience",
    hiringManager: "Alina Grant",
    location: "New York · Hybrid",
    openings: 1,
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
      "The current snapshot does not show a condition that needs attention. Late-stage representation has improved since the previous snapshot, and Beacon will continue monitoring the role for changes.",
    priorityProfile: "Product leader who has scaled customer-facing workflows across functions",
    pipeline: [
      { label: "Recruiter screen", count: 1 },
      { label: "Hiring manager", count: 2 },
      { label: "Interview loop", count: 2 },
      { label: "Offer", count: 1 },
    ],
    recentMovement: "1 new candidate · 2 stage advances in the last 7 days",
    nextMilestone: "Final-loop debrief · Aug 25",
    reviewFocus: "No immediate review needed",
    reviewWith: "Recruiter",
  },
  {
    id: "role-4",
    title: "Design Manager",
    team: "Core Product",
    hiringManager: "Marcus Reed",
    location: "San Francisco · Hybrid",
    openings: 1,
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
      "The pipeline is active, but four of six candidates are currently in the same stage. Beacon is surfacing that concentration so the recruiting team can review candidate progression.",
    priorityProfile: "Design leader with systems thinking and hands-on people management",
    pipeline: [
      { label: "Recruiter screen", count: 1 },
      { label: "Hiring manager", count: 4 },
      { label: "Portfolio / loop", count: 1 },
      { label: "Offer", count: 0 },
    ],
    recentMovement: "2 hiring-manager screens completed · 0 stage changes",
    nextMilestone: "Hiring-manager pipeline review · Aug 22",
    reviewFocus: "Review progression through hiring-manager screens",
    reviewWith: "Recruiter + Hiring Manager",
  },
];

/** The role the brief opens on. */
export const beaconDefaultRole = "role-1";

/**
 * Header summary, counted from the roles above so it can never drift from
 * them. Each role is counted once by signal, then improving trends are named
 * separately.
 */
export function beaconSummary(roles: BeaconRole[]): string[] {
  const count = (signal: BeaconSignal) => roles.filter((r) => r.signal === signal).length;
  return [
    `${roles.length} sample roles`,
    `${count("needs-review")} needs review`,
    `${count("watch")} to watch`,
    `${roles.filter((r) => r.trend === "improving").length} improving`,
  ];
}

export const beaconHowItWorks = {
  steps: ["Snapshot", "Signals", "Explainable role brief"],
  body: "Beacon checks recruiting activity for conditions that may need attention, then shows the supporting data and who should review it.",
};

export const beaconDisclaimer =
  "Portfolio simulation using synthetic data. The interface and examples were created specifically for this demo.";
