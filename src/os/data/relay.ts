// Relay — synthetic demonstration fixtures.
//
// Every candidate, company, hiring manager, team, role and note below is
// invented for this portfolio. Nothing here is drawn from a real employer, a
// real requisition or a real person, and nothing is transmitted anywhere: each
// workflow renders a pre-authored local fixture.
//
// The demos show the *shape* of three prompt-driven workflows Carlos built —
// what the inputs are, what rules constrain the output, and what the output
// looks like. The underlying instruction sets are not reproduced here.

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
   1. Slack Brief — executive-ready candidate summary, pasted by hand
   ========================================================================== */

export const briefCandidate = {
  name: "Nia Whitfield",
  headline: "Senior Software Engineer, Billing Experience",
  company: "Cobalt Bank",
  role: "Senior Full Stack Engineer, Billing Experience at Northstar Health",
  reference: "nia-whitfield-resume.pdf",
};

export const briefSources: SourceCard[] = [
  {
    id: "intake",
    label: "Intake notes",
    rank: 1,
    note: "Recruiter and candidate conversations",
    lines: [
      "Owns the billing experience surface end to end, not just the UI layer.",
      "Rebuilt the invoice and payment-method flows after a failed vendor migration.",
      "Names reliability as the thing she is proudest of, not the redesign.",
      "Worked with two other engineers on the rebuild; she led the design and the rollout.",
      "Looking for a smaller company where the surface she owns is closer to the customer.",
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
      "Led the invoice and payment-method rebuild; cut billing support tickets by a third.",
      "Introduced contract tests between the billing service and three client apps.",
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
];

export const briefOutput = {
  bullets: [
    "Senior engineer owning the billing experience surface end to end at a mid-size bank, including the service layer behind it rather than the interface alone.",
    "Led the design and rollout of the invoice and payment-method rebuild after a vendor migration failed, working with two other engineers.",
    "Billing support tickets fell by roughly a third following the rebuild.",
    "Introduced contract tests between the billing service and three client applications, which is what she points to when asked about reliability.",
    "Seven years at the same company, promoted from payments integrations into the billing surface she now owns.",
    "Motivated by a smaller company where the surface she owns sits closer to the customer.",
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
      "Availability rules are spread across three services; consolidating them is the job.",
      "Wants someone who has run a platform, not only built one.",
      "Partner team: the tools providers use day to day.",
    ],
  },
  {
    id: "roadmap",
    label: "Roadmap context",
    rank: 2,
    note: "Direction, generalized",
    lines: [
      "Scheduling becomes a platform other teams build on.",
      "Appointment types should become configuration, not projects.",
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
    note: "Optional colour",
    lines: ["Dana is direct, allergic to hype, and answers architecture questions directly."],
  },
];

export const outreachGuardrails = [
  "No em dashes",
  "No buzzwords",
  "No confidential roadmap details",
  "Candidate-facing language, never a job description",
  "No repeated angle across touches",
  "Intake notes have the highest authority",
];

const senior: Record<OutreachFormat, OutreachMessage[]> = {
  default: [
    {
      id: "s-initial",
      label: "Initial outreach",
      timing: "Day 0, role paragraph",
      paragraphs: [
        "I'm reaching out today with a strong interest in your experience for the Senior Backend Engineer opening on our Scheduling Platform team.",
        "Scheduling is how people book time with a provider and change it when life gets in the way, so the services behind it carry real volume every day. You would own the core scheduling services, including the availability rules that currently live in three different places. The first year is largely about consolidating that into something the rest of engineering can build on, and then keeping it reliable while it grows.",
        "If you're open to a quick chat, I'm happy to share my scheduling link.",
      ],
    },
    {
      id: "s-f1",
      label: "Follow-up 1",
      timing: "3 days later",
      paragraphs: [
        "I know how busy things get, so I wanted to float this back to the top of your inbox.",
        "To add a bit more color: this team is small enough that the person who designs the availability model is also the person who runs it. That is unusual at this size, and it tends to appeal to engineers who like owning the consequences of their own decisions.",
        "If you're available for a short conversation, my scheduling link is open.",
      ],
    },
    {
      id: "s-f2",
      label: "Follow-up 2",
      timing: "5 days after follow-up 1",
      paragraphs: [
        "I don't want to flood your inbox, so this will be my last note for now.",
        "We are moving quickly on this one. If you aren't looking at the moment, no problem at all, and I'd still like to stay connected for later.",
        "If you are curious what it looks like to rebuild a scheduling platform while it stays online, my scheduling link is there whenever you want it.",
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
        "We're hiring a Senior Backend Engineer for our Scheduling Platform team. The work is consolidating availability rules that live across three services into one platform other teams can build on, and then running it. Go, Postgres, Kafka.",
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
        "Hi Jordan, I'm Dana, Director of Engineering at Northstar Health.",
        "I lead the team that owns scheduling. Your work on booking and availability systems is close to the problem we're solving right now, which is why I wanted to reach out myself rather than have someone do it for me.",
        "If you have twenty minutes, I'd rather answer your questions directly than send you a job description.",
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
        "I'm reaching out today with a strong interest in your experience for the Staff Backend Engineer opening on our Scheduling Platform team.",
        "This is the senior technical seat on a team that runs a scheduling surface people depend on every day. You would set the direction for how the platform gets decomposed, starting with an availability model that is currently spread across three services, and you would carry that direction across the teams that depend on it. The team has the product knowledge already. What it does not have is someone whose job is the shape of the system itself.",
        "If you're open to a quick chat, I'm happy to share my scheduling link.",
      ],
    },
    {
      id: "st-f1",
      label: "Follow-up 1",
      timing: "3 days later",
      paragraphs: [
        "I know how busy things get, so I wanted to float this back to the top of your inbox.",
        "One thing I left out of my first note: the hiring manager answers architecture questions directly instead of routing them, and she is unusually direct about what is working and what is not. If you have been somewhere that technical direction gets diluted on its way up, that contrast tends to matter.",
        "If you're available for a short conversation, my scheduling link is open.",
      ],
    },
    {
      id: "st-f2",
      label: "Follow-up 2",
      timing: "5 days after follow-up 1",
      paragraphs: [
        "I don't want to flood your inbox, so this will be my last note for now.",
        "We are moving quickly to bring on a staff engineer here. If the timing is wrong, that's completely fine, and I'd like to stay in touch either way.",
        "If you'd rather hear the technical picture before deciding, my scheduling link is open and I'm happy to keep it informal.",
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
        "We're hiring a Staff Backend Engineer to set the technical direction for our scheduling platform. Concretely: one availability model instead of three, clear rules for how appointments are created and changed, and events other teams can subscribe to.",
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
        "Hi Jordan, I'm Dana, Director of Engineering at Northstar Health.",
        "I own scheduling here, and I'm hiring the staff engineer who will decide how this platform is put together for the next few years. I read your work on distributed booking systems and wanted to write to you myself.",
        "I'd rather have a real technical conversation than a screening call. If you're open to that, I'll make the time.",
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
        "I'm reaching out today with a strong interest in your experience for the Principal Engineer opening attached to our Scheduling Platform team.",
        "This is the most senior technical role on the platform, and the scope is deliberately larger than one team. You would define how scheduling is decomposed, where its boundaries sit against the systems around it, and what other teams are allowed to depend on. Much of the value in the first year is unwinding decisions that were reasonable when the company was smaller and are now in the way.",
        "If you're open to a quick chat, I'm happy to share my scheduling link.",
      ],
    },
    {
      id: "p-f1",
      label: "Follow-up 1",
      timing: "3 days later",
      paragraphs: [
        "I know how busy things get, so I wanted to float this back to the top of your inbox.",
        "A different angle on this one: the scope is not only scheduling. It is deciding what scheduling should stop owning, which is the part of platform work that usually needs the most seniority to do well.",
        "If you're available for a short conversation, my scheduling link is open.",
      ],
    },
    {
      id: "p-f2",
      label: "Follow-up 2",
      timing: "5 days after follow-up 1",
      paragraphs: [
        "I don't want to flood your inbox, so this will be my last note for now.",
        "Roles at this level are rare enough that I'd rather stay connected than let this be the end of it, whatever your timing looks like.",
        "If you'd like to hear where the architecture stands today before anything formal, my scheduling link is open.",
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
        "We're opening a Principal Engineer role over our scheduling platform. The mandate is the architecture across teams: what scheduling owns, what it stops owning, and what other systems get to depend on.",
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
        "Hi Jordan, I'm Dana, Director of Engineering at Northstar Health.",
        "I'm hiring a principal engineer to set architectural direction across scheduling and the systems that lean on it. I've spent a year working around decisions I'd like someone with your background to reconsider from first principles.",
        "If you're open to a conversation about what that actually looks like here, I'll find the time this week.",
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
  senior: "Ownership of mission-critical components and scaling the systems behind them.",
  staff: "Technical leadership, architecture direction, and influence across teams.",
  principal: "The most senior technical seat: platform vision and cross-team boundaries.",
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
      "Availability rules live in three services; consolidating them is the work.",
      "Wants someone who has run a platform through its operational years.",
      "Partner team: the tools providers use day to day.",
    ],
  },
  {
    id: "roadmap",
    label: "Roadmap context",
    rank: 2,
    note: "Direction, generalized",
    lines: ["A scheduling platform other teams build on.", "New appointment types become configuration."],
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
  "Missing critical context triggers clarification",
  "Confidential details are generalized",
  "No invented scope, partners, KPIs or technology",
  "Output is written to be read aloud",
];

/** Gaps the workflow surfaces instead of guessing. */
export const talkClarifications = [
  "Why now: what changed that makes this seat urgent this quarter, rather than last one.",
  "Day-to-day scope: what the first ninety days actually look like beyond the title.",
  "Hard constraints: whether the on-call rotation and location expectations are firm.",
];

/** What Carlos comes back with after asking the hiring manager. */
export const talkOverrides = [
  "Why now: the team can ship features but cannot change the availability model safely.",
  "First ninety days: read the three services, then propose one model and a migration path.",
  "Constraints: on call is shared across the team, and the role is remote within the country.",
];

export interface TalkFixture {
  label: string;
  note: string;
  paragraphs: string[];
}

const BASE: string[] = [
  "Thanks for making the time today. Let me give you the picture of the team and the role, and then I want to hear how it lands for you.",
  "I am hiring a Staff Backend Engineer for the Scheduling Platform team at Northstar Health. Scheduling is how someone books time with a provider, moves it when life gets in the way, and gets where they need to be without having to call anyone. It sits right between the customer experience and everything that has to happen behind it.",
  "Right now the platform works, and it carries real volume every day. It was also built quickly, by a small team, under pressure. Availability rules live in three different services. Adding a new appointment type takes longer than it should. When something goes wrong at the edges, it takes a person to untangle it. None of that is a crisis. It is the honest state of a system that grew faster than its foundations.",
  "Where the team is heading is a scheduling platform other teams can build on without asking permission. One place that understands availability. Clear rules for how appointments get created, changed and released. Events other systems can subscribe to instead of polling. The goal is that a new appointment type becomes a configuration change rather than a project.",
  "That is why this role exists now. The team can ship features, but it cannot change the availability model safely, and that is the thing holding everything else back. The team has the product knowledge and the day to day ownership. What it does not have is someone whose job is the shape of the system itself.",
  "Day to day, you would own the core scheduling services end to end. Design, build, run, and the reliability that comes with running them. You would work through the availability model, which is the hardest part of this domain and the part everything else depends on. In the first ninety days the ask is to read the three services, then come back with one model and a migration path. You would also be on call inside the team rotation, alongside everyone else.",
  "The work is genuinely distributed. An appointment touches several systems and none of them can be the single source of truth on their own. So you would be thinking about consistency, retries, idempotency, and what happens when one part of the chain is slow or unavailable. If those problems sound tedious, this is not the right role for you. If they sound like the interesting part, we should keep talking.",
  "The team is small enough that your work is visible and large enough that you are not alone. You would partner closely with the team that builds the tools providers use every day, because their workflows depend on whatever you decide. I am not going to pretend there is a tidy roadmap waiting for you. There are strong opinions, real constraints, and a lot of room to shape the plan.",
  "What I am looking for is someone who has done this at staff level before. Someone who has owned a platform through design, launch, and the unglamorous operational years that follow. Someone who can hold a technical direction across teams without needing authority to do it.",
  "The role is remote within the country, and the on-call rotation is shared across the team, so I want to be upfront about both.",
  "If that scope lines up with what you enjoy, I would love to hear how you would approach the availability model. That is usually where this conversation gets interesting.",
];

const SHORT: string[] = [
  "Thanks for making the time. Let me give you the short version of the team and the role, and then I want to hear from you.",
  "I am hiring a Staff Backend Engineer for the Scheduling Platform team at Northstar Health. Scheduling is how someone books time with a provider and moves it when life gets in the way.",
  "The platform works and carries real volume, but it was built quickly under pressure. Availability rules live in three different services, so adding a new appointment type takes longer than it should.",
  "Where the team is heading is one platform other teams can build on. One model for availability, clear rules for how appointments change, and events other systems can subscribe to.",
  "That is why this seat exists now. The team can ship features but cannot change the availability model safely. What it is missing is someone whose job is the shape of the system.",
  "You would own the core scheduling services end to end, design through operation, starting with one model and a migration path in the first ninety days. On call is shared across the team, and the role is remote within the country.",
  "If that sounds like the interesting part of the job rather than the tedious part, I would love to hear how you would approach the availability model.",
];

const TECHNICAL: string[] = [
  "Thanks for making the time today. I will go a little deeper on the technical picture than I usually would, and then I want to hear how it lands for you.",
  "I am hiring a Staff Backend Engineer for the Scheduling Platform team at Northstar Health. Scheduling is how someone books time with a provider and changes it later. The services are Go, the stores are Postgres, and the events move over Kafka. It all runs on Kubernetes.",
  "The honest state today is three services that each hold part of the availability picture. They disagree at the edges. Reconciling them is manual more often than anyone would like, and adding a new appointment type means touching all three.",
  "The direction is one availability model with a single owner, clear lifecycle rules for how an appointment is created, changed and released, and an event stream other teams consume instead of polling us. When that lands, a new appointment type becomes configuration rather than a project.",
  "That is why this role exists now. The team can ship features, but it cannot change the availability model safely, and every other plan sits behind that.",
  "Day to day, you would own those services end to end. In the first ninety days the ask is to read all three, then propose one model and a migration path that does not require a flag day. After that it is design, build, run, and the reliability work that comes with running it. On call is shared across the team.",
  "The interesting problems here are consistency problems. An appointment touches several systems and none of them can be the source of truth alone, so you are reasoning about idempotency, retries, ordering, and what the system does when one hop is slow rather than down. Getting that wrong is visible to a real person waiting on a confirmation.",
  "The event stream matters as much as the model. Today other teams poll us, which means they are always slightly wrong and we absorb the load. Publishing a clean lifecycle event for an appointment, and getting the semantics right so consumers can be idempotent about it, removes a whole class of support problem. It also means the next team that needs scheduling data does not need us in the room.",
  "Some of what you would decide early: whether the availability model lives behind one service or in a library each service embeds, how you migrate without a flag day, and what the read path looks like while both models are alive at once. I do not have those answers and neither does the team. That is the point of the role.",
  "The operational side is real too. On call sits inside the team rotation, so the design decisions you make are ones you carry at two in the morning. In my experience that changes how people design, usually for the better.",
  "You would partner closely with the team that builds the tools providers use, because their workflows depend on your lifecycle rules. There are strong opinions here and real constraints, and a lot of room to shape the plan.",
  "What I am looking for is someone who has owned a platform at staff level through design, launch and the operational years after. The role is remote within the country.",
  "If that sounds like your kind of problem, I would love to hear how you would approach the availability model, because that is the decision everything else follows from.",
];

const CONVERSATIONAL: string[] = [
  "Thanks for making the time. I will give you the picture of the team and the role, and then I would rather hear from you than keep talking.",
  "So, I am hiring a Staff Backend Engineer for our Scheduling Platform team at Northstar Health. Scheduling is the part where someone books time with a provider, and then moves it, because life happens. It sits right between the customer and everything behind the curtain.",
  "Here is the honest version of where it is today. It works, and it carries real volume. It was also built fast by a small team, so the rules about availability ended up in three different places. Adding a new appointment type is more work than it should be, and when something breaks at the edges a person has to go untangle it. Nothing is on fire. It just grew faster than its foundations.",
  "Where we want to get to is a platform other teams can build on without asking us first. One place that knows about availability. Clear rules for creating and changing appointments. Events other systems can listen to instead of asking us over and over.",
  "That is really why this seat is open now. The team can ship features, but they cannot safely change the availability model, and that is what everything else is waiting on. They know the product cold. What they are missing is someone who owns the shape of the system.",
  "Day to day you would own those services end to end, and the first ninety days are about reading the three of them and coming back with one model and a way to get there. You would be on call with everyone else, and the role is remote within the country.",
  "The problems are distributed-systems problems, honestly. Consistency, retries, idempotency, what happens when one piece is slow instead of down. Some people find that tedious. If you find it interesting, we should keep talking.",
  "You would work closely with the team building the tools providers use, since their day depends on the rules you set. And I will be straight with you, there is no tidy roadmap waiting. There are opinions, constraints, and a lot of room to shape it.",
  "The team is small enough that what you do is visible, and big enough that you are not carrying it alone. You would be on call with everybody else, which I mention because it does shape how you end up designing things.",
  "What I am really looking for is somebody who has done this at staff level already. Someone who built a platform, launched it, and then lived with it for a few years afterward. That last part is the part people skip, and it is the part I care about most.",
  "If that sounds like your kind of thing, I would love to hear how you would go after the availability model. That is usually where this conversation gets good.",
];

export const talkFixtures: Record<TalkVariant, TalkFixture> = {
  base: { label: "Default", note: "Recruiter-screen length, spoken pace", paragraphs: BASE },
  short: { label: "Shorten", note: "Trimmed for a compressed screen", paragraphs: SHORT },
  technical: { label: "Add technical depth", note: "For engineers who want the system picture", paragraphs: TECHNICAL },
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
