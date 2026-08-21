// Carlos's real, public career history, mirrored from his LinkedIn profile
// export and cross-checked against ./resume.ts.
//
// EXEMPTION: unlike every demo app fixture in this folder, this file is not
// synthetic. It is the same class of content as resume.ts, so real employer
// names, real dates and the real profile URL belong here. What must never
// appear is anything confidential or internal: no roadmaps, no company
// metrics, no internal system or tool names, and no phone number.
//
// Editing rules:
//   - resume.ts wins on dates and titles. Where the LinkedIn export disagrees
//     the two apps must still tell the visitor the same story.
//   - Public visitor view only. Nothing here may describe owner-only surfaces
//     (editing affordances, analytics, or recruiter-visible availability).
//   - No durations like "2 years 4 months": they are correct only on the day
//     the profile was exported. Date ranges are stated instead.

/**
 * Real artwork, when there is any.
 *
 * No photography ships with this repo, so both fall back to the generated
 * avatar and the CSS banner. To use the real assets later, drop the files in
 * `public/` and set these to their paths (e.g. "/img/carlos.jpg"); the app
 * swaps to an <img> and a background-image with no other change.
 */
export const linkedinImages: { avatar: string | null; banner: string | null } = {
  avatar: null,
  banner: null,
};

export const linkedinProfile = {
  name: "Carlos Robledo",
  /** Renders the small verification tick beside the name. */
  verified: true,
  headline: "Building Better Recruiting with Software & AI | Ex-Databricks | Ex-Meta | Ex-Google",
  location: "Austin, Texas Metropolitan Area",
  connections: "500+ connections",
  initials: "CR",
  /** Shown in the address bar and as the link label. */
  path: "linkedin.com/in/thecarlosrobledo",
  url: "https://linkedin.com/in/thecarlosrobledo",
  /** The right rail, exactly as LinkedIn stacks it. */
  currentCompany: "Hims & Hers",
  school: "The University of Texas at San Antonio",
};

export const linkedinAbout: string[] = [
  "Technical Sourcing Lead with 10+ years of experience helping engineering organizations identify, engage, and hire exceptional technical talent. My background includes Google, Meta, Databricks, and Hims & Hers, where I've partnered closely with engineering and executive teams on complex, high-priority hiring initiatives.",
  "Today, I operate at the intersection of recruiting, software, and AI. In addition to leading technical sourcing work, I build tools, automation, and AI-enabled workflows that make recruiting teams more efficient, consistent, and effective. That includes everything from automating repetitive recruiting operations to improving pipeline visibility and creating new ways for recruiters to evaluate and engage talent.",
  "I'm most energized by difficult hiring problems, building thoughtful solutions, and finding ways to turn recruiting expertise into systems that create leverage for the broader team. Throughout my career, I've consistently exceeded hiring goals while helping teams improve how they source, assess, and engage technical talent.",
];

export interface LinkedInPosition {
  title: string;
  dates: string;
  location: string;
  /** The paragraph LinkedIn shows above the bullets. Optional. */
  summary?: string;
  bullets: string[];
}

export interface LinkedInJob {
  company: string;
  /** More than one position renders as LinkedIn's grouped company entry. */
  positions: LinkedInPosition[];
}

