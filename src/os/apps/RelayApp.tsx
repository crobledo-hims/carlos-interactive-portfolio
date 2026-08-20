import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { speakingTime, talkFixtures } from "../data/relay";
import type { OutreachFormat, OutreachLevel, TalkVariant } from "../data/relay";
import { OutreachSequence } from "./relay/OutreachSequence";
import { SlackBrief } from "./relay/SlackBrief";
import type { BriefPhase } from "./relay/SlackBrief";
import { TalkTrack } from "./relay/TalkTrack";
import type { TalkPhase } from "./relay/TalkTrack";
import { reducedMotion } from "./relay/helpers";

type RelayTab = "brief" | "outreach" | "talk";

const TABS: { id: RelayTab; label: string; hint: string }[] = [
  { id: "brief", label: "Slack Brief", hint: "Candidate summary" },
  { id: "outreach", label: "Outreach Sequence", hint: "Three-touch campaign" },
  { id: "talk", label: "Talk Track", hint: "Recruiter screen script" },
];

const BRIEF_MS = 520;
const TALK_MS = 620;

/**
 * Relay holds every workflow's state so that switching tabs never restarts or
 * loses work: only the active panel is mounted (and therefore only the active
 * panel is in the accessibility tree), but its results live up here.
 */
function RelayAppImpl() {
  const [tab, setTab] = useState<RelayTab>("brief");
  const [brief, setBrief] = useState<BriefPhase>("idle");
  const [level, setLevel] = useState<OutreachLevel>("staff");
  const [format, setFormat] = useState<OutreachFormat>("default");
  const [talk, setTalk] = useState<TalkPhase>("gaps");
  const [variant, setVariant] = useState<TalkVariant>("base");
  const [screen, setScreen] = useState(false);
  const [announce, setAnnounce] = useState("");

  const timers = useRef<number[]>([]);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  const say = useCallback((message: string) => setAnnounce(message), []);

  const runBrief = useCallback(() => {
    if (reducedMotion()) {
      setBrief("done");
      say("Brief generated. Six bullets and a tech stack line.");
      return;
    }
    setBrief("working");
    timers.current.push(
      window.setTimeout(() => {
        setBrief("done");
        say("Brief generated. Six bullets and a tech stack line.");
      }, BRIEF_MS),
    );
  }, [say]);

  const runTalk = useCallback(() => {
    const done = () => {
      setTalk("ready");
      say(`Talk track drafted. About ${speakingTime(talkFixtures.base.paragraphs)} spoken.`);
    };
    if (reducedMotion()) {
      done();
      return;
    }
    setTalk("working");
    timers.current.push(window.setTimeout(done, TALK_MS));
  }, [say]);

  const onTabKey = (e: ReactKeyboardEvent, id: RelayTab) => {
    const order = TABS.map((t) => t.id);
    const i = order.indexOf(id);
    let next = -1;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = (i + 1) % order.length;
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = (i - 1 + order.length) % order.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = order.length - 1;
    else return;
    e.preventDefault();
    setTab(order[next]);
    tabRefs.current[order[next]]?.focus();
  };

  return (
    <div className="relay">
      <nav className="relay-rail">
        <div className="relay-brand">
          <span className="relay-brand-tile" aria-hidden="true">
            RL
          </span>
          <div>
            <div className="relay-brand-name">Relay</div>
            <div className="relay-brand-sub">Workflows</div>
          </div>
        </div>
        <div className="relay-tabs" role="tablist" aria-orientation="vertical" aria-label="Relay workflows">
          {TABS.map((t) => {
            const selected = t.id === tab;
            return (
              <button
                key={t.id}
                ref={(el) => {
                  tabRefs.current[t.id] = el;
                }}
                id={`relay-tab-${t.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`relay-panel-${t.id}`}
                tabIndex={selected ? 0 : -1}
                className={`relay-tab${selected ? " active" : ""}`}
                onClick={() => setTab(t.id)}
                onKeyDown={(e) => onTabKey(e, t.id)}
              >
                <span className="relay-tab-label">{t.label}</span>
                <span className="relay-tab-hint">{t.hint}</span>
              </button>
            );
          })}
        </div>
        <p className="relay-rail-foot">
          Every result below is a local fixture. No model is called and nothing leaves this page.
        </p>
      </nav>

      <div
        className="relay-main"
        id={`relay-panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`relay-tab-${tab}`}
        tabIndex={0}
      >
        <p className="relay-sr" role="status" aria-live="polite">
          {announce}
        </p>

        {tab === "brief" && (
          <SlackBrief
            phase={brief}
            onGenerate={runBrief}
            onReset={() => {
              setBrief("idle");
              say("Slack Brief demo reset.");
            }}
            announce={say}
          />
        )}

        {tab === "outreach" && (
          <OutreachSequence
            level={level}
            format={format}
            onLevel={(l) => {
              setLevel(l);
              say(`Showing the ${l} level sequence.`);
            }}
            onFormat={(f) => {
              setFormat(f);
              say(`Showing the ${f} output.`);
            }}
            onReset={() => {
              setLevel("staff");
              setFormat("default");
              say("Outreach demo reset.");
            }}
            announce={say}
          />
        )}

        {tab === "talk" && (
          <TalkTrack
            phase={talk}
            variant={variant}
            screen={screen}
            onGenerate={runTalk}
            onVariant={(v) => {
              setVariant(v);
              say(`Showing the ${talkFixtures[v].label} variant.`);
            }}
            onScreen={setScreen}
            onReset={() => {
              setTalk("gaps");
              setVariant("base");
              setScreen(false);
              say("Talk Track demo reset.");
            }}
          />
        )}
      </div>
    </div>
  );
}

export const RelayApp = memo(RelayAppImpl);
