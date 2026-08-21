// Relay — synthetic demonstration fixtures.
//
// Every candidate, company, hiring manager, team, role and note below is
// invented for this portfolio. Nothing here is drawn from a real employer, a
// real requisition or a real person, and nothing is transmitted anywhere: each
// workflow renders pre-authored text that ships with the page.
//
// The demos show the *shape* of three prompt-driven workflows Carlos built —
// what the inputs are, what rules constrain the output, and what the output
// looks like. The underlying instruction sets are not reproduced here.
//
// Source-fidelity rule for anyone editing this file: every sentence in an
// output fixture must be traceable to a line in the source cards above it. If
// an edit needs a new fact, add it to the source card first. Technology names
// in a job description never establish how a system is built, and nothing
// about team size, company size, volume or system history is supported unless
// a source card states it outright.

export const SYNTHETIC = "Synthetic demonstration data";

/** A labelled input the workflow reads from, shown as a compact source card. */
export interface SourceCard {
  id: string;
  label: string;
  /** Rank in the source-priority order, 1 being highest authority. */
  rank?: number;
  note?: string;
  lines: string[];
  empty?: boolean;
}

/* ==========================================================================
   1. Slack Brief — executive-ready candidate summary, shared by hand
   ========================================================================== */

export const briefCandidate = {
  name: "Nia Whitfield",
  headline: "Senior Software Engineer, Billing Experience",
  company: "Cobalt Bank",
  reference: "nia-whitfield-resume.pdf",
};

export const briefSources: SourceCard[] = [
  {
    id: "intake",
    label: "Intake notes",
    rank: 1,
    note: "Recruiter and candidate conversations",
    lines: [
      "Owns the billing experience end to end, including the service layer behind the customer-facing interface.",
      "Rebuilt the invoice and payment-method flows after a vendor migration failed.",
      "Worked with two other engineers on the rebuild. She led the design and the rollout.",
      "Names reliability as the thing she is proudest of, not the redesign.",
      "Looking for a smaller company where her work sits closer to the customer.",
    ],
  },
  {
    id: "profile",
    label: "Resume / profile",
    rank: 2,
    note: "Grounds titles, dates, metrics, tech",
    lines: [
      "Cobalt Bank, Senior Software Engineer, 2021 to present. Billing Experience.",
      "Cobalt Bank, Software Engineer, 2018 to 2021. Payments integrations.",
      "Led the invoice and payment-method rebuild. Billing support tickets fell by about a third.",
      "Introduced contract tests between the billing service and three client applications.",
      "TypeScript, React, Node, Postgres, GraphQL.",
    ],
  },
];

export const briefGuardrails = [
  "Intake notes are the primary narrative source",
  "Claims must be traceable to the notes or the profile",
  "Missing information is omitted, never filled in",
  "Collaboration is not rewritten as sole ownership",
  "Metrics are never invented",
  "No company size or tenure the sources do not state",
];

export const briefOutput = {
  bullets: [
    "Senior Software Engineer at Cobalt Bank, owning the billing experience end to end, including the service layer behind the customer-facing interface.",
    "Led the design and rollout of an invoice and payment-method rebuild after a failed vendor migration, working with two other engineers.",
    "The rebuild reduced billing support tickets by roughly one-third.",
    "Introduced contract tests between the billing service and three client applications.",
    "Promoted from payments integrations into broader ownership of the billing experience.",
    "Interested in joining a smaller company where her work is closer to the customer.",
  ],
  techStack: "TypeScript, React, Node, Postgres, GraphQL",
};

/* ==========================================================================
   2. Outreach Sequence — a reusable, role-level outreach workflow
   ========================================================================== */

export type OutreachLevel = "senior" | "staff" | "principal";
export type OutreachFormat = "default" | "linkedin" | "sobo";

export interface OutreachMessage {
  id: string;
  label: string;
  /** When this touch goes out relative to the one before it. */
  timing: string;
  paragraphs: string[];
}

