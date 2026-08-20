// Editable sample content for the Gauge browser-extension mock.
// The candidate below is entirely fictional. Never put a real profile here.

export type CriterionStatus = "pass" | "partial" | "fail";

export interface GaugeCriterion {
  id: string;
  label: string;
  status: CriterionStatus;
  weight: "Must have" | "Strong signal" | "Nice to have";
  evidence: string;
}

export interface GaugeExperience {
  company: string;
  title: string;
  dates: string;
  detail: string;
}

export const gaugeRole = {
  title: "Staff Backend Engineer — Payments Platform",
  req: "IC5-PAY-04",
  locked: "Criteria locked Aug 12 · v3",
  owner: "Carlos Robledo",
  project: "Payments Staff+ · 2026",
  /** Same candidate Rex is chasing an onsite loop for in #role-status. */
  stage: "Onsite — loop being scheduled",
};

/** Verbatim call-to-action shown before an evaluation has been run. */
export const gaugeCta =
  "Would you like to evaluate Maya for Staff Backend Engineer, Payments Platform?";

/**
 * Dial zones. Every zone carries a label so the reading never depends on
 * colour alone.
 */
export interface GaugeZone {
  /** Upper bound, exclusive. */
  max: number;
  label: string;
  tone: "red" | "yellow" | "green";
}

export const gaugeZones: GaugeZone[] = [
  { max: 40, label: "Weak match", tone: "red" },
  { max: 70, label: "Partial match", tone: "yellow" },
  { max: 101, label: "Strong match", tone: "green" },
];

export const gaugeCandidate = {
  name: "Maya Okafor",
  initials: "MO",
  headline: "Staff Software Engineer — Payments Platform",
  company: "Northwind Financial",
  location: "Austin, Texas",
  connections: "500+ connections",
  openTo: "Open to new opportunities · shared with recruiters",
  about:
    "Backend engineer focused on money movement at scale. I like ledgers that balance, idempotency keys that actually work, and on-call rotations that stay quiet.",
  experience: [
    {
      company: "Northwind Financial",
      title: "Staff Software Engineer, Payments Platform",
      dates: "2022 – Present · 3 yrs 5 mos",
      detail:
        "Led the ledger re-platform behind card settlement; owns idempotency and reconciliation for ~4M daily transactions.",
    },
    {
      company: "Northwind Financial",
      title: "Senior Software Engineer, Payments",
      dates: "2019 – 2022 · 2 yrs 8 mos",
      detail: "Built the double-entry ledger service and the payout scheduler; Go, Postgres, Kafka.",
    },
    {
      company: "Harbor Logistics",
      title: "Software Engineer, Billing",
      dates: "2016 – 2019 · 3 yrs 1 mo",
      detail: "Invoicing and dunning systems; migrated billing off a monolith onto event-driven services.",
    },
  ] as GaugeExperience[],
  skills: [
    "Distributed systems",
    "Go",
    "Postgres",
    "Kafka",
    "Payments / ledgers",
    "Idempotency",
    "Kubernetes",
    "Mentorship",
  ],
  education: "B.S. Computer Science — University of Illinois",
};

export const gaugeCriteria: GaugeCriterion[] = [
  {
    id: "c1",
    label: "8+ yrs backend engineering, production ownership",
    status: "pass",
    weight: "Must have",
    evidence: "9 yrs across three backend roles; on-call owner for settlement since 2022.",
  },
  {
    id: "c2",
    label: "Payments / ledger domain depth",
    status: "pass",
    weight: "Must have",
    evidence: "Led a double-entry ledger re-platform; reconciliation and idempotency named explicitly.",
  },
  {
    id: "c3",
    label: "Staff-level scope: multi-team technical leadership",
    status: "partial",
    weight: "Must have",
    evidence: "Staff title and platform ownership shown; cross-org influence not evidenced on the profile.",
  },
  {
    id: "c4",
    label: "High-scale distributed systems (>1M txn/day)",
    status: "pass",
    weight: "Strong signal",
    evidence: "~4M daily transactions stated on the current role.",
  },
  {
    id: "c5",
    label: "Regulated / financial-services environment",
    status: "pass",
    weight: "Strong signal",
    evidence: "Seven years inside financial services across two employers.",
  },
  {
    id: "c6",
    label: "Located in or open to a hub location",
    status: "partial",
    weight: "Nice to have",
    evidence: "Austin, TX. Relocation preference not stated — confirm on the screen.",
  },
  {
    id: "c7",
    label: "Prior experience at a hyper-growth startup",
    status: "fail",
    weight: "Nice to have",
    evidence: "No startup-stage experience visible; both employers are late-stage.",
  },
];

export const gaugeRecommendation = {
  verdict: "Advance to recruiter screen",
  score: 82,
  band: "Strong match",
  summary:
    "Meets both must-have technical criteria with direct ledger and settlement depth. Staff-level scope reads as platform ownership rather than cross-org leadership — that is the one gap worth probing live.",
  probe: [
    "Ask for a concrete example of influence outside the immediate team.",
    "Confirm relocation and comp expectations before the hiring-manager screen.",
  ],
  disclaimer:
    "Gauge scores against locked criteria only. It never rejects a candidate — the recruiter makes every decision.",
};
