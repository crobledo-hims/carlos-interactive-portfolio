// Editable sample content for the Rex app window.
// Everything here is illustrative: candidate names, reqs and numbers are
// fictional placeholders meant to be swapped for real (redacted) screenshots
// or copy later. No real candidate data belongs in this file.

export interface RexField {
  label: string;
  value: string;
}

export interface RexAttachment {
  /** Left accent bar colour, Slack-attachment style. */
  accent: string;
  title: string;
  fields: RexField[];
  context?: string;
  actions?: string[];
}

export interface RexReaction {
  emoji: string;
  count: number;
}

export interface RexMessage {
  id: string;
  author: string;
  initials: string;
  color: string;
  bot: boolean;
  time: string;
  text?: string;
  attachment?: RexAttachment;
  reactions?: RexReaction[];
  thread?: string;
}

export interface RexChannel {
  id: string;
  kind: "channel" | "dm";
  name: string;
  topic: string;
  unread: number;
  messages: RexMessage[];
}

export const rexWorkspace = {
  name: "Rex Ops",
  initials: "RX",
  tagline: "Recruiting operations, automated",
};

const REX = { author: "Rex", initials: "RX", color: "#4d6bd8", bot: true };
const CARLOS = { author: "Carlos Robledo", initials: "CR", color: "#3f7f6d", bot: false };