export const outreachRole = {
  title: "Backend Engineer, Scheduling Platform",
  company: "Northstar Health",
  team: "Scheduling Platform",
  manager: "Dana Reyes, Director of Engineering",
};

export const outreachSources: SourceCard[] = [
  {
    id: "intake",
    label: "Intake notes",
    rank: 1,
    note: "Hiring manager conversation",
    lines: [
      "Availability rules are spread across three services. Consolidating them is the job.",
      "Wants someone who has run a platform, not only built one.",
      "Partner team: Provider Tools, the tools providers use day to day.",
    ],
  },
  {
    id: "roadmap",
    label: "Roadmap context",
    rank: 2,
    note: "Direction, generalized",
    lines: [
      "Scheduling becomes a platform other engineering teams build on.",
      "New appointment types should be configuration, not separate projects.",
    ],
  },
  {
    id: "jd",
    label: "Job description",
    rank: 3,
    note: "Stack and formal scope",
    lines: ["Go, Postgres, Kafka, Kubernetes.", "On call within the team rotation."],
  },
  {
    id: "hm",
    label: "Hiring manager context",
    note: "Optional color",
    lines: [
      "Dana Reyes, Director of Engineering, is the hiring manager.",
      "Not a greenfield build. The platform is live and has to stay reliable while it is simplified.",
    ],
  },
];

export const outreachGuardrails = [
  "No em dashes",
  "No buzzwords",
  "No confidential roadmap details",
  "Candidate-facing language, never a job description",
  "No repeated angle across touches",
  "Intake notes have the highest authority",
  "No claims about the candidate the sources do not supply",
  "No team or company size unless a source states it",
];

const senior: Record<OutreachFormat, OutreachMessage[]> = {
  default: [
    {
      id: "s-initial",
      label: "Initial outreach",
      timing: "Day 0, role paragraph",
      paragraphs: [
        "I'm reaching out today with a strong interest in your experience for the Senior Backend Engineer role on our Scheduling Platform team.",
        "You would own the core scheduling services, starting with the availability rules that currently sit in three separate services. Consolidating those into one model is the near-term work, and running the result is the ongoing part of the job. The hiring manager is looking for someone who has operated a platform, not only built one.",
        "If you're open to a quick conversation, you can find time on my calendar here.",
      ],
    },
    {
      id: "s-f1",
      label: "Follow-up 1",
      timing: "3 days later",
      paragraphs: [
        "I know how busy things can get, so I wanted to bring this back to the top of your inbox.",
        "One detail I left out: the role partners closely with Provider Tools, the team that builds what providers use day to day. Scheduling is becoming a platform other engineering teams build on, so this work is shared rather than owned in isolation.",
        "If that sounds like the right kind of scope, you can find time on my calendar here.",
      ],
    },
    {
      id: "s-f2",
      label: "Follow-up 2",
      timing: "5 days after follow-up 1",
      paragraphs: [
        "I don't want to fill your inbox, so this will be my last note for now.",
        "We're moving quickly on this search, and I understand if the timing is not right. I'd be glad to stay connected either way.",
        "One last detail worth knowing: the goal is for a new appointment type to become a configuration change rather than a separate project. If you'd like to hear more, you can find time on my calendar here.",
      ],
    },
  ],
  linkedin: [
    {
      id: "s-li",
      label: "LinkedIn message",
      timing: "Single touch, shorter form",
      paragraphs: [
        "Hi Jordan, I'm Carlos, a technical sourcer at Northstar Health.",
        "We're hiring a Senior Backend Engineer for our Scheduling Platform team. The near-term work is consolidating availability rules that currently span three services into one model, and then running the result. The job description lists Go, Postgres, Kafka, and Kubernetes.",
        "If you're open to it, I'd be glad to send over the details.",
      ],
    },
  ],
  sobo: [
    {
      id: "s-sobo",
      label: "Sent on behalf of the hiring manager",
      timing: "Leader's voice",
      paragraphs: [
        "Hi Jordan, I'm Dana Reyes, Director of Engineering at Northstar Health.",
        "I lead the team that owns scheduling. We're hiring a senior backend engineer to consolidate availability rules that currently span three services, and then to run what comes out of that. I wanted to write to you about it directly.",
        "If you're open to a short conversation, I'm glad to answer your questions myself.",
      ],
    },
  ],
};

