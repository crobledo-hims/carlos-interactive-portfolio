import { briefCandidate, briefGuardrails, briefOutput, briefSources } from "../../data/relay";
import { copyText, useToast } from "./helpers";
import { Guardrails, SourceList, Synthetic } from "./parts";

export type BriefPhase = "idle" | "working" | "done";

interface Props {
  phase: BriefPhase;
  onGenerate: () => void;
  onReset: () => void;
  announce: (message: string) => void;
}

function plainText() {
  return [
    ...briefOutput.bullets.map((b) => `• ${b}`),
    "",
    `Tech stack: ${briefOutput.techStack}`,
    "",
    `Reference: ${briefCandidate.reference}`,
  ].join("\n");
}

export function SlackBrief({ phase, onGenerate, onReset, announce }: Props) {
  const { toast, show } = useToast();

  const copy = async () => {
    const ok = await copyText(plainText());
    const message = ok
      ? "Brief copied. Paste it into Slack yourself."
      : "Copy was blocked by the browser. Select the text to copy it.";
    show(message);
    announce(message);
  };

  return (
    <div className="relay-panel">
      <header className="relay-panel-head">
        <div>
          <h2 className="relay-h2">Slack Brief</h2>
          <p className="relay-sub">
            An executive-ready summary Carlos pastes into Slack by hand. Nothing is posted from here.
          </p>
        </div>
        <Synthetic />
      </header>

      <div className="relay-body">
        <div className="relay-col-inputs">
          <SourceList cards={briefSources} title="Source inputs" />
          <p className="relay-priority">
            Intake notes drive the narrative. The profile grounds titles, dates, metrics, and technology.
          </p>
          <Guardrails items={briefGuardrails} />
        </div>

        <div className="relay-col-output">
          <div className="relay-output-head">
            <h3 className="relay-h3">Hiring-team brief</h3>
            <div className="relay-actions">
              {phase === "done" ? (
                <>
                  <button type="button" className="relay-btn" onClick={copy}>
                    Copy for Slack
                  </button>
                  <button type="button" className="relay-btn ghost" onClick={onReset}>
                    Reset demo
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="relay-btn primary"
                  onClick={onGenerate}
                  disabled={phase === "working"}
                >
                  {phase === "working" ? "Generating…" : "Generate brief"}
                </button>
              )}
            </div>
          </div>

          {phase === "done" ? (
            <article className="relay-output">
              <p className="relay-output-who">
                {briefCandidate.name} · {briefCandidate.headline} · {briefCandidate.company}
              </p>
              <ul className="relay-bullets">
                {briefOutput.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <p className="relay-stack">
                <span>Tech stack:</span> {briefOutput.techStack}
              </p>
              <p className="relay-reference">Reference: {briefCandidate.reference}</p>
            </article>
          ) : (
            <div className={`relay-placeholder${phase === "working" ? " working" : ""}`}>
              {phase === "working" ? (
                <p>Composing the brief from the intake notes and profile…</p>
              ) : (
                <p>
                  Six bullets, an engineering tech-stack line, and the file reference at the end. Every claim
                  traces back to one of the two sources on the left.
                </p>
              )}
            </div>
          )}

          {toast && <p className="relay-toast">{toast}</p>}
        </div>
      </div>
    </div>
  );
}
