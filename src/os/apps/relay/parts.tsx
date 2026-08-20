import type { SourceCard } from "../../data/relay";

export function SourceList({ cards, title }: { cards: SourceCard[]; title: string }) {
  return (
    <section className="relay-sources">
      <h3 className="relay-h3">{title}</h3>
      <ol className="relay-source-list">
        {cards.map((c) => (
          <li className={`relay-source${c.empty ? " empty" : ""}`} key={c.id}>
            <div className="relay-source-head">
              {c.rank !== undefined && (
                <span className="relay-rank" aria-label={`Priority ${c.rank}`}>
                  {c.rank}
                </span>
              )}
              <span className="relay-source-label">{c.label}</span>
              {c.note && <span className="relay-source-note">{c.note}</span>}
            </div>
            {c.lines.length > 0 ? (
              <ul className="relay-source-lines">
                {c.lines.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            ) : (
              <p className="relay-source-lines empty">Nothing supplied yet</p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Guardrails({ items, title = "Workflow guardrails" }: { items: string[]; title?: string }) {
  return (
    <section className="relay-guardrails">
      <h3 className="relay-h3">{title}</h3>
      <ul>
        {items.map((g) => (
          <li key={g}>{g}</li>
        ))}
      </ul>
    </section>
  );
}

export function Synthetic() {
  return <span className="relay-synthetic">Synthetic demonstration data</span>;
}

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
}

/** A small radio group; every option maps to a prewritten example. */
export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <div className="relay-seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          className={`relay-seg-btn${value === o.id ? " on" : ""}`}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
