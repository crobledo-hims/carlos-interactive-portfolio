// Cadence — synthetic demonstration fixtures.
//
// Cadence is a Slack-first recruiting operations product: it keeps recruiting
// teams informed and workflows moving, and links back out to the recruiting
// record for the details. It is not an ATS, a dashboard, a candidate evaluator
// or a forecasting system, and nothing here should imply otherwise.
//
// Four workflows are demonstrated, with an interviewer DM revealed after the
// recruiter starts the feedback follow-up:
//   #role-status        a pipeline report produced on demand
//   Feedback reminder   an overdue-feedback alert, and the reminder the
//                       recruiter can choose to send to the interviewer
//   Weekly stale nudge  candidates with no recorded action for 5+ business days
//   #offer-accepted     an offer acceptance, posted as it happens
//
// Every person, role, candidate, date and number below is invented for this
// portfolio. Nothing is drawn from a real employer, requisition or person, and
// nothing is transmitted anywhere: the app renders these fixtures locally and
// its interactive workflows simulate their outcomes in React state.
//
// Editing rule: Cadence only ever reports what it can observe. Do not add
// forecasts, scores, role health, risk ratings, recommended strategy, or any
// action Cadence cannot actually take.

/* ==========================================================================
   Message blocks — the Slack/Block Kit vocabulary the renderer understands
   ========================================================================== */

/** A bold-label line, the way Slack renders "*Label:* value". */
export interface CadenceFieldLine {
  label: string;
  value: string;
  /** Render the value as a candidate or role link. */
  link?: boolean;
}

/** One candidate row inside a stage or role group. */
export interface CadenceItem {
  /** Rendered as a Slack link. */
  name: string;
  /** Decorative glyph; the words in `detail` always carry the meaning. */
  icon?: string;
  detail: string;
}

/** A bulleted line that may carry a restrained leading glyph. */
export interface CadenceLine {
  icon?: string;
  text: string;
}

export type CadenceBlock =
  /** The bold headline of a message. */
  | { kind: "title"; text: string; icon?: string }
  /** A bold section label inside a message. */
  | { kind: "subhead"; text: string }
  /** Plain paragraph text; supports *bold* and @mentions. */
  | { kind: "text"; text: string }
  | { kind: "fields"; items: CadenceFieldLine[] }
  /** A stage or role heading with its own candidate rows. */
  | { kind: "group"; heading: string; count?: number; items: CadenceItem[] }
  | { kind: "list"; items: CadenceLine[] }
  | { kind: "divider" }
  /** Small muted caption, Slack's context block. */
  | { kind: "context"; text: string }
  /** Illustrative link buttons. Not interactive: they mutate nothing. */
  | { kind: "actions"; items: string[] }
  /** Slot for the one interactive workflow; its state lives in the app. */
  | { kind: "feedback" };

/* ==========================================================================
   Messages and channels
   ========================================================================== */

/** The interactive feedback-reminder workflow. */
export type FeedbackState = "pending" | "sending" | "sent" | "replying" | "replied" | "declined";

export interface CadenceReaction {
  emoji: string;
  count: number;
}

export interface CadenceMessage {
  id: string;
  author: string;
  /** Shown next to the name, Slack-profile style. */
  role?: string;
  initials: string;
  color: string;
  bot: boolean;
  time: string;
  /** Render the Cadence checkpoint mark instead of the initials tile. */
  mark?: boolean;
  /** Caption above the message saying who can see it. */
  label?: string;
  blocks: CadenceBlock[];
  reactions?: CadenceReaction[];
  /** Only rendered while the feedback workflow is in one of these states. */
  showWhen?: FeedbackState | FeedbackState[];
  /** A quiet Slack-style divider inserted immediately before this message. */
  dividerBefore?: string;
}

export interface CadenceChannel {
  id: string;
  kind: "channel" | "workflow" | "dm";
  name: string;
  topic: string;
  unread: number;
  /** Initials used in the direct-message rail. */
  avatar?: string;
  /**
   * Indexes into `messages` that the composer types out live during the
   * scripted opening, in order. Each one's own text is the script. Only the
   * story channel sets these; every other channel renders complete.
   */
  typed?: number[];
  /** Shown beside the three dots while Cadence is preparing its answer. */
  processingLabel?: string;
  messages: CadenceMessage[];
}

export const cadenceWorkspace = {
  name: "Cadence Ops",
  tagline: "Recruiting operations, in the channel",
};

/**
 * Cadence's Slack app identity. `mark` swaps the letter tile for the
 * three-checkpoint glyph, so the bot never wears initials.
 */
