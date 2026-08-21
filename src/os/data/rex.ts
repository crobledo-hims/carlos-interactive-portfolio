// Rex — synthetic demonstration fixtures.
//
// Rex is a Slack-first recruiting workflow automation built with Zapier,
// Airtable, Slack and ChatGPT, with links back to Ashby for recruiting records
// and interview feedback. It is not an ATS, a dashboard, a candidate evaluator
// or a forecasting system, and nothing here should imply otherwise.
//
// Four workflows are demonstrated, one per sidebar entry:
//   #role-status        a pipeline report produced on demand
//   Feedback reminder   an overdue-feedback alert, and the reminder the
//                       recruiter can choose to send to the interviewer
//   Weekly stale nudge  candidates with no recorded action for 5+ business days
//   #offer-accepted     an offer acceptance, posted as it happens
//
// Every person, role, candidate, date and number below is invented for this
// portfolio. Nothing is drawn from a real employer, requisition or person, and
// nothing is transmitted anywhere: the app renders these fixtures locally and
// the one interactive workflow simulates its outcome in React state.
//
// Editing rule: Rex only ever reports what it can observe. Do not add
// forecasts, scores, role health, risk ratings, recommended strategy, or any
// action Rex cannot actually take.

/* ==========================================================================
   Message blocks — the Slack/Block Kit vocabulary the renderer understands
   ========================================================================== */

/** A bold-label line, the way Slack renders "*Label:* value". */
export interface RexFieldLine {
  label: string;
  value: string;
  /** Render the value as a candidate or role link. */
  link?: boolean;
}

/** One candidate row inside a stage or role group. */
export interface RexItem {
  /** Rendered as a Slack link. */
  name: string;
  /** Decorative glyph; the words in `detail` always carry the meaning. */
  icon?: string;
  detail: string;
}

/** A bulleted line that may carry a restrained leading glyph. */
export interface RexLine {
  icon?: string;
  text: string;
}

export type RexBlock =
  /** The bold headline of a message. */
  | { kind: "title"; text: string; icon?: string }
  /** A bold section label inside a message. */
  | { kind: "subhead"; text: string }
  /** Plain paragraph text; supports *bold* and @mentions. */
  | { kind: "text"; text: string }
  | { kind: "fields"; items: RexFieldLine[] }
  /** A stage or role heading with its own candidate rows. */
  | { kind: "group"; heading: string; count?: number; items: RexItem[] }
  | { kind: "list"; items: RexLine[] }
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
export type FeedbackState = "pending" | "sending" | "sent" | "declined";

export interface RexReaction {
  emoji: string;
  count: number;
}

export interface RexMessage {
  id: string;
  author: string;
  /** Shown next to the name, Slack-profile style. */
  role?: string;
  initials: string;
  color: string;
  bot: boolean;
  time: string;
  /** Caption above the message saying who can see it. */
  label?: string;
  blocks: RexBlock[];
  reactions?: RexReaction[];
  /** Only rendered while the feedback workflow is in this state. */
  showWhen?: FeedbackState;
}

export interface RexChannel {
  id: string;
  kind: "channel" | "workflow";
  name: string;
  topic: string;
  unread: number;
  /**
   * Messages on screen before the composer types the next one out. That
   * message's own text is the script. Only the story channel sets these.
   */
  composerAfter?: number;
  typingLabel?: string;
  messages: RexMessage[];
}

export const rexWorkspace = {
  name: "Rex Ops",
  initials: "RX",
  tagline: "Zapier · Airtable · Slack · ChatGPT",
};

/** Rex's Slack app identity. */
const REX = {
  initials: "RX",
  color: "#4d6bd8",
  bot: true,
  author: "Rex",
  role: "Recruiting Support",
};
const CARLOS = { initials: "CR", color: "#3f7f6d", bot: false, author: "Carlos Robledo" };
const AVERY = {
  initials: "AC",
  color: "#a15540",
  bot: false,
  author: "Avery Chen",
  role: "VP, Engineering",
};

const ROLE = "Staff Backend Engineer, Payments Platform";

/** Restrained glyphs. Every one of them sits beside words that say the same thing. */
const SCHEDULED = "▸";
const DONE = "✓";
const ADVANCED = "↑";
const ENTERED = "+";
const WITHDREW = "×";

export const rexChannels: RexChannel[] = [
  /* ---------------------------------------- 1. on-demand pipeline report */
  {
    id: "role-status",
    kind: "channel",
    name: "role-status",
    topic: "Ask Rex for a pipeline report at any time",
    unread: 1,
    composerAfter: 2,
    typingLabel: "Rex is generating the pipeline report…",
    messages: [
      {
        ...AVERY,
        id: "rs-1",
        time: "9:12 AM",
        blocks: [
          {
            kind: "text",
            text: `Hey Carlos, can you share a current pipeline update for the ${ROLE} search?`,
          },
        ],
      },
      {
        ...CARLOS,
        id: "rs-2",
        time: "9:13 AM",
        blocks: [{ kind: "text", text: "Absolutely. I'm going to use Rex to pull the latest pipeline report." }],
      },
      {
        // The composer types this one out live before posting it.
        ...CARLOS,
        id: "rs-3",
        time: "9:14 AM",
        blocks: [{ kind: "text", text: `@Rex Provide a pipeline report for ${ROLE}` }],
      },
      {
        ...REX,
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
        ...REX,
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
            text: "No feedback has been submitted yet. Would you like Rex to send Jordan a reminder?",
          },
          { kind: "feedback" },
        ],
      },
      {
        ...REX,
        id: "fb-2",
        time: "2:01 PM",
        label: "Direct message sent to interviewer",
        showWhen: "sent",
        blocks: [
          {
            kind: "text",
            text: `Hi Jordan, interview feedback is still outstanding for Maya Okafor's Systems Design interview for the ${ROLE} role. Please submit your feedback in Ashby when you can.`,
          },
          { kind: "actions", items: ["Open feedback form in Ashby"] },
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
        ...REX,
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
        ...REX,
        id: "oa-1",
        time: "3:42 PM",
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
    ],
  },
];

export const rexDefaultChannel = "role-status";

/** Shown under the stream. Says what the demo is, once, without repeating it. */
export const rexFootnote = "Interactive demonstration · All people and recruiting data are synthetic.";
