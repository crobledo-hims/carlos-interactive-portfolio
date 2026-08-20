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

/** Spoken labels for the live region, so it never announces a raw fixture id. */
const LEVEL_LABEL: Record<OutreachLevel, string> = {
  senior: "Senior",
  staff: "Staff",
  principal: "Principal",
};

const FORMAT_LABEL: Record<OutreachFormat, string> = {
  default: "default sequence",
  linkedin: "LinkedIn version",
  sobo: "SOBO version",
};

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
  const openTab = useRef<RelayTab>(tab);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  const say = useCallback((message: string) => setAnnounce(message), []);

  // One live region serves all three workflows, so switching tabs has to clear
  // it. Otherwise a screen reader keeps reporting the Slack Brief result while
  // the visitor is looking at Outreach or Talk Track.
  const selectTab = useCallback((next: RelayTab) => {
    setTab(next);
    openTab.current = next;
    setAnnounce("");
  }, []);

  /**
   * Announce only if that workflow is still open. The generate steps finish on
   * a timer, so without this a result can land in the live region after the
   * visitor has already moved to another tab.
   */
  const sayFor = useCallback((owner: RelayTab, message: string) => {
    if (openTab.current !== owner) return;
    setAnnounce(message);
  }, []);

  const runBrief = useCallback(() => {
    if (reducedMotion()) {
      setBrief("done");
      sayFor("brief", "Slack Brief generated. Six bullets, a tech stack line, and the file reference.");
      return;
    }
    setBrief("working");
    timers.current.push(
      window.setTimeout(() => {
        setBrief("done");
        sayFor("brief", "Slack Brief generated. Six bullets, a tech stack line, and the file reference.");
      }, BRIEF_MS),
    );
  }, [sayFor]);

  const runTalk = useCallback(() => {
    const done = () => {
      setTalk("ready");
      sayFor("talk", `Talk Track drafted. About ${speakingTime(talkFixtures.base.paragraphs)} spoken.`);
    };
    if (reducedMotion()) {
      done();
      return;
    }
    setTalk("working");
    timers.current.push(window.setTimeout(done, TALK_MS));
  }, [sayFor]);

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
    selectTab(order[next]);
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
                onClick={() => selectTab(t.id)}
                onKeyDown={(e) => onTabKey(e, t.id)}
              >
                <span className="relay-tab-label">{t.label}</span>
                <span className="relay-tab-hint">{t.hint}</span>
              </button>
            );
          })}
        </div>
        <p className="relay-rail-foot">
          This demo uses prewritten synthetic examples. No information is uploaded or sent.
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
              say(`Outreach Sequence: showing the ${LEVEL_LABEL[l]} level.`);
            }}
            onFormat={(f) => {
              setFormat(f);
              say(`Outreach Sequence: showing the ${FORMAT_LABEL[f]}.`);
            }}
            onReset={() => {
              setLevel("staff");
              setFormat("default");
              say("Outreach Sequence demo reset.");
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
              say(`Talk Track: showing the ${talkFixtures[v].label} revision.`);
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
