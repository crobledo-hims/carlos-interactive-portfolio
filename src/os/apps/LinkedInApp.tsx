import { memo } from "react";
import type { CSSProperties } from "react";
import { ScrollArea } from "../ScrollArea";
import { LockGlyph } from "../icons";
import {
  linkedinAbout,
  linkedinEducation,
  linkedinExperience,
  linkedinImages,
  linkedinLanguages,
  linkedinNote,
  linkedinProfile,
  linkedinTopSkills,
} from "../data/linkedin";
import type { AppProps } from "../types";

/**
 * A browser window showing Carlos's LinkedIn profile as a stranger sees it.
 *
 * Real LinkedIn refuses to be framed, so the page is rebuilt here rather than
 * embedded, in the OS's own visual language: the layout is evoked, none of the
 * trade dress is copied. Two rules hold the design in place:
 *
 *   - Public visitor view only. No editing affordances, no analytics, no
 *     availability badge. Anything LinkedIn shows the account owner alone, or
 *     shows recruiters alone, is out.
 *   - Every control does something real. The chrome is inert decoration; the
 *     only actions are the external profile link and the two routes into the
 *     Mail app.
 */

/* ----------------------------------------------------------------- pieces */

/** The verification tick beside the name. Named for assistive tech. */
function VerifiedMark() {
  return (
    <span className="li-verified">
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path
          className="li-verified-disc"
          d="M8 .9l1.9 1.5 2.4-.2.6 2.3 2 1.4-1 2.2 1 2.2-2 1.4-.6 2.3-2.4-.2L8 15.3l-1.9-1.5-2.4.2-.6-2.3-2-1.4 1-2.2-1-2.2 2-1.4.6-2.3 2.4.2z"
        />
        <path className="li-verified-tick" d="M5.1 8.2l2 2 3.9-4.3" />
      </svg>
      <span className="li-sr">Verified</span>
    </span>
  );
}

/** A small square standing in for a company or school logo. */
function RailMark({ label }: { label: string }) {
  return (
    <span className="li-rail-mark" aria-hidden="true">
      {label.replace(/[^A-Za-z]/g, "").slice(0, 1) || "·"}
    </span>
  );
}

/**
 * The banner.
 *
 * With no artwork in the repo this is drawn in CSS: a dark field, a wash of
 * matrix green, and a purple bloom, nodding at the real banner without
 * imitating it. Setting `linkedinImages.banner` swaps the whole thing for the
 * real image. Decorative either way, so it never carries alt text.
 */
function Banner() {
  const style = linkedinImages.banner
    ? ({ backgroundImage: `url(${linkedinImages.banner})` } as CSSProperties)
    : undefined;
  return <div className={`li-banner${linkedinImages.banner ? " photo" : ""}`} style={style} aria-hidden="true" />;
}

/** The avatar: a real headshot when one is configured, initials otherwise. */
function Avatar() {
  if (linkedinImages.avatar) {
    return <img className="li-avatar photo" src={linkedinImages.avatar} alt={linkedinProfile.name} />;
  }
  return (
    <span className="li-avatar" aria-hidden="true">
      {linkedinProfile.initials}
    </span>
  );
}

