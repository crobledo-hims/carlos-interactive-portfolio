import { memo, useEffect, useRef, useState } from "react";
import type { AppId, AppProps } from "../types";

type LineKind = "in" | "out" | "dim" | "err" | "ok";

interface Line {
  id: number;
  kind: LineKind;
  text: string;
}

const PROMPT = "carlos@portfolio ~ %";

const INTRO: string[] = [
  "PortfolioOS 1.0 (zsh)",
  "Last login: today, on the left-hand monitor.",
  "",
  "Type `help` if you want the tour.",
];

const HELP: string[] = [
  "Available commands",
  "  help              show this list",
  "  whoami            who is behind this desk",
  "  ls projects       list the things I have built",
  "  open <project>    open an app window (rex | pulse | gauge | relay)",
  "  open resume       open the resume viewer",
  "  contact           how to reach me",
  "  clear             clear the screen",
];

const PROJECTS: string[] = [
  "rex/     automated recruiting operations — Ashby + Slack + Airtable + AI",
  "pulse/   recruiting intelligence — rules-based R/Y/G health + forecasts",
  "gauge/   AI-assisted Chrome extension for LinkedIn Recruiter",
  "relay/   candidate communication and recruiter prep workflows",
];

const WHOAMI: string[] = [
  "carlos",
  "",
  "Technical Sourcing Lead. 10+ years of technical hiring across",
  "Staff+ Engineering, Applied AI, and org-building initiatives.",
  "Builds the tooling that turns recruiting expertise into workflows.",
];

const OPENABLE: Record<string, AppId> = {
  rex: "rex",
  pulse: "pulse",
  gauge: "gauge",
  relay: "relay",
  resume: "resume",
  mail: "mail",
  contact: "mail",
};

function TerminalAppImpl({ openApp }: AppProps) {
  const seed = useRef(INTRO.length);
  const [lines, setLines] = useState<Line[]>(() =>
    INTRO.map((text, i) => ({ id: i, kind: "dim" as LineKind, text })),
  );
  const [value, setValue] = useState("");
  const history = useRef<string[]>([]);
  const histPos = useRef(-1);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const emit = (items: { kind: LineKind; text: string }[]) => {
    setLines((prev) => [...prev, ...items.map((i) => ({ ...i, id: seed.current++ }))]);
  };

  const run = (raw: string) => {
    const cmd = raw.trim();
    const echo: { kind: LineKind; text: string }[] = [{ kind: "in", text: cmd }];
    if (cmd) {
      history.current = [cmd, ...history.current].slice(0, 30);
    }
    histPos.current = -1;

    if (!cmd) {
      emit(echo);
      return;
    }

    const [head, ...rest] = cmd.split(/\s+/);
    const arg = rest.join(" ").toLowerCase();

    switch (head.toLowerCase()) {
      case "clear":
        setLines([]);
        return;
      case "help":
        emit([...echo, ...HELP.map((text) => ({ kind: "out" as LineKind, text }))]);
        return;
      case "whoami":
        emit([...echo, ...WHOAMI.map((text) => ({ kind: "out" as LineKind, text }))]);
        return;
      case "ls":
        if (arg === "" || arg === "projects" || arg === "projects/") {
          emit([...echo, ...PROJECTS.map((text) => ({ kind: "out" as LineKind, text }))]);
        } else {
          emit([...echo, { kind: "err", text: `ls: ${arg}: No such file or directory` }]);
        }
        return;
      case "open": {
        const target = OPENABLE[arg];
        if (target) {
          openApp(target);
          emit([...echo, { kind: "ok", text: `Opening ${arg}…` }]);
        } else {
          emit([
            ...echo,
            { kind: "err", text: `open: nothing here called '${arg || "?"}'` },
            { kind: "dim", text: "try: open rex | open pulse | open gauge | open resume" },
          ]);
        }
        return;
      }
      case "contact":
        emit([
          ...echo,
          { kind: "out", text: "email     thecarlosrobledo@gmail.com" },
          { kind: "out", text: "linkedin  linkedin.com/in/thecarlosrobledo" },
          { kind: "dim", text: "`open mail` drafts a message for you." },
        ]);
        return;
      case "sudo":
        emit([...echo, { kind: "err", text: "carlos is not in the sudoers file. This incident has been reported." }]);
        return;
      case "date":
        emit([...echo, { kind: "out", text: new Date().toString() }]);
        return;
      case "exit":
        emit([...echo, { kind: "dim", text: "Nice try. Use the red traffic light." }]);
        return;
      default:
        emit([
          ...echo,
          { kind: "err", text: `zsh: command not found: ${head}` },
          { kind: "dim", text: "type `help` for the list" },
        ]);
    }
  };

  return (
    <div
      className="term"
      onMouseDown={(e) => {
        // Without preventDefault the browser's own focus handling fires after
        // ours and drops focus back to <body>, so typing would go nowhere.
        if (e.target === inputRef.current) return;
        e.preventDefault();
        inputRef.current?.focus();
      }}
    >
      <div className="term-body" ref={bodyRef}>
        {lines.map((l) => (
          <div className={`term-line ${l.kind}`} key={l.id}>
            {l.kind === "in" ? (
              <>
                <span className="term-prompt">{PROMPT}</span> {l.text}
              </>
            ) : (
              l.text || " "
            )}
          </div>
        ))}

        <div className="term-line live">
          <span className="term-prompt">{PROMPT}</span>{" "}
          <span className="term-typed">{value}</span>
          <span className="term-cursor" />
          <input
            ref={inputRef}
            className="term-input"
            value={value}
            spellCheck={false}
            autoComplete="off"
            aria-label="Terminal input"
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                run(value);
                setValue("");
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                const next = Math.min(histPos.current + 1, history.current.length - 1);
                if (next >= 0) {
                  histPos.current = next;
                  setValue(history.current[next]);
                }
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                const next = histPos.current - 1;
                histPos.current = Math.max(next, -1);
                setValue(next >= 0 ? history.current[next] : "");
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

export const TerminalApp = memo(TerminalAppImpl);
