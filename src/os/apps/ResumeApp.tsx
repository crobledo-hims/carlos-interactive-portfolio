import { memo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ScrollArea } from "../ScrollArea";
import { resumeEducation, resumeMeta, resumeRoles, resumeSummary } from "../data/resume";

const ZOOMS = [0.85, 1, 1.15, 1.35];

function ResumeAppImpl() {
  const [zoomIdx, setZoomIdx] = useState(1);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const marks = useRef<Record<string, HTMLElement | null>>({});

  const goto = (key: string) => {
    const sc = scrollerRef.current;
    const el = marks.current[key];
    if (!sc || !el) return;
    sc.scrollTo({ top: Math.max(el.offsetTop - 28, 0), behavior: "smooth" });
  };

  const outline = [
    { key: "summary", label: "Summary" },
    ...resumeRoles.map((r) => ({ key: r.company, label: r.company })),
    { key: "education", label: "Education" },
  ];

  return (
    <div className="resume">
      <div className="resume-toolbar">
        <div className="resume-file">
          <span className="resume-file-icon">📄</span>
          Carlos_Robledo_Resume.pdf
        </div>
        <div className="resume-zoom">
          <button onClick={() => setZoomIdx(Math.max(0, zoomIdx - 1))} disabled={zoomIdx === 0}>
            −
          </button>
          <span>{Math.round(ZOOMS[zoomIdx] * 100)}%</span>
          <button
            onClick={() => setZoomIdx(Math.min(ZOOMS.length - 1, zoomIdx + 1))}
            disabled={zoomIdx === ZOOMS.length - 1}
          >
            +
          </button>
        </div>
        <a className="resume-open" href={resumeMeta.fullPage} target="_blank" rel="noopener noreferrer">
          Open full page ↗
        </a>
      </div>

      <div className="resume-split">
        <div className="resume-outline">
          <div className="resume-outline-head">Outline</div>
          {outline.map((o) => (
            <button key={o.key} onClick={() => goto(o.key)}>
              {o.label}
            </button>
          ))}
        </div>

        <ScrollArea className="resume-doc" innerRef={scrollerRef}>
          <article className="resume-paper" style={{ "--rz": ZOOMS[zoomIdx] } as CSSProperties}>
            <header className="resume-head">
              <h1>{resumeMeta.name}</h1>
              <p className="resume-subtitle">{resumeMeta.title}</p>
              <p className="resume-contact">
                <a href={`mailto:${resumeMeta.email}`}>{resumeMeta.email}</a>
                <span>|</span>
                <a href={resumeMeta.linkedinUrl} target="_blank" rel="noopener noreferrer">
                  {resumeMeta.linkedinLabel}
                </a>
              </p>
            </header>

            <h2
              ref={(el) => {
                marks.current.summary = el;
              }}
            >
              Summary
            </h2>
            <p className="resume-para">{resumeSummary}</p>

            <h2>Professional Experience</h2>
            {resumeRoles.map((role) => (
              <section
                className="resume-role"
                key={role.company}
                ref={(el) => {
                  marks.current[role.company] = el;
                }}
              >
                <div className="resume-role-head">
                  <h3>{role.company}</h3>
                  <span className="resume-dates">{role.dates}</span>
                </div>
                <p className="resume-role-title">{role.title}</p>
                <ul>
                  {role.bullets.map((b) => (
                    <li key={b.lead}>
                      <strong>{b.lead}</strong>
                      {b.rest}
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            <h2
              ref={(el) => {
                marks.current.education = el;
              }}
            >
              Education
            </h2>
            <p className="resume-para">
              <strong>{resumeEducation.school}</strong>
              <br />
              {resumeEducation.degree}
            </p>
          </article>
        </ScrollArea>
      </div>
    </div>
  );
}

export const ResumeApp = memo(ResumeAppImpl);