/** The one external link in the whole OS, stated as such in its label. */
function OpenRealProfile({ compact }: { compact?: boolean }) {
  return (
    <a
      className={compact ? "li-open compact" : "li-open"}
      href={linkedinProfile.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open the real LinkedIn profile at ${linkedinProfile.path}, opens in a new tab`}
    >
      Open real profile
      <span aria-hidden="true"> ↗</span>
    </a>
  );
}

/* -------------------------------------------------------------------- app */

function LinkedInAppImpl({ openApp }: AppProps) {
  const message = () => openApp("mail");

  return (
    <div className="li">
      {/* ---------------------------------------------- browser chrome.
          Inert scenery: the tabs and the back / forward / reload controls are
          drawn, not wired, and the address bar is text rather than an input
          that would invite typing. Hidden from assistive tech for the same
          reason. */}
      <div className="li-chrome">
        <div className="li-tabs" aria-hidden="true">
          <div className="li-tab active">
            <span className="li-favicon" />
            <span className="li-tab-title">Carlos Robledo | LinkedIn</span>
            <span className="li-tab-x">×</span>
          </div>
          <span className="li-newtab">+</span>
        </div>
        <div className="li-toolbar">
          <span className="li-nav" aria-hidden="true">
            ‹
          </span>
          <span className="li-nav dim" aria-hidden="true">
            ›
          </span>
          <span className="li-nav" aria-hidden="true">
            ⟳
          </span>
          <div className="li-omnibox" aria-hidden="true">
            <LockGlyph />
            <span>{linkedinProfile.path}</span>
          </div>
          <OpenRealProfile compact />
        </div>
      </div>

      {/* ------------------------------------------------- the profile page */}
      <ScrollArea className="li-page">
        <article className="li-card li-top">
          <Banner />
          <div className="li-top-body">
            <Avatar />

            <div className="li-identity">
              <div className="li-name-row">
                <h2 className="li-name">{linkedinProfile.name}</h2>
                {linkedinProfile.verified && <VerifiedMark />}
              </div>
              <p className="li-headline">{linkedinProfile.headline}</p>
              <p className="li-meta">
                {linkedinProfile.location}
                <span aria-hidden="true"> · </span>
                <button type="button" className="li-link" onClick={message}>
                  Contact info
                </button>
              </p>
              <p className="li-connections">{linkedinProfile.connections}</p>

              <div className="li-actions">
                <OpenRealProfile />
                <button type="button" className="li-btn" onClick={message}>
                  Message
                </button>
              </div>
            </div>

            {/* Current company and school, the way LinkedIn stacks them. */}
            <div className="li-rail">
              <p className="li-rail-row">
                <RailMark label={linkedinProfile.currentCompany} />
                {linkedinProfile.currentCompany}
              </p>
              <p className="li-rail-row">
                <RailMark label={linkedinProfile.school} />
                {linkedinProfile.school}
              </p>
            </div>
          </div>
        </article>

        <section className="li-card" aria-labelledby="li-about">
          <h3 className="li-sec-title" id="li-about">
            About
          </h3>
          {linkedinAbout.map((p) => (
            <p className="li-about-p" key={p.slice(0, 32)}>
              {p}
            </p>
          ))}
        </section>

        <section className="li-card" aria-labelledby="li-experience">
          <h3 className="li-sec-title" id="li-experience">
            Experience
          </h3>
          {linkedinExperience.map((job) => (
            <div className="li-job" key={job.company}>
              <RailMark label={job.company} />
              <div className="li-job-body">
                <h4 className="li-company">{job.company}</h4>
                {job.positions.map((pos) => (
                  <div className={`li-pos${job.positions.length > 1 ? " grouped" : ""}`} key={pos.title}>
                    <p className="li-pos-title">{pos.title}</p>
                    <p className="li-pos-dates">
                      {pos.dates}
                      <span aria-hidden="true"> · </span>
                      {pos.location}
                    </p>
                    {pos.summary && <p className="li-pos-summary">{pos.summary}</p>}
                    <ul className="li-bullets">
                      {pos.bullets.map((b) => (
                        <li key={b.slice(0, 40)}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="li-card" aria-labelledby="li-education">
          <h3 className="li-sec-title" id="li-education">
            Education
          </h3>
          <div className="li-job">
            <RailMark label={linkedinEducation.school} />
            <div className="li-job-body">
              <h4 className="li-company">{linkedinEducation.school}</h4>
              <p className="li-pos-title">{linkedinEducation.degree}</p>
            </div>
          </div>
        </section>

        <section className="li-card" aria-labelledby="li-skills">
          <h3 className="li-sec-title" id="li-skills">
            Top skills
          </h3>
          <ul className="li-chips">
            {linkedinTopSkills.map((s) => (
              <li className="li-chip" key={s}>
                {s}
              </li>
            ))}
          </ul>
        </section>

        <section className="li-card" aria-labelledby="li-languages">
          <h3 className="li-sec-title" id="li-languages">
            Languages
          </h3>
          <dl className="li-langs">
            {linkedinLanguages.map((l) => (
              <div key={l.name}>
                <dt>{l.name}</dt>
                <dd>{l.level}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p className="li-note">{linkedinNote}</p>
      </ScrollArea>
    </div>
  );
}

export const LinkedInApp = memo(LinkedInAppImpl);
