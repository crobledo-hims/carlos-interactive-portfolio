import { memo, useState } from "react";
import { ScrollArea } from "../ScrollArea";
import { rexChannels, rexWorkspace } from "../data/rex";
import type { RexMessage } from "../data/rex";

/** Renders *bold* spans without pulling in a markdown dependency. */
function RichText({ text }: { text: string }) {
  const parts = text.split("*");
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i}>{part}</strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function Message({ m }: { m: RexMessage }) {
  return (
    <div className="rex-msg">
      <div className="rex-avatar" style={{ background: m.color }}>
        {m.initials}
      </div>
      <div className="rex-msg-main">
        <div className="rex-msg-head">
          <span className="rex-author">{m.author}</span>
          {m.bot && <span className="rex-badge">APP</span>}
          <span className="rex-time">{m.time}</span>
        </div>
        {m.text && (
          <p className="rex-text">
            <RichText text={m.text} />
          </p>
        )}
        {m.attachment && (
          <div className="rex-attach" style={{ borderLeftColor: m.attachment.accent }}>
            <div className="rex-attach-title">{m.attachment.title}</div>
            <div className="rex-fields">
              {m.attachment.fields.map((f) => (
                <div className="rex-field" key={f.label}>
                  <div className="rex-field-label">{f.label}</div>
                  <div className="rex-field-value">{f.value}</div>
                </div>
              ))}
            </div>
            {m.attachment.context && <div className="rex-context">{m.attachment.context}</div>}
            {m.attachment.actions && (
              <div className="rex-actions">
                {m.attachment.actions.map((a) => (
                  <span className="rex-action" key={a}>
                    {a}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
        {m.reactions && (
          <div className="rex-reactions">
            {m.reactions.map((r) => (
              <span className="rex-reaction" key={r.emoji}>
                {r.emoji} <b>{r.count}</b>
              </span>
            ))}
          </div>
        )}
        {m.thread && <div className="rex-thread">{m.thread}</div>}
      </div>
    </div>
  );
}

function RexAppImpl() {
  const [activeId, setActiveId] = useState(rexChannels[0].id);
  const active = rexChannels.find((c) => c.id === activeId) ?? rexChannels[0];
  const channels = rexChannels.filter((c) => c.kind === "channel");
  const dms = rexChannels.filter((c) => c.kind === "dm");

  return (
    <div className="rex">
      <div className="rex-rail">
        <div className="rex-workspace">
          <div className="rex-ws-tile">{rexWorkspace.initials}</div>
          <div>
            <div className="rex-ws-name">{rexWorkspace.name}</div>
            <div className="rex-ws-sub">{rexWorkspace.tagline}</div>
          </div>
        </div>
        <ScrollArea className="rex-channels">
          <div className="rex-group">Channels</div>
          {channels.map((c) => (
            <button
              key={c.id}
              className={`rex-chan${c.id === activeId ? " active" : ""}`}
              onClick={() => setActiveId(c.id)}
            >
              <span className="rex-hash">#</span>
              <span className="rex-chan-name">{c.name}</span>
              {c.unread > 0 && <span className="rex-unread">{c.unread}</span>}
            </button>
          ))}
          <div className="rex-group">Direct messages</div>
          {dms.map((c) => (
            <button
              key={c.id}
              className={`rex-chan${c.id === activeId ? " active" : ""}`}
              onClick={() => setActiveId(c.id)}
            >
              <span className="rex-dot" />
              <span className="rex-chan-name">{c.name}</span>
              <span className="rex-badge sm">APP</span>
            </button>
          ))}
        </ScrollArea>
      </div>

      <div className="rex-main">
        <div className="rex-topbar">
          <div className="rex-topbar-title">
            {active.kind === "channel" ? `# ${active.name}` : active.name}
          </div>
          <div className="rex-topbar-topic">{active.topic}</div>
        </div>
        <ScrollArea className="rex-stream">
          <div className="rex-divider">
            <span>Today</span>
          </div>
          {active.messages.map((m) => (
            <Message key={m.id} m={m} />
          ))}
        </ScrollArea>
        <div className="rex-composer">
          <div className="rex-composer-box">
            <span className="rex-composer-placeholder">
              Message {active.kind === "channel" ? `#${active.name}` : active.name}
            </span>
            <span className="rex-send">➤</span>
          </div>
          <div className="rex-composer-note">
            Read-only demo · Rex posts alerts and drafts follow-ups, recruiters approve them
          </div>
        </div>
      </div>
    </div>
  );
}

export const RexApp = memo(RexAppImpl);
