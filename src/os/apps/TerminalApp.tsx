import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { AppId, AppProps } from "../types";
import { useScreenLive } from "../screenLive";
import { makeClock, typeOut } from "./cadence/clock";
import type { Clock } from "./cadence/clock";
import {
  beginManualHireCarlos,
  completeHireCarlos,
  useHireCarlosSnapshot,
} from "../../easterEgg/hireCarlos";

type LineKind = "in" | "out" | "dim" | "err" | "ok" | "action";

interface Line {
  id: number;
  kind: LineKind;
  text: string;
}

const PROMPT = "carlos@portfolio ~ %";
const HIRE_COMMAND = "sudo hire carlos";

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
  "  open <project>    open an app window (cadence | beacon | lens | relay)",
  "  open resume       open the resume viewer",
  "  open linkedin     open my LinkedIn profile",
  "  contact           how to reach me",
  "  clear             clear the screen",
];

const PROJECTS: string[] = [
  "cadence/ recruiting operations · keeps teams informed and work moving",
  "beacon/  role intelligence · see where recruiting attention is needed",
  "lens/    candidate evaluation · evidence weighed against role criteria",
  "relay/   candidate communication · outreach and recruiter prep",
];

const WHOAMI: string[] = [
  "carlos",
  "",
  "Technical Sourcing Lead. 10+ years of technical hiring across",
  "Staff+ Engineering, Applied AI, and org-building initiatives.",
  "Builds the tooling that turns recruiting expertise into workflows.",
];

const OPENABLE: Record<string, AppId> = {
  cadence: "cadence",
  beacon: "beacon",
  lens: "lens",
  relay: "relay",
  resume: "resume",
  linkedin: "linkedin",
  mail: "mail",
  contact: "mail",
};

function TerminalAppImpl({ openApp }: AppProps) {
  const screenLive = useScreenLive();
  const hireCarlos = useHireCarlosSnapshot();
  const seed = useRef(INTRO.length);
  const [lines, setLines] = useState<Line[]>(() =>
    INTRO.map((text, i) => ({ id: i, kind: "dim" as LineKind, text })),
  );
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const history = useRef<string[]>([]);
  const histPos = useRef(-1);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scriptClock = useRef<Clock | null>(null);
  const lastAutoRun = useRef(0);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const emit = useCallback((items: { kind: LineKind; text: string }[]) => {
    setLines((prev) => [...prev, ...items.map((i) => ({ ...i, id: seed.current++ }))]);
  }, []);

  const pauseForVisibility = useCallback(() => {
    if (document.hidden) scriptClock.current?.pause();
    else scriptClock.current?.resume();
  }, []);

  useEffect(() => {
    document.addEventListener("visibilitychange", pauseForVisibility);
    return () => document.removeEventListener("visibilitychange", pauseForVisibility);
  }, [pauseForVisibility]);

  useEffect(
    () => () => {
      scriptClock.current?.cancel();
    },
    [],
  );

  const playHireSequence = useCallback(
    async (clock: Clock, manual: boolean) => {
      if (manual) beginManualHireCarlos();
      setBusy(true);
      emit([{ kind: "in", text: HIRE_COMMAND }]);

      const appendAfter = async (ms: number, kind: LineKind, text: string) => {
        await clock.sleep(ms);
        if (!clock.alive()) return false;
        emit([{ kind, text }]);
        return true;
      };

      if (!(await appendAfter(360, "out", "Evaluating candidate..."))) return;
      if (!(await appendAfter(520, "ok", "Technical sourcing ........ PASS"))) return;
      if (!(await appendAfter(330, "ok", "Recruiting systems ......... PASS"))) return;
      if (!(await appendAfter(330, "ok", "AI-enabled workflows ....... PASS"))) return;
      if (!(await appendAfter(330, "ok", "Stakeholder partnership .... PASS"))) return;
      if (!(await appendAfter(330, "ok", "Follow-through ............. PASS"))) return;
      if (!(await appendAfter(620, "out", ""))) return;
      if (!(await appendAfter(120, "ok", "Recommendation: STRONG HIRE"))) return;
      if (!(await appendAfter(480, "dim", "Preparing next step..."))) return;
      if (!(await appendAfter(520, "action", "Send Carlos a message →"))) return;

      if (scriptClock.current === clock) {
        scriptClock.current = null;
        setBusy(false);
      }
      completeHireCarlos();
    },
    [emit],
  );

  // The TV trigger opens this window immediately, but the typing waits for the
  // Personal monitor to be both on camera and settled. A run id makes React's
  // effect replay semantics harmless: every launch can execute only once.
  useEffect(() => {
    if (
      !screenLive ||
      !hireCarlos.auto ||
      hireCarlos.phase !== "running" ||
      hireCarlos.runId <= lastAutoRun.current
    ) {
      return;
    }

    lastAutoRun.current = hireCarlos.runId;
    scriptClock.current?.cancel();
    const clock = makeClock();
    scriptClock.current = clock;
    setBusy(true);

    void (async () => {
      await clock.sleep(Math.max(0, hireCarlos.readyAt - performance.now()));
      if (!clock.alive()) return;
      setValue("");
      await typeOut(clock, HIRE_COMMAND, setValue);
      if (!clock.alive()) return;
      setValue("");
      await playHireSequence(clock, false);
    })();

    return () => {
      if (scriptClock.current !== clock) return;
      clock.cancel();
      scriptClock.current = null;
      setBusy(false);
    };
  }, [hireCarlos, playHireSequence, screenLive]);

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
            { kind: "dim", text: "try: open cadence | open beacon | open lens | open resume | open linkedin" },
          ]);
        }
        return;
      }
      case "contact":
        emit([
          ...echo,
          { kind: "out", text: "email     thecarlosrobledo@gmail.com" },
          { kind: "out", text: "linkedin  linkedin.com/in/thecarlosrobledo" },
          { kind: "dim", text: "`open mail` drafts a message. `open linkedin` opens the profile." },
        ]);
        return;
      case "sudo":
        if (arg === "hire carlos") {
          scriptClock.current?.cancel();
          const clock = makeClock();
          scriptClock.current = clock;
          void playHireSequence(clock, true);
          return;
        }
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
        if (e.target === inputRef.current || (e.target as Element).closest?.("button, a")) return;
        e.preventDefault();
        inputRef.current?.focus();
      }}
    >
      <div className="term-body" ref={bodyRef} aria-busy={busy}>
        {lines.map((l) => (
          <div className={`term-line ${l.kind}`} key={l.id}>
            {l.kind === "in" ? (
              <>
                <span className="term-prompt">{PROMPT}</span> {l.text}
              </>
            ) : l.kind === "action" ? (
              <button type="button" className="term-action" onClick={() => openApp("mail")}>
                {l.text}
              </button>
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
            readOnly={busy}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (busy) return;
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