const staff: Record<OutreachFormat, OutreachMessage[]> = {
  default: [
    {
      id: "st-initial",
      label: "Initial outreach",
      timing: "Day 0, role paragraph",
      paragraphs: [
        "I'm reaching out today with a strong interest in your experience for the Staff Backend Engineer role on our Scheduling Platform team.",
        "The team is consolidating availability rules that currently span three services into a platform other engineering teams can build on. You would set the technical direction for that work, define a durable availability model, and help make new appointment types configurable rather than separate engineering projects. The role combines architecture leadership with ownership of a production platform and its reliability.",
        "If you're open to a quick conversation, you can find time on my calendar here.",
      ],
    },
    {
      id: "st-f1",
      label: "Follow-up 1",
      timing: "3 days later",
      paragraphs: [
        "I know how busy things can get, so I wanted to bring this back to the top of your inbox.",
        "One additional detail: this is not a greenfield build. The work involves simplifying a live scheduling platform while keeping it reliable for the teams that depend on it.",
        "If that type of ownership is relevant to you, you can find time on my calendar here.",
      ],
    },
    {
      id: "st-f2",
      label: "Follow-up 2",
      timing: "5 days after follow-up 1",
      paragraphs: [
        "I don't want to fill your inbox, so this will be my last note for now.",
        "We're moving quickly on the Staff Backend Engineer search, but I understand if the timing is not right. I'd be glad to stay connected either way.",
        "If a brief technical overview would be useful, you can find time on my calendar here.",
      ],
    },
  ],
  linkedin: [
    {
      id: "st-li",
      label: "LinkedIn message",
      timing: "Single touch, shorter form",
      paragraphs: [
        "Hi Jordan, I'm Carlos, a technical sourcer at Northstar Health.",
        "We're hiring a Staff Backend Engineer to set the technical direction for our scheduling platform. The work is one availability model in place of the three we have now, and new appointment types that are configured rather than built. The job description lists Go, Postgres, Kafka, and Kubernetes.",
        "If you're open to it, I'd be glad to send over the details.",
      ],
    },
  ],
  sobo: [
    {
      id: "st-sobo",
      label: "Sent on behalf of the hiring manager",
      timing: "Leader's voice",
      paragraphs: [
        "Hi Jordan, I'm Dana Reyes, Director of Engineering at Northstar Health.",
        "I lead the team that owns scheduling, and I'm hiring the staff engineer who will set the technical direction for it. The first piece of work is a single availability model in place of the three we have now, and the person who designs it stays with it in production.",
        "If you're open to a short conversation, I'm glad to go through the details myself.",
      ],
    },
  ],
};

