import { memo, useState } from "react";
import { keepWheelIfScrollable } from "../ScrollArea";
import { resumeMeta } from "../data/resume";

const DEFAULT_SUBJECT = "Hello from your portfolio";

function MailAppImpl() {
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [body, setBody] = useState("");

  const href = `mailto:${resumeMeta.email}?subject=${encodeURIComponent(
    subject || DEFAULT_SUBJECT,
  )}&body=${encodeURIComponent(body)}`;

  return (
    <div className="mail">
      <div className="mail-toolbar">
        <span className="mail-toolbar-title">New Message</span>
        <span className="mail-toolbar-hint">Opens in your own mail app</span>
      </div>

      <div className="mail-fields">
        <label className="mail-row">
          <span className="mail-label">To</span>
          <span className="mail-chip">{resumeMeta.email}</span>
        </label>
        <label className="mail-row">
          <span className="mail-label">Subject</span>
          <input
            className="mail-input"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
          />
        </label>
      </div>

      <textarea
        className="mail-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onWheel={keepWheelIfScrollable}
        placeholder={"Hi Carlos,\n\n"}
      />

      <div className="mail-foot">
        <div className="mail-links">
          <a href={resumeMeta.linkedinUrl} target="_blank" rel="noopener noreferrer">
            {resumeMeta.linkedinLabel}
          </a>
        </div>
        <a className="mail-send" href={href}>
          Send ➤
        </a>
      </div>
    </div>
  );
}

export const MailApp = memo(MailAppImpl);
