// Editable sample content for the Rex app window.
//
// Everything here is illustrative: people, candidates, reqs and numbers are
// fictional placeholders meant to be swapped for real (redacted) copy later.
// No real candidate data belongs in this file.
//
// The three story channels are meant to be read as one connected week:
//   #role-status      a VP asks for a status update, Rex generates the report
//   #offer-stage      the one outstanding offer in that report is accepted
//   #stale-candidates the follow-up SLA breaches Rex flags every morning

export type RexTone = "green" | "yellow" | "red" | "neutral";

export interface RexField {
  label: string;
  value: string;
  /** Span the full width of the field grid. */
  wide?: boolean;
}

/** One stage of the pipeline funnel, rendered as a labelled bar. */
export interface RexStage {
  label: string;
  count: number;
}

export interface RexCardSection {
  heading: string;
  items: string[];
  /** Render as an ordered list (recommended actions). */
  ordered?: boolean;
}

/** Status never depends on colour alone: it always carries a glyph and words. */
export interface RexStatus {
  tone: RexTone;
  icon: string;
  label: string;
}

export interface RexProgress {
  label: string;
  value: number;
  max: number;
  note: string;
}

export interface RexCard {
  accent: string;
  title: string;
  status?: RexStatus;
  fields?: RexField[];
  stages?: RexStage[];
  progress?: RexProgress;
  sections?: RexCardSection[];
  footer?: string;
  /** Read-only interface states — they never mutate anything. */
  actions?: string[];
}

export interface RexReaction {
  emoji: string;
  count: number;
}

export interface RexMessage {
  id: string;
  author: string;
  /** Job title shown next to the name, Slack-profile style. */
  role?: string;
  initials: string;
  color: string;
  bot: boolean;
  time: string;
  text?: string;
  card?: RexCard;
  reactions?: RexReaction[];
  thread?: string;
}

export interface RexChannel {
  id: string;
  kind: "channel" | "dm";
  name: string;
  topic: string;
  unread: number;
  /** One of the three headline story channels. */
  primary?: boolean;
  /** Number of messages shown before the "Rex is working" pause. */
  typingAfter?: number;
  typingLabel?: string;
  messages: RexMessage[];
}

export const rexWorkspace = {
  name: "Rex Ops",
  initials: "RX",
  tagline: "Recruiting operations, automated",
};

const REX = { initials: "RX", color: "#4d6bd8", bot: true, author: "Rex" };
const CARLOS = { initials: "CR", color: "#3f7f6d", bot: false, author: "Carlos Robledo" };
const AVERY = {
  initials: "AC",
  color: "#a15540",
  bot: false,
  author: "Avery Chen",
  role: "VP, Engineering",
};

const ACCENT_BLUE = "#4d6bd8";
const ACCENT_AMBER = "#d59a3a";
const ACCENT_GREEN = "#3f9c6d";

