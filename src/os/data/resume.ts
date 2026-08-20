// Resume content, mirrored verbatim from /resume.html (the single source of
// truth for the wording). Each bullet is split into a bold lead-in and the
// remainder of the sentence, matching the <strong> markup in resume.html.
// Contact details are email + LinkedIn only, by design.

export interface ResumeBullet {
  lead: string;
  rest: string;
}

export interface ResumeRole {
  company: string;
  dates: string;
  title: string;
  bullets: ResumeBullet[];
}

export const resumeMeta = {
  name: "Carlos Robledo",
  title: "Technical Sourcing Lead",
  email: "thecarlosrobledo@gmail.com",
  linkedinLabel: "linkedin.com/in/thecarlosrobledo",
  linkedinUrl: "https://linkedin.com/in/thecarlosrobledo",
  fullPage: "/resume.html",
};

export const resumeSummary =
  "Technical Sourcing Lead with 10+ years of experience solving complex technical hiring challenges across SWE and Engineering Leadership. Specializes in Staff+ Engineering, Applied AI, and high-priority org-building initiatives, partnering closely with engineering and executive leadership. Operates at the intersection of recruiting, software, and AI, building tools, automation, and systems that turn recruiting expertise into scalable workflows and improve how teams evaluate, engage, and hire technical talent.";

export const resumeRoles: ResumeRole[] = [
  {
    company: "Hims & Hers",
    dates: "May 2024 – Present",
    title: "Technical Sourcing Lead",
    bullets: [
      {
        lead: "Selected for the company's most critical, high-visibility hiring initiatives",
        rest: ", spanning new technical org creation, Staff+ Engineering, executive hiring, and strategic technology transformations.",
      },
      {
        lead: "Led sourcing strategy for a Sr. Staff and Principal Engineering campaign",
        rest: ", partnering with the SVP of Engineering on candidate calibration, market evaluation, and targeted engagement for top-of-market technical talent.",
      },
      {
        lead: "Built foundational engineering teams across Applied AI and native iOS",
        rest: ", helping establish the company's first Applied AI Engineering organization and supporting the transition of the Hims & Hers apps from React Native to native iOS development.",
      },
      {
        lead: "Designed and built Rex",
        rest: ", an automated recruiting operations platform connecting Ashby, Slack, Airtable, and AI to handle pipeline reporting, candidate follow-up, and real-time hiring alerts, eliminating repetitive administrative work and returning an estimated 1–2 hours per recruiter each week.",
      },
      {
        lead: "Developed Pulse",
        rest: ", a recruiting intelligence platform that converts live hiring data into rules-based Red, Yellow, and Green pipeline health scores and hiring forecasts, giving recruiters and leadership a consistent, auditable way to identify risk, prioritize action, and connect recruiting progress to headcount planning.",
      },
      {
        lead: "Built Gauge",
        rest: ", an AI-assisted Chrome extension for LinkedIn Recruiter that evaluates candidate profiles against locked role criteria and surfaces structured recommendations, using a human-in-the-loop model that keeps final hiring decisions with the recruiter.",
      },
      {
        lead: "Designed and deployed AI-enabled recruiting workflows",
        rest: " across candidate outreach, recruiter screen preparation, and candidate evaluation, embedding role-specific guidance and evaluation standards to improve consistency, accuracy, and recruiter effectiveness.",
      },
    ],
  },
  {
    company: "Databricks",
    dates: "March 2022 – March 2024",
    title: "Sr. Staff Technical Sourcer",
    bullets: [
      {
        lead: "Exceeded 2023 hiring goals by 50%",
        rest: ", extending 42 offers against a target of 28 with consistent performance across all four quarters.",
      },
      {
        lead: "Built and delivered pipelines across SWE and Engineering Leadership",
        rest: ", spanning ML/GenAI and core engineering domains including backend, infrastructure, database internals, and frontend/full-stack.",
      },
      {
        lead: "Partnered with VPs and the SVP of Engineering on hiring strategy",
        rest: ", presenting quarterly performance, talent-market insights, and recommendations to improve hiring outcomes.",
      },
      {
        lead: "Used Greenhouse, Karat, and CodeSignal data to identify and re-engage high-potential talent",
        rest: ", including previous onsite withdrawals and offer declines, resulting in 10+ hires across Q3–Q4 2023.",
      },
      {
        lead: "Scaled sourcing effectiveness across a team of six sourcers",
        rest: ", through role calibration, workflow optimization, sourcing enablement, and structured working sessions with Engineering Leaders.",
      },
    ],
  },
  {
    company: "Meta (formerly Facebook)",
    dates: "October 2017 – March 2022",
    title:
      "Technical Sourcer — Network & Connectivity SWE Leadership (Feb 2020 – Mar 2022); Network & Infrastructure SWE (Oct 2017 – Feb 2020)",
    bullets: [
      {
        lead: "Consistently exceeded biannual hiring goals",
        rest: ", earning two promotions while supporting complex SWE and Engineering Leadership hiring across network, connectivity, and infrastructure domains.",
      },
      {
        lead: "Partnered with Engineering Managers, Directors, and VPs",
        rest: " to calibrate and deliver against challenging technical hiring needs.",
      },
      {
        lead: "Designed an Advanced Search training adopted into the 2019 Global Learn Roadmap",
        rest: ", training 151 global team members and receiving a 100% recommendation rate from surveyed attendees.",
      },
      {
        lead: "Selected as a mentor for IC skill development and knowledge sharing",
        rest: ", receiving recognition from the Global Head of Recruiting for mentorship impact.",
      },
    ],
  },
  {
    company: "Google (via Nelson Staffing)",
    dates: "February 2016 – October 2017",
    title: "Technical Sourcer",
    bullets: [
      {
        lead: "Ranked in the top 5% of North American SWE Sourcers for four consecutive quarters",
        rest: ", based on offer accepts.",
      },
      {
        lead: "One of four sourcers organization-wide nominated for the Rising Star Award",
        rest: " in Q2 2016.",
      },
      {
        lead: "Chosen for a high-priority 10-person sourcing task force",
        rest: ", focused on identifying software engineering talent during key market opportunities.",
      },
    ],
  },
  {
    company: "Intersys Consulting",
    dates: "November 2013 – February 2016",
    title: "Technical Recruiter",
    bullets: [
      {
        lead: "Top-performing recruiter in 2015",
        rest: ", generating more than $1M in gross profit while helping scale the recruiting team from 3 to 10 recruiters during the company's most profitable year.",
      },
    ],
  },
  {
    company: "Kforce",
    dates: "December 2012 – October 2013",
    title: "Sr. Talent Representative",
    bullets: [
      {
        lead: "Promoted to Sr. Talent Representative within the first year",
        rest: ", after exceeding $100K in gross profit.",
      },
    ],
  },
];

export const resumeEducation = {
  school: "The University of Texas at San Antonio",
  degree: "Bachelor of Business Administration, International Business Management",
};