export const rexChannels: RexChannel[] = [
  {
    id: "pipeline-alerts",
    kind: "channel",
    name: "pipeline-alerts",
    topic: "Automated pipeline movement + health alerts from Ashby",
    unread: 3,
    messages: [
      {
        ...REX,
        id: "pa-1",
        time: "9:02 AM",
        text: "Morning sweep complete — 6 open reqs, 214 active candidates.",
        attachment: {
          accent: "#4d6bd8",
          title: "Daily pipeline digest",
          fields: [
            { label: "New applicants", value: "34" },
            { label: "Recruiter screens", value: "12" },
            { label: "Onsites scheduled", value: "7" },
            { label: "Offers outstanding", value: "3" },
          ],
          context: "Source: Ashby · synced 9:01 AM · posts weekdays at 9:00 AM CT",
          actions: ["Open in Airtable", "Snooze 24h"],
        },
        reactions: [
          { emoji: "👀", count: 4 },
          { emoji: "🚀", count: 2 },
        ],
      },
      {
        ...REX,
        id: "pa-2",
        time: "10:41 AM",
        text: "Health check tripped on *Staff Backend Engineer (Payments)*.",
        attachment: {
          accent: "#d1544f",
          title: "Onsite volume below plan",
          fields: [
            { label: "Req", value: "IC5-PAY-04" },
            { label: "Rule", value: "PH-04" },
            { label: "Onsites this week", value: "1 (target 4)" },
            { label: "Remaining hires", value: "2" },
          ],
          context: "Rule PH-04 · onsite volume < 2x remaining hires for 7 days",
          actions: ["Acknowledge", "Open req"],
        },
      },
      {
        ...CARLOS,
        id: "pa-3",
        time: "10:44 AM",
        text:
          "Acknowledged. Pulling two more from the Q2 silver-medalist list — should backfill the loop by Thursday.",
        thread: "2 replies",
      },
      {
        ...REX,
        id: "pa-4",
        time: "2:15 PM",
        text: "Stage change: *Maya Okafor* → Onsite · Staff Backend Engineer (Payments).",
        attachment: {
          accent: "#3f7f6d",
          title: "Maya Okafor moved to Onsite",
          fields: [
            { label: "Source", value: "Outbound" },
            { label: "Days in pipeline", value: "18" },
            { label: "Loop date", value: "Aug 21" },
            { label: "Recruiter", value: "Carlos" },
          ],
          context: "Panel auto-drafted in Airtable · awaiting interviewer confirmation",
        },
      },
    ],
  },
  {
    id: "offer-stage",
    kind: "channel",
    name: "offer-stage",
    topic: "Offer extended → decision → accept, with decision-clock reminders",
    unread: 1,
    messages: [
      {
        ...REX,
        id: "os-1",
        time: "8:31 AM",
        text: "Offer extended — *Dev Raman* · Sr. iOS Engineer.",
        attachment: {
          accent: "#c98a2e",
          title: "Offer out · decision clock running",
          fields: [
            { label: "Level", value: "L5" },
            { label: "Comp band", value: "Approved" },
            { label: "Decision due", value: "Aug 22" },
            { label: "Recruiter", value: "Carlos" },
          ],
          context: "Reminder fires 24h before the decision date",
          actions: ["Ping hiring manager", "Log candidate call"],
        },
      },
      {
        ...REX,
        id: "os-2",
        time: "11:07 AM",
        text: "Offer accepted 🎉 — *Priya Nandakumar* · Applied AI Engineer.",
        attachment: {
          accent: "#3f7f6d",
          title: "Accept logged",
          fields: [
            { label: "Start date", value: "Sep 8" },
            { label: "Cycle time", value: "31 days" },
            { label: "Source", value: "Outbound" },
            { label: "Offer→accept", value: "3 days" },
          ],
          context: "Airtable row updated · headcount plan decremented",
        },
        reactions: [
          { emoji: "🎉", count: 11 },
          { emoji: "🙌", count: 5 },
        ],
      },
      {
        ...CARLOS,
        id: "os-3",
        time: "11:12 AM",
        text: "That closes the second Applied AI seat. One to go on that pod.",
      },
      {
        ...REX,
        id: "os-4",
        time: "4:00 PM",
        text: "Reminder: 2 offers have been outstanding more than 48 hours.",
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
        text: "Weekly hiring report — week of Aug 18.",
        attachment: {
          accent: "#4d6bd8",
          title: "Week 34 summary",
          fields: [
            { label: "Offers out", value: "3" },
            { label: "Accepts", value: "2" },
            { label: "Onsites", value: "9" },
            { label: "Time to offer", value: "34 days" },
            { label: "Screens", value: "27" },
            { label: "Pass-through", value: "38%" },
          ],
          context: "Auto-generated from Ashby + Airtable · no manual assembly required",
          actions: ["View full report", "Share with leadership"],
        },
      },
      {
        ...REX,
        id: "wr-2",
        time: "Mon 8:00 AM",
        text:
          "Estimated recruiter time returned this week: *6.4 hours* across 5 recruiters (reporting + follow-up automation).",
        reactions: [{ emoji: "🙌", count: 6 }],
      },
    ],
  },
  {
    id: "stale-candidates",
    kind: "channel",
    name: "stale-candidates",
    topic: "Idle-candidate nudges — drafts queued, never auto-sent",
    unread: 2,
    messages: [
      {
        ...REX,
        id: "sc-1",
        time: "7:45 AM",
        text: "4 candidates have been idle longer than 5 days.",
        attachment: {
          accent: "#c98a2e",
          title: "Idle > 5 days",
          fields: [
            { label: "Jules Arden", value: "7 days · Recruiter screen" },
            { label: "Tomas Beck", value: "6 days · Debrief" },
            { label: "Ingrid Sorensen", value: "6 days · Onsite scheduling" },
            { label: "Noor Haddad", value: "5 days · Take-home" },
          ],
          context: "Threshold configurable per stage",
        },
      },
      {
        ...REX,
        id: "sc-2",
        time: "7:45 AM",
        text: "Follow-up drafts are ready for review — *4 queued, 0 sent*.",
        attachment: {
          accent: "#4d6bd8",
          title: "Human-in-the-loop",
          fields: [
            { label: "Drafted", value: "4" },
            { label: "Awaiting approval", value: "4" },
            { label: "Auto-sent", value: "0" },
          ],
          context: "Rex never sends candidate-facing messages without recruiter approval",
          actions: ["Review drafts", "Approve all"],
        },
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
        text: "Panel gap — Systems Design interviewer unassigned for the Aug 21 loop.",
        attachment: {
          accent: "#d1544f",
          title: "Loop at risk",
          fields: [
            { label: "Candidate", value: "Maya Okafor" },
            { label: "Missing", value: "Systems Design" },
            { label: "Loop", value: "Aug 21, 10:00 AM CT" },
          ],
          actions: ["Suggest interviewers"],
        },
      },
      {
        ...REX,
        id: "io-2",
        time: "3:02 PM",
        text: "Debrief scheduled — *Tomas Beck* · Engineering Manager, Platform · Aug 20, 4:30 PM CT.",
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
        text:
          "Heads up — your Monday report will run 30 minutes early next week while Ashby backfills a schema change. Nothing for you to do.",
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