const principal: Record<OutreachFormat, OutreachMessage[]> = {
  default: [
    {
      id: "p-initial",
      label: "Initial outreach",
      timing: "Day 0, role paragraph",
      paragraphs: [
        "I'm reaching out today with a strong interest in your experience for the Principal Engineer role on our Scheduling Platform team.",
        "This is the most senior technical role on the platform. Scheduling is becoming something other engineering teams build on, and you would decide what that platform offers them, starting with a single availability model in place of rules that currently span three services. You would also own the result in production rather than handing it off after the design.",
        "If you're open to a quick conversation, you can find time on my calendar here.",
      ],
    },
    {
      id: "p-f1",
      label: "Follow-up 1",
      timing: "3 days later",
      paragraphs: [
        "I know how busy things can get, so I wanted to bring this back to the top of your inbox.",
        "To add a bit more detail: one measure of this work is that adding a new appointment type becomes a configuration change rather than a separate engineering project. That outcome depends on the model being right at the start, which is most of why the role sits at this level.",
        "If that's the kind of problem you want next, you can find time on my calendar here.",
      ],
    },
    {
      id: "p-f2",
      label: "Follow-up 2",
      timing: "5 days after follow-up 1",
      paragraphs: [
        "I don't want to fill your inbox, so this will be my last note for now.",
        "We're moving quickly here, and if the timing is not right I'd still like to stay connected.",
        "If it's useful, I'm glad to walk through where the platform stands today before anything formal. You can find time on my calendar here.",
      ],
    },
  ],
  linkedin: [
    {
      id: "p-li",
      label: "LinkedIn message",
      timing: "Single touch, shorter form",
      paragraphs: [
        "Hi Jordan, I'm Carlos, a technical sourcer at Northstar Health.",
        "We're opening a Principal Engineer role on our scheduling platform. It's the most senior technical role on the team: define a single availability model in place of the three sets of rules we have now, decide what the platform offers the teams that build on it, and own it in production.",
        "If you're open to it, I'd be glad to send over the details.",
      ],
    },
  ],
  sobo: [
    {
      id: "p-sobo",
      label: "Sent on behalf of the hiring manager",
      timing: "Leader's voice",
      paragraphs: [
        "Hi Jordan, I'm Dana Reyes, Director of Engineering at Northstar Health.",
        "I lead the team that owns scheduling. I'm hiring a principal engineer to decide what this platform becomes for the teams that will build on it, starting with the availability model. It is the most senior technical role on the team.",
        "If you're open to a conversation about what that looks like here, I'll find the time this week.",
      ],
    },
  ],
};

export const outreachFixtures: Record<OutreachLevel, Record<OutreachFormat, OutreachMessage[]>> = {
  senior,
  staff,
  principal,
};

export const outreachLevelNotes: Record<OutreachLevel, string> = {
  senior: "Ownership of the core services and the reliability that comes with running them.",
  staff: "Technical leadership, architecture direction, and influence across teams.",
  principal: "The most senior technical role: platform direction and cross-team influence.",
};

export const outreachFormatNotes: Record<OutreachFormat, string> = {
  default: "Three touches: role paragraph, follow-up at three days, close at five days after that.",
  linkedin: "One shorter message for a connection request or InMail.",
  sobo: "Sent on behalf of a leader, in their voice rather than the recruiter's.",
};

/* ==========================================================================
   3. Talk Track — a call-ready recruiter-screen script
   ========================================================================== */

export type TalkVariant = "base" | "short" | "technical" | "conversational";

export const talkSources: SourceCard[] = [
  {
    id: "intake",
    label: "Intake notes",
    rank: 1,
    note: "Hiring manager conversation",
    lines: [
      "Availability rules live in three services. Consolidating them is the work.",
      "Wants someone who has run a platform through its operational years, not only built one.",
      "Partner team: Provider Tools, the tools providers use day to day.",
    ],
  },
  {
    id: "roadmap",
    label: "Roadmap context",
    rank: 2,
    note: "Direction, generalized",
    lines: [
      "A scheduling platform other engineering teams build on.",
      "New appointment types become configuration rather than engineering projects.",
    ],
  },
  {
    id: "jd",
    label: "Job description",
    rank: 3,
    note: "Stack and formal scope",
    lines: ["Go, Postgres, Kafka, Kubernetes.", "On call within the team rotation."],
  },
  {
    id: "overrides",
    label: "In-chat overrides",
    note: "Supplied during the conversation",
    lines: [],
    empty: true,
  },
];

export const talkGuardrails = [
  "Intake notes are the highest authority",
  "Critical gaps are resolved before drafting",
  "Noncritical unknowns are omitted",
  "Candidate-facing scripts never mention missing notes or recruiter knowledge gaps",
  "Confidential details are generalized",
  "No invented scope, partners, KPIs or technology",
  "Technical depth comes only from supplied context",
  "A technology list never becomes an invented architecture",
  "Candidate questions explore the candidate's experience, never unsupported role facts",
  "Output is written to be read aloud",
];