export const rexChannels: RexChannel[] = [
  {
    id: "role-status",
    kind: "channel",
    name: "role-status",
    topic: "Live status for open searches — ask Rex for a report any time",
    unread: 1,
    primary: true,
    typingAfter: 2,
    typingLabel: "Rex is generating a report…",
    messages: [
      {
        ...AVERY,
        id: "rs-1",
        time: "9:12 AM",
        text: "Hey Carlos — can you give me a quick status update on the Staff Backend Engineer (Payments) search? Are we on track for two hires this quarter, and where do you need help?",
      },
      {
        ...CARLOS,
        id: "rs-2",
        time: "9:14 AM",
        text: "Absolutely. I'm going to use Rex to pull the live pipeline and generate a status report.",
      },
      {
        ...REX,
        id: "rs-3",
        time: "9:15 AM",
        text: "Pipeline report ready — Staff Backend Engineer (Payments)",
        card: {
          accent: ACCENT_AMBER,
          title: "Pipeline report — Staff Backend Engineer (Payments)",
          status: { tone: "yellow", icon: "▲", label: "Yellow — At risk" },
          fields: [
            { label: "Hiring goal", value: "2 hires by September 30" },
            { label: "Current forecast", value: "1.7 hires" },
            { label: "Active candidates", value: "38" },
          ],
          stages: [
            { label: "Recruiter screen", count: 9 },
            { label: "Hiring manager screen", count: 5 },
            { label: "Onsite", count: 2 },
            { label: "Offer", count: 1 },
          ],
          sections: [
            {
              heading: "Primary risks",
              items: [
                "Onsite inventory is two candidates below plan.",
                "Four candidates have been awaiting hiring-manager review for more than three days.",
                "One outstanding offer is the largest near-term forecast dependency.",
              ],
            },
            {
              heading: "Recommended actions",
              ordered: true,
              items: [
                "Confirm onsite loops for Maya Okafor and Daniel Kim by Friday.",
                "Review the four aging hiring-manager packets today.",
                "Re-engage eight qualified silver-medalist candidates.",
              ],
            },
          ],
          footer: "Source: Ashby · Synced at 9:14 AM · Report generated by Rex",
          actions: ["Open full report", "Share update"],
        },
      },
    ],
  },
  {
    id: "offer-stage",
    kind: "channel",
    name: "offer-stage",
    topic: "Offer extended → decision → accept, with forecast updates",
    unread: 1,
    primary: true,
    messages: [
      {
        ...REX,
        id: "os-1",
        time: "3:42 PM",
        text: "Offer accepted 🎉",
        card: {
          accent: ACCENT_GREEN,
          title: "Offer accepted — Staff Backend Engineer (Payments)",
          status: { tone: "green", icon: "✓", label: "Green — Accepted" },
          fields: [
            { label: "Candidate", value: "Priya Shah" },
            { label: "Role", value: "Staff Backend Engineer (Payments)" },
            { label: "Level", value: "IC5" },
            { label: "Source", value: "Outbound" },
            { label: "Recruiter", value: "Carlos Robledo" },
            { label: "Start date", value: "September 14" },
            { label: "Time in process", value: "24 days" },
          ],
          progress: {
            label: "Hiring goal",
            value: 1,
            max: 2,
            note: "Hiring goal is now 1 of 2 accepted.",
          },
          sections: [
            {
              heading: "Follow-up",
              items: [
                "Rex has updated the hiring forecast and removed this offer from the outstanding-offer risk.",
              ],
            },
          ],
          actions: ["Open candidate", "View updated forecast"],
        },
        reactions: [
          { emoji: "🎉", count: 12 },
          { emoji: "🙌", count: 5 },
        ],
      },
    ],
  },
  {
    id: "stale-candidates",
    kind: "channel",
    name: "stale-candidates",
    topic: "Follow-up SLA breaches — Rex drafts, Carlos approves",
    unread: 6,
    primary: true,
    messages: [
      {
        ...REX,
        id: "sc-1",
        time: "8:45 AM",
        text: "Good morning, Carlos — 6 candidates are past their follow-up SLA and need action today.",
        card: {
          accent: ACCENT_AMBER,
          title: "Follow-up SLA breaches — 6 candidates",
          status: { tone: "yellow", icon: "▲", label: "Yellow — Action needed today" },
          fields: [
            { label: "Recruiter screen", value: "2 candidates · 4+ days" },
            { label: "Hiring-manager review", value: "3 candidates · 3+ days" },
            { label: "Onsite follow-up", value: "1 candidate · 2+ days" },
            {
              label: "Oldest item",
              value: "Elena Torres — Hiring-manager review — 6 days without action",
              wide: true,
            },
          ],
          sections: [
            {
              heading: "Recommended next step",
              items: [
                "Review the three highest-priority candidates this morning. Rex has drafted follow-up messages for your approval.",
              ],
            },
          ],
          footer: "Rex drafts follow-ups; Carlos reviews and approves before anything is sent.",
          actions: ["Review candidates", "View drafts"],
        },
      },
    ],
  },
  {
    id: "weekly-report",
    kind: "channel",
    name: "weekly-report",
    topic: "Monday 8:00 AM CT — auto-generated hiring report",
    unread: 0,
    messages: [
      {
        ...REX,
        id: "wr-1",
        time: "Mon 8:00 AM",
        text: "Weekly hiring report — week of September 8.",
        card: {
          accent: ACCENT_BLUE,
          title: "Week 37 summary",
          fields: [
            { label: "Offers out", value: "3" },
            { label: "Accepts", value: "2" },
            { label: "Onsites", value: "9" },
            { label: "Time to offer", value: "34 days" },
            { label: "Screens", value: "27" },
            { label: "Pass-through", value: "38%" },
          ],
          footer: "Auto-generated from Ashby + Airtable · no manual assembly required",
          actions: ["View full report", "Share with leadership"],
        },
      },
      {
        ...REX,
        id: "wr-2",
        time: "Mon 8:00 AM",
        text: "Estimated recruiter time returned this week: *6.4 hours* across 5 recruiters (reporting + follow-up automation).",
        reactions: [{ emoji: "🙌", count: 6 }],
      },
    ],
  },
  {
    id: "interview-ops",
    kind: "channel",
    name: "interview-ops",
    topic: "Panel coverage, debrief scheduling, loop hygiene",
    unread: 0,
    messages: [
      {
        ...REX,
        id: "io-1",
        time: "1:20 PM",
        text: "Panel gap — Systems Design interviewer unassigned for the September 12 loop.",
        card: {
          accent: ACCENT_AMBER,
          title: "Loop at risk — Maya Okafor",
          status: { tone: "yellow", icon: "▲", label: "Yellow — Needs an interviewer" },
          fields: [
            { label: "Candidate", value: "Maya Okafor" },
            { label: "Missing", value: "Systems Design" },
            { label: "Loop", value: "September 12, 10:00 AM CT" },
          ],
          actions: ["Suggest interviewers"],
        },
      },
      {
        ...REX,
        id: "io-2",
        time: "3:02 PM",
        text: "Debrief scheduled — *Daniel Kim* · Staff Backend Engineer (Payments) · September 11, 4:30 PM CT.",
      },
    ],
  },
  {
    id: "dm-rex",
    kind: "dm",
    name: "Rex",
    topic: "Direct messages with the Rex bot",
    unread: 0,
    messages: [
      {
        ...REX,
        id: "dm-1",
        time: "6:55 AM",
        text: "Heads up — your Monday report will run 30 minutes early next week while Ashby backfills a schema change. Nothing for you to do.",
      },
      {
        ...CARLOS,
        id: "dm-2",
        time: "7:10 AM",
        text: "Thanks. Post it in #weekly-report as usual.",
      },
      {
        ...REX,
        id: "dm-3",
        time: "7:10 AM",
        text: "Confirmed. Same channel, 7:30 AM CT.",
      },
    ],
  },
];

export const rexDefaultChannel = "role-status";