const CADENCE = {
  initials: "CD",
  mark: true,
  color: "#5f4b8b",
  bot: true,
  author: "Cadence",
  role: "Recruiting Operations",
};
const CARLOS = { initials: "CR", color: "#3f7f6d", bot: false, author: "Carlos Robledo" };
const AVERY = {
  initials: "AC",
  color: "#a15540",
  bot: false,
  author: "Avery Chen",
  role: "VP, Engineering",
};
const JORDAN = {
  initials: "JL",
  color: "#3d718f",
  bot: false,
  author: "Jordan Lee",
  role: "Interviewer",
};

const ROLE = "Staff Backend Engineer — Payments Platform";

/** Restrained glyphs. Every one of them sits beside words that say the same thing. */
const SCHEDULED = "▸";
const DONE = "✓";
const ADVANCED = "↑";
const ENTERED = "+";
const WITHDREW = "×";

export const cadenceChannels: CadenceChannel[] = [
  /* ---------------------------------------- 1. on-demand pipeline report */
  {
    id: "role-status",
    kind: "channel",
    name: "role-status",
    topic: "Ask Cadence for a pipeline report at any time",
    unread: 1,
    // Carlos's two replies are typed into the composer during the opening.
    typed: [1, 2],
    processingLabel: "Cadence is preparing the latest pipeline report…",
    messages: [
      {
        ...AVERY,
        id: "rs-1",
        time: "9:12 AM",
        blocks: [
          {
            kind: "text",
            text: `Hey Carlos — can you share the latest pipeline status for the ${ROLE} role?`,
          },
        ],
      },
      {
        ...CARLOS,
        id: "rs-2",
        time: "9:13 AM",
        blocks: [
          { kind: "text", text: "Absolutely — I'll use Cadence to pull the latest pipeline report now." },
        ],
      },
      {
        ...CARLOS,
        id: "rs-3",
        time: "9:14 AM",
        blocks: [
          { kind: "text", text: `@cadence generate an updated pipeline report for ${ROLE}.` },
        ],
      },
      {
        ...CADENCE,
        id: "rs-4",
        time: "9:14 AM",
        blocks: [
          { kind: "title", text: `${ROLE} · Pipeline Snapshot` },
          {
            kind: "fields",
            items: [
              { label: "Hiring Manager", value: "Avery Chen" },
              { label: "Active Candidates", value: "6" },
              { label: "Week-over-week", value: "+1 active candidate" },
            ],
          },
          { kind: "subhead", text: "Active Pipeline" },
          {
            kind: "group",
            heading: "Recruiter Screen",
            count: 2,
            items: [
              { name: "Nia Whitfield", icon: SCHEDULED, detail: "Scheduled: Aug 25" },
              { name: "Elena Torres", icon: DONE, detail: "Interviewed: Aug 20" },
            ],
          },
          {
            kind: "group",
            heading: "Hiring Manager Screen",
            count: 1,
            items: [{ name: "Noah Williams", icon: SCHEDULED, detail: "Scheduled: Aug 22" }],
          },
          {
            kind: "group",
            heading: "Interview Loop",
            count: 2,
            items: [
              { name: "Maya Okafor", icon: SCHEDULED, detail: "Scheduled: Aug 26" },
              { name: "Daniel Kim", icon: DONE, detail: "Interviewed: Aug 19" },
            ],
          },
          {
            kind: "group",
            heading: "Offer",
            count: 1,
            items: [{ name: "Priya Shah", icon: DONE, detail: "Offer extended: Aug 20" }],
          },
          { kind: "subhead", text: "What Changed in the Last 7 Days" },
          {
            kind: "list",
            items: [
              { icon: ENTERED, text: "Nia Whitfield entered the pipeline." },
              { icon: ENTERED, text: "Elena Torres entered the pipeline." },
              { icon: ADVANCED, text: "Daniel Kim advanced to Interview Loop." },
              { icon: ADVANCED, text: "Priya Shah advanced to Offer." },
              { icon: WITHDREW, text: "One candidate withdrew." },
            ],
          },
          { kind: "context", text: "Updated Aug 21 at 9:14 AM" },
        ],
      },
    ],
  },

  /* ------------------------- 2. feedback alert and interviewer reminder */
  {
    id: "feedback-reminder",
    kind: "workflow",
    name: "Feedback reminder",
    topic: "Overdue interview feedback, and the reminder you choose to send",
    unread: 1,
    messages: [
      {
        ...CADENCE,
        id: "fb-1",
        time: "2:00 PM",
        label: "Private feedback alert to Carlos",
        blocks: [
          { kind: "title", icon: "⏳", text: "Feedback outstanding · 50h" },
          {
            kind: "fields",
            items: [
              { label: "Candidate", value: "Maya Okafor", link: true },
              { label: "Role", value: ROLE, link: true },
              { label: "Interview", value: "Systems Design" },
              { label: "Interviewer", value: "Jordan Lee" },
              { label: "Interview date", value: "Aug 19" },
              { label: "Feedback outstanding", value: "50 hours" },
            ],
          },
          {
            kind: "text",
            text: "No feedback has been submitted yet. Would you like Cadence to send Jordan a reminder?",
          },
          { kind: "feedback" },
        ],
      },
    ],
  },

  /* ------------------------ the interviewer view opened after recruiter send */
  {
    id: "jordan-lee",
    kind: "dm",
    name: "Jordan Lee",
    topic: "Direct message · Interviewer view",
    unread: 0,
    avatar: "JL",
    messages: [
      {
        ...CADENCE,
        id: "fb-dm-1",
        time: "2:01 PM",
        showWhen: ["sent", "replying", "replied"],
        blocks: [
          {
            kind: "text",
            text: `Hi Jordan, interview feedback is still outstanding for Maya Okafor's Systems Design interview for the ${ROLE} role. Please submit your feedback in Ashby when you can.`,
          },
          { kind: "actions", items: ["Open feedback form in Ashby"] },
        ],
      },
      {
        ...JORDAN,
        id: "fb-dm-2",
        time: "2:02 PM",
        showWhen: "replied",
        blocks: [
          {
            kind: "text",
            text: "Sorry for the delay — I'll submit my feedback in Ashby ASAP.",
          },
        ],
      },
    ],
  },

  /* ------------------------------- 3. weekly stale-candidate nudge */
  {
    id: "stale-nudge",
    kind: "workflow",
    name: "Weekly stale nudge",
    topic: "Monday summary of candidates waiting 5+ business days",
    unread: 0,
    messages: [
      {
        ...CADENCE,
        id: "sn-1",
        time: "Monday, 8:00 AM",
        label: "Private message to Carlos",
        blocks: [
          { kind: "title", text: "Weekly stale candidate nudge" },
          {
            kind: "text",
            text: "You have 3 candidates with no recorded action for 5+ business days across 2 roles.",
          },
          {
            kind: "group",
            heading: ROLE,
            items: [
              { name: "Elena Torres", detail: "Hiring Manager Review · 6 business days" },
              { name: "Daniel Kim", detail: "Interview Loop · 8 business days" },
            ],
          },
          {
            kind: "group",
            heading: "Senior Product Designer",
            items: [{ name: "Jordan Bell", detail: "Portfolio Review · 5 business days" }],
          },
          { kind: "text", text: "Please review these candidates in Ashby to keep the pipelines moving." },
          { kind: "actions", items: ["Review candidates"] },
        ],
      },
    ],
  },

  /* ------------------------------------ 4. immediate offer acceptance */
  {
    id: "offer-accepted",
    kind: "channel",
    name: "offer-accepted",
    topic: "Offer acceptances, posted as they happen",
    unread: 1,
    messages: [
      {
        ...CARLOS,
        id: "oa-1",
        time: "11:06 AM",
        blocks: [
          {
            kind: "text",
            text: "I spoke with Priya this morning. The conversation went well, and she sounded genuinely excited about the team and the scope of the role.",
          },
        ],
      },
      {
        ...AVERY,
        id: "oa-2",
        time: "11:09 AM",
        blocks: [
          {
            kind: "text",
            text: "That's great to hear. Are we aligned on next steps?",
          },
        ],
      },
      {
        ...CARLOS,
        id: "oa-3",
        time: "11:11 AM",
        blocks: [
          {
            kind: "text",
            text: "Yes — the offer has been extended. I'll keep you posted as soon as I hear back.",
          },
        ],
      },
      {
        ...CADENCE,
        id: "oa-4",
        time: "3:42 PM",
        dividerBefore: "A few hours later",
        blocks: [
          { kind: "title", icon: "🎉", text: "Offer accepted" },
          {
            kind: "text",
            text: `[Priya Shah] has accepted the offer for ${ROLE}!`,
          },
        ],
        reactions: [
          { emoji: "🎉", count: 9 },
          { emoji: "🙌", count: 4 },
        ],
      },
      {
        ...AVERY,
        id: "oa-5",
        time: "3:43 PM",
        blocks: [
          {
            kind: "text",
            text: "Amazing news! Thanks for keeping this moving, Carlos — I'm excited to welcome Priya to the team.",
          },
        ],
      },
    ],
  },
];

export const cadenceDefaultChannel = "role-status";

/** Shown under the stream. Says what the demo is, once, without repeating it. */
export const cadenceFootnote = "Interactive demonstration · All people and recruiting data are synthetic.";