/** Gaps the workflow asks about instead of guessing. */
export const talkClarifications = [
  "Why now: what changed that makes this role open at this point.",
  "Day-to-day scope: what the first ninety days look like beyond the title.",
  "Hard constraints: whether the on-call rotation and location expectations are firm.",
];

/** What Carlos comes back with after asking the hiring manager. */
export const talkOverrides = [
  "Why now: the team can ship features but cannot change the availability model safely.",
  "First ninety days: read the three services, then propose one unified model and a migration path.",
  "Constraints: on call is shared across the team, and the role is remote within the country.",
];

export interface TalkFixture {
  label: string;
  note: string;
  paragraphs: string[];
}

const BASE: string[] = [
  "Thanks for making the time. I'll give you the picture of the team and the role, and then I'd like to hear how it lands for you.",
  "We're hiring a Staff Backend Engineer for the Scheduling Platform team at Northstar Health. Scheduling is how someone books time with a provider and changes that time later.",
  "Today, availability rules are spread across three services, which makes the model difficult to change safely. Adding a new appointment type also requires engineering work, when the goal is for those additions to become configurable.",
  "That is why the role is open now. The team can ship features, but it cannot change the availability model safely, and most of what comes next sits behind that.",
  "Where the team is heading is a scheduling platform other engineering teams can build on. In practice that means one availability model to reason about instead of three, and a new appointment type arriving as configuration rather than as a project with its own timeline. Those are the two outcomes the team is building toward.",
  "This person would set the technical direction for consolidating that model, and would own the platform beyond the initial design work. The hiring manager was specific about the second half of that. She wants someone who has run a platform through its operational years, not only built one.",
  "The first ninety days are focused on understanding the three existing services and proposing a unified model and migration path. That gives the person in this role meaningful ownership of both the technical direction and how the team moves toward it.",
  "The interesting part of this work is the judgment rather than the volume of code. Three services hold the rules today, and someone has to decide what one model should look like and how to get there.",
  "The role partners closely with Provider Tools, the team that builds what providers use day to day.",
  "The job description lists Go, Postgres, Kafka, and Kubernetes. The role also participates in the team's shared on-call rotation. The position is remote within the country.",
  "What we're looking for is someone who has done this at staff level. Set the direction, then stay with the platform while it runs. That second half is the part the hiring manager kept coming back to. If that lines up with what you enjoy, I'd like to hear how you would approach consolidating the three services. That is usually where this conversation gets useful.",
];

const SHORT: string[] = [
  "Thanks for making the time. Here's the short version, and then I want to hear from you.",
  "We're hiring a Staff Backend Engineer for the Scheduling Platform team at Northstar Health.",
  "Today, availability rules are spread across three services, which makes the model difficult to change safely. Adding a new appointment type requires engineering work, when the goal is for it to be configuration.",
  "That is why the role is open now. The team can ship features but cannot change the availability model safely.",
  "The direction is a scheduling platform other engineering teams build on, starting with one availability model instead of three.",
  "This person sets the technical direction for that consolidation and owns the platform afterward. In the first ninety days, the hiring manager expects them to understand the three services and propose a unified model and a migration path.",
  "The role partners closely with Provider Tools, participates in the team's shared on-call rotation, and is remote within the country. The stack includes Go, Postgres, Kafka, and Kubernetes.",
  "If that lines up with what you enjoy, I'd like to hear how you would approach consolidating the three services.",
];

