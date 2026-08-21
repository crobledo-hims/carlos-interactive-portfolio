// Editable sample content for the Lens browser-extension mock.
// The candidate below is entirely fictional. Never put a real profile here.

/**
 * Locked role criteria. Carlos writes and locks these from the hiring-manager
 * intake before any candidate is evaluated; the evaluation only ever runs
 * against what is locked.
 */
export interface LensCriteriaLock {
  scope: string;
  nonNegotiables: string[];
  niceToHaves: string[];
  note: string;
}

/** A conclusion tied to the exact profile statement that supports it. */
export interface LensEvidence {
  conclusion: string;
  quote: string;
}

export interface LensExperience {
  company: string;
  title: string;
  dates: string;
  detail: string;
}

/** Something plausible that the profile does not actually establish. */
export interface LensGap {
  item: string;
  why: string;
}

export const lensRole = {
  title: "Staff Backend Engineer — Payments Platform",
  req: "IC5-PAY-04",
  owner: "Carlos Robledo",
  project: "Payments Staff+ · 2026",
};

export const lensCriteriaLock: LensCriteriaLock = {
  scope:
    "Staff Backend Engineer on the Payments Platform team. Owns the services behind money movement, end to end, including the reliability of what they ship.",
  nonNegotiables: [
    "Recent backend systems ownership at Staff-equivalent scope",
    "Production experience with payments, ledgers, or financial transactions",
    "Distributed or event-driven systems experience",
    "Ownership through design, launch, operation, and reliability",
    "Evidence of cross-functional technical influence",
  ],
  niceToHaves: [
    "High-volume money movement",
    "Reconciliation or idempotency systems",
    "Experience setting architecture direction across teams",
  ],
  note: "Carlos defines and locks the criteria before candidate evaluation.",
};

/** Verbatim call-to-action shown before an evaluation has been run. */
export const lensCta =
  "Would you like to evaluate Maya for Staff Backend Engineer, Payments Platform?";

/**
 * Dial zones. Every zone carries a label so the reading never depends on
 * colour alone.
 */
export interface LensZone {
  /** Upper bound, exclusive. */
  max: number;
  label: string;
  tone: "red" | "yellow" | "green";
}

export const lensZones: LensZone[] = [
  { max: 40, label: "Weak match", tone: "red" },
  { max: 70, label: "Partial match", tone: "yellow" },
  { max: 101, label: "Strong match", tone: "green" },
];

export const lensCandidate = {
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
  ] as LensExperience[],
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

export const lensAssessment = {
  score: 82,
  recommendation: "Advance",
  summary:
    "Nine years of backend work, seven inside financial services. Currently owns the ledger re-platform behind card settlement, including idempotency and reconciliation at roughly four million transactions a day. Ledger, payout and event-driven work are each stated explicitly rather than implied. Staff-level scope reads as platform ownership; influence beyond the immediate team is not evidenced on the profile and is worth probing live.",
  domainContext: {
    level: "Direct",
    why: "Owns settlement and ledger systems that are the same class of system this role is responsible for.",
  },
  source: "LinkedIn — Maya Okafor",
};

/** Conclusions mapped to the explicit profile statements behind them. */
export const lensEvidence: LensEvidence[] = [
  {
    conclusion: "Backend ownership at Staff-equivalent scope, currently",
    quote: "Staff Software Engineer, Payments Platform, 2022 to present.",
  },
  {
    conclusion: "Payments and ledger experience is direct, not adjacent",
    quote: "Led the ledger re-platform behind card settlement.",
  },
  {
    conclusion: "Ledger internals were built, not consumed",
    quote: "Built the double-entry ledger service and the payout scheduler.",
  },
  {
    conclusion: "Event-driven systems experience is stated outright",
    quote: "Migrated billing off a monolith onto event-driven services.",
  },
  {
    conclusion: "Owns the operational half, not only the build",
    quote: "Owns idempotency and reconciliation for ~4M daily transactions.",
  },
];

/** Plausible but unsupported. Named rather than assumed. */
export const lensGaps: LensGap[] = [
  {
    item: "Cross-functional technical influence",
    why: "The profile establishes platform ownership. It says nothing about influence beyond the immediate team, and that is not inferred from a Staff title.",
  },
  {
    item: "Setting architecture direction across teams",
    why: "A nice-to-have with no explicit statement behind it. Left unconfirmed rather than credited.",
  },
  {
    item: "Scale of money movement in dollar terms",
    why: "Transaction count is stated. Dollar volume is not, so it is not treated as evidence either way.",
  },
];

export const lensResponsibleUse =
  "Lens provides an evidence-based recommendation. Carlos reviews the evidence and makes the final decision.";