export const linkedinExperience: LinkedInJob[] = [
  {
    company: "Hims & Hers",
    positions: [
      {
        title: "Technical Sourcing Lead",
        dates: "May 2024 – Present",
        location: "Austin, Texas Metropolitan Area",
        summary:
          "Lead-level technical sourcing IC supporting some of the company's highest-priority engineering hiring initiatives while also building software, automation, and AI-enabled systems for the recruiting organization. Partner closely with engineering and executive leadership on complex hiring challenges, new org creation, and improvements to how the team operates.",
        bullets: [
          "Led sourcing strategy for high-priority engineering initiatives, including Sr. Staff and Principal hiring, executive searches, and strategic technical transformations.",
          "Built foundational engineering teams across Applied AI and native iOS, helping establish the company's first Applied AI Engineering organization and supporting the transition of the Hims & Hers apps from React Native to native iOS.",
          "Designed and built Rex, an automated recruiting operations platform connecting Ashby, Slack, Airtable, and AI to streamline pipeline reporting, candidate follow-up, and real-time hiring alerts, returning an estimated 1–2 hours per recruiter each week.",
          "Developed Pulse, a recruiting intelligence platform that turns live hiring data into rules-based Red, Yellow, and Green pipeline health signals and hiring forecasts, helping recruiters and leadership identify risk, prioritize action, and connect recruiting progress to headcount planning.",
          "Built Gauge, an AI-assisted Chrome extension for LinkedIn Recruiter that evaluates candidate profiles against locked role criteria and surfaces structured recommendations, using a human-in-the-loop model that keeps final decisions with the recruiter.",
          "Designed and deployed AI-enabled recruiting workflows across outreach, recruiter screen preparation, and candidate evaluation to improve consistency, accuracy, and recruiter effectiveness.",
        ],
      },
    ],
  },
  {
    company: "Databricks",
    positions: [
      {
        title: "Sr. Staff Technical Sourcer",
        dates: "March 2022 – March 2024",
        location: "Austin, Texas Metropolitan Area",
        summary:
          "Sr. Staff Technical Sourcing IC supporting SWE and Engineering Leadership hiring across ML/GenAI and core engineering domains. Partnered closely with VPs and the SVP of Engineering on hiring strategy, talent-market insights, and execution while helping scale sourcing effectiveness across the broader team.",
        bullets: [
          "Exceeded 2023 hiring goals by 50%, extending 42 offers against a target of 28 with consistent performance across all four quarters.",
          "Built and delivered pipelines across SWE and Engineering Leadership, spanning ML/GenAI and core engineering domains including backend, infrastructure, database internals, and frontend/full-stack.",
          "Partnered with VPs and the SVP of Engineering on hiring strategy, presenting quarterly performance, talent-market insights, and recommendations to improve hiring outcomes.",
          "Used Greenhouse, Karat, and CodeSignal data to identify and re-engage high-potential talent, including previous onsite withdrawals and offer declines, resulting in 10+ hires across Q3–Q4 2023.",
          "Scaled sourcing effectiveness across a team of six sourcers through role calibration, workflow optimization, sourcing enablement, and structured working sessions with Engineering Leaders.",
        ],
      },
    ],
  },
  {
    company: "Meta",
    positions: [
      {
        title: "Technical Sourcer, Network & Connectivity SWE Leadership",
        dates: "February 2020 – March 2022",
        location: "Austin, Texas Metropolitan Area",
        summary:
          "Supported Engineering Leadership hiring across network infrastructure and connectivity organizations, partnering with technical leaders on Software Engineering Manager and Director searches.",
        bullets: [
          "Led sourcing for Engineering Manager and Director-level hiring across highly technical infrastructure and connectivity organizations.",
          "Partnered closely with Engineering Directors and VPs on role calibration, talent strategy, and candidate engagement for complex leadership searches.",
          "Continued to serve as a resource and mentor to sourcing peers, sharing technical domain knowledge and sourcing practices across the organization.",
        ],
      },
      {
        title: "Technical Sourcer, Network & Infrastructure SWE",
        dates: "October 2017 – February 2020",
        location: "Austin, Texas Metropolitan Area",
        bullets: [
          "Consistently exceeded biannual hiring goals while supporting complex software engineering hiring across network infrastructure and connectivity.",
          "Partnered with recruiters and Engineering Managers, Directors, and VPs to calibrate and deliver against challenging technical hiring needs.",
          "Designed an Advanced Search training adopted into the 2019 Global Learn Roadmap, training 151 recruiters and sourcers globally and receiving a 100% recommendation rate from surveyed attendees.",
          "Selected as a mentor for an organization-wide program focused on IC development, knowledge sharing, and skill-building across the sourcing organization.",
          "Received recognition from the Global Head of Recruiting for mentorship contributions.",
        ],
      },
    ],
  },
  {
    company: "Google (via Nelson Staffing)",
    positions: [
      {
        title: "Technical Sourcer",
        dates: "February 2016 – October 2017",
        location: "Austin, Texas Metropolitan Area",
        bullets: [
          "Ranked in the top 5% of North American SWE Sourcers for four consecutive quarters (Q2 2016–Q1 2017) based on offer accepts.",
          "Selected as one of four sourcers organization-wide for the Rising Star Award in Q2 2016.",
          "Specialized in sourcing Software Engineers across Front End and Mobile (iOS/Android), while also supporting Backend, Infrastructure, SDET, and Machine Learning hiring.",
          "Designated as a Front-End Software Engineering sourcing subject matter expert, training new hires on sourcing and candidate assessment, auditing requisitions, and representing the Front-End team in calibration discussions.",
          "Selected for a high-priority 10-person global sourcing initiative focused on identifying and engaging Software Engineering talent during key market opportunities.",
        ],
      },
    ],
  },
  {
    company: "Intersys Consulting",
    positions: [
      {
        title: "Technical Recruiter",
        dates: "November 2013 – February 2016",
        location: "Austin, TX",
        summary:
          "Recruited technical professionals across contract and direct-hire roles while managing the full recruiting lifecycle.",
        bullets: [
          "Top-performing recruiter in 2015, generating more than $1M in gross profit.",
          "Helped scale the recruiting team from 3 to 10 recruiters through hiring, mentoring, and peer leadership, contributing to the most profitable year in the company's history.",
        ],
      },
    ],
  },
  {
    company: "Kforce",
    positions: [
      {
        title: "Sr. Talent Representative",
        dates: "December 2012 – October 2013",
        location: "Austin, TX",
        summary:
          "Recruited technical professionals across contract and direct-hire roles while managing the full recruiting lifecycle.",
        bullets: [
          "Promoted to Sr. Talent Representative within the first year after generating more than $100K in gross profit.",
          "Averaged more than $5K in weekly gross profit, ranking third among recruiters in the Austin branch.",
        ],
      },
    ],
  },
];

export const linkedinEducation = {
  school: "The University of Texas at San Antonio",
  degree: "Bachelor of Business Administration (B.B.A.), International Business Management",
};

export const linkedinTopSkills: string[] = [
  "Recruitment-to-Recruitment",
  "Technology Recruitment",
  "Technical Leadership",
];

export const linkedinLanguages: { name: string; level: string }[] = [
  { name: "English", level: "Native or Bilingual" },
  { name: "Spanish", level: "Professional Working" },
];

/** The one honest note about what this window is. */
export const linkedinNote =
  "A rendering of Carlos's public LinkedIn profile, rebuilt inside this portfolio. Open the real profile for the live version.";