const TECHNICAL: string[] = [
  "Thanks for making the time. I'll go further into the technical context the team provided, and then I'd like to hear how it connects with the work you've done.",
  "We're hiring a Staff Backend Engineer for the Scheduling Platform team at Northstar Health.",
  "Availability rules currently live across three services, which makes the model difficult to change safely. Adding a new appointment type also requires engineering work today. The direction is to consolidate that into a unified availability model and make new appointment types configurable.",
  "That direction is also why the role is open now. The team can ship features, but it cannot change the availability model safely, and most of what comes next depends on that changing.",
  "The first ninety days are focused on understanding the three services and proposing a unified model and migration path. The person joining will set the technical direction for that work and continue owning the platform after the initial design.",
  "The hiring manager was specific about that ownership. She wants someone who has run a platform through its operational years, not only built one.",
  "The stack includes Go, Postgres, Kafka, and Kubernetes. The role participates in the team's shared on-call rotation, so the scope includes both technical direction and ongoing platform ownership.",
  "The role partners closely with Provider Tools, the team that builds what providers use day to day, and the position is remote within the country.",
  "From there I'd like to turn it around, if you're open to it. I'd like to hear about a time you inherited domain behavior spread across multiple services. How did you decide what belonged in the shared model?",
  "When you've led a migration like that, how did you sequence the work while keeping the existing platform reliable?",
  "And what did ownership look like after the initial architecture and migration work were complete? Staying with the platform after the design lands is the part the hiring manager kept coming back to.",
  "If that sounds like your kind of problem, I'd like to hear how you would approach consolidating the three services.",
];

const CONVERSATIONAL: string[] = [
  "Thanks for making the time. I'll give you the picture, and then I want to hear from you.",
  "So we're hiring a Staff Backend Engineer for the Scheduling Platform team here at Northstar Health. Scheduling is the part where someone books time with a provider and then changes it later.",
  "Here's where it stands today. The rules about availability are spread across three services, which makes the model hard to change safely. And adding a new appointment type still takes engineering work, when the whole idea is for that to be configuration.",
  "That's really why the role is open now. The team can ship features, they just can't change the availability model safely, and a lot of what comes next is sitting behind that.",
  "Where they want to get to is a platform other engineering teams build on. One model for availability instead of three, and a new appointment type that gets configured rather than built. The reason that matters is pretty practical. Right now a new appointment type is a project. The goal is that it becomes a setting.",
  "So this person sets the technical direction for that consolidation, and then owns the platform after the design is done. The hiring manager was clear about that second part. She wants somebody who has run a platform through its operational years, not only built one.",
  "The first ninety days are about understanding those three services, then proposing one model and a migration path. The person joining gets meaningful ownership of both the direction and how the team gets there. And it's a proposal, not a rewrite. She wants to see the thinking before the work starts.",
  "The interesting part of this one is the judgment more than the code. Three services hold the rules today, and somebody has to decide what a single model should look like and how you get there from here.",
  "You'd partner closely with Provider Tools, the team building what providers use day to day.",
  "Two things I want in front of you early rather than late: on call is shared across the team, and the role is remote within the country.",
  "The stack includes Go, Postgres, Kafka, and Kubernetes.",
  "What we're looking for is someone who has done this at staff level. Set the direction, then stay with it while it runs. That last part, staying with it, is the bit she cared most about. If that sounds like your kind of thing, I'd love to hear how you'd approach consolidating the three services.",
];

export const talkFixtures: Record<TalkVariant, TalkFixture> = {
  base: { label: "Default", note: "Recruiter-screen length, spoken pace", paragraphs: BASE },
  short: { label: "Shorten", note: "Trimmed for a compressed screen", paragraphs: SHORT },
  technical: {
    label: "Add technical depth",
    note: "Adds depth using only the supplied technical context",
    paragraphs: TECHNICAL,
  },
  conversational: {
    label: "More conversational",
    note: "Looser phrasing, same substance",
    paragraphs: CONVERSATIONAL,
  },
};

/** Spoken-word pace used for the estimated speaking time. */
export const WORDS_PER_MINUTE = 140;

export function wordCount(paragraphs: string[]) {
  return paragraphs.reduce((n, p) => n + p.trim().split(/\s+/).length, 0);
}

export function speakingTime(paragraphs: string[]) {
  const minutes = wordCount(paragraphs) / WORDS_PER_MINUTE;
  const whole = Math.floor(minutes);
  const seconds = Math.round((minutes - whole) * 60);
  return `${whole}:${String(seconds).padStart(2, "0")}`;
}
