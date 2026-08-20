import {
  outreachFixtures,
  outreachFormatNotes,
  outreachGuardrails,
  outreachLevelNotes,
  outreachRole,
  outreachSources,
} from "../../data/relay";
import type { OutreachFormat, OutreachLevel } from "../../data/relay";
import { copyText, useToast } from "./helpers";
import { Guardrails, Segmented, SourceList, Synthetic } from "./parts";

interface Props {
  level: OutreachLevel;
  format: OutreachFormat;
  onLevel: (l: OutreachLevel) => void;
  onFormat: (f: OutreachFormat) => void;
  onReset: () => void;
  announce: (message: string) => void;
}

const LEVELS: { id: OutreachLevel; label: string }[] = [
  { id: "senior", label: "Senior" },
  { id: "staff", label: "Staff" },
  { id: "principal", label: "Principal" },
];

const FORMATS: { id: OutreachFormat; label: string }[] = [
  { id: "default", label: "Default sequence" },
  { id: "linkedin", label: "LinkedIn version" },
  { id: "sobo", label: "SOBO version" },
];

export function OutreachSequence({ level, format, onLevel, onFormat, onReset, announce }: Props) {
  const { toast, show } = useToast();
  const messages = outreachFixtures[level][format];

  const copy = async (label: string, paragraphs: string[]) => {
    const ok = await copyText(paragraphs.join("\n\n"));
    const message = ok ? `${label} copied.` : "Copy was blocked by the browser.";
    show(message);
    announce(message);
  };

  return (
    <div className="relay-panel">
      <header className="relay-panel-head">
        <div>
          <h2 className="relay-h2">Outreach Sequence</h2>
          <p className="relay-sub">
            {outreachRole.title} at {outreachRole.company}. One role-level workflow, reused across a campaign.
          </p>
        </div>
        <Synthetic />
      </header>

      <div className="relay-body">
        <div className="relay-col-inputs">
          <SourceList cards={outreachSources} title="Source inputs" />
          <p className="relay-priority">Intake notes, then roadmap, then job description.</p>
          <Guardrails items={outreachGuardrails} />
        </div>

        <div className="relay-col-output">
          <div className="relay-controls">
            <Segmented label="Level" value={level} options={LEVELS} onChange={onLevel} />
            <Segmented label="Output format" value={format} options={FORMATS} onChange={onFormat} />
            <button type="button" className="relay-btn ghost sm" onClick={onReset}>
              Reset
            </button>
          </div>
          <p className="relay-variant-note">
            {outreachLevelNotes[level]} {outreachFormatNotes[format]}
          </p>

          <ol className="relay-timeline">
            {messages.map((m) => (
              <li className="relay-touch" key={m.id}>
                <div className="relay-touch-head">
                  <div>
                    <h3 className="relay-touch-title">{m.label}</h3>
                    <p className="relay-touch-timing">{m.timing}</p>
                  </div>
                  <button
                    type="button"
                    className="relay-btn sm"
                    onClick={() => copy(m.label, m.paragraphs)}
                    aria-label={`Copy ${m.label}`}
                  >
                    Copy
                  </button>
                </div>
                <div className="relay-touch-body">
                  {m.paragraphs.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              </li>
            ))}
          </ol>

          <p className="relay-foot-note">
            Sending happens in the recruiting tools, not here. The scheduling link is a placeholder.
          </p>
          {toast && <p className="relay-toast">{toast}</p>}
        </div>
      </div>
    </div>
  );
}
