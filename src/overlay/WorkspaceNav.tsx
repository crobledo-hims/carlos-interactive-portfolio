import { useCallback, useEffect, useRef, useState } from "react";
import { overlayState } from "../overlayState";
import {
  MONITOR_LABEL,
  MONITOR_OFFSET,
  MONITOR_ORDER,
  monitorIndex,
  readActiveMonitor,
} from "./monitors";
import type { MonitorId } from "./monitors";
import { scrollToOffset } from "./scrollTo";
import { useDrivenOpacity } from "./useDrivenOpacity";

/** Set once the visitor has reached the second monitor or dismissed the tip. */
const PROMPT_KEY = "portfolio.monitorPromptDone";

/** Delay before the first-visit tip appears, so it follows the camera settling. */
const PROMPT_DELAY = 1000;

/**
 * Places where Left/Right already means something to the visitor, the browser,
 * or an assistive technology, and so must not be taken for navigation.
 */
const INTERACTIVE = [
  "input",
  "textarea",
  "select",
  "a[href]",
  "button",
  "summary",
  "[contenteditable='']",
  "[contenteditable='true']",
  "[role='button']",
  "[role='link']",
  "[role='tab']",
  "[role='radio']",
  "[role='checkbox']",
  "[role='menuitem']",
  "[role='textbox']",
  "[role='combobox']",
  "[role='listbox']",
  "[role='slider']",
  "[role='spinbutton']",
].join(",");

/**
 * Arrow keys move between monitors only from the office itself.
 *
 * They are ignored inside an application window and inside any interactive
 * control, so they never take a key away from a form field, a link, a tab list
 * or a browser shortcut. The workspace navigation controls are the single
 * exception: an arrow pressed there does exactly what the control does, which
 * is not a hijack.
 */
function arrowsAllowedFrom(el: Element | null) {
  if (!el || el === document.body) return true;
  if (el.closest("[data-workspace-nav]")) return true;
  // Set by the shared OS Window component; covers every app, present and future.
  if (el.closest("[data-monitor-scroll-boundary]")) return false;
  return !el.closest(INTERACTIVE);
}

function readPromptDone() {
  try {
    return localStorage.getItem(PROMPT_KEY) === "1";
  } catch {
    // Storage blocked. Showing the tip again next visit is a better failure
    // than never showing it, since discovery is the whole point.
    return false;
  }
}

function writePromptDone() {
  try {
    localStorage.setItem(PROMPT_KEY, "1");
  } catch {
    /* storage blocked; the in-memory flag still settles it for this visit */
  }
}

/** Stable across renders, so useDrivenOpacity keeps a single rAF loop. */
const readNavAlpha = () => Math.max(overlayState.left, overlayState.right);

export function WorkspaceNav() {
  // No pointer capture: the layer spans the viewport, so it must stay
  // click-through and let only its own controls take events.
  const layerRef = useDrivenOpacity(readNavAlpha, false);

  const [active, setActive] = useState<MonitorId | null>(null);
  const [status, setStatus] = useState("");
  const [tipOpen, setTipOpen] = useState(false);

  // Whether the tip has been retired for good. A ref, not state: nothing
  // renders from it directly, and the rAF loop below has to read it live.
  const tipSettled = useRef<boolean | null>(null);
  if (tipSettled.current === null) tipSettled.current = readPromptDone();

  const go = useCallback((id: MonitorId) => {
    scrollToOffset(MONITOR_OFFSET[id]);
  }, []);

  /**
   * The camera is the external system here: it writes overlay alphas every
   * frame and never tells React about it. This loop is the single place that
   * turns "the camera moved" into React state, so every downstream update
   * (active monitor, live-region status, first-visit tip) happens once per
   * actual change rather than once per frame.
   */
  useEffect(() => {
    let raf = 0;
    let timer = 0;
    let last: MonitorId | null = null;

    const tick = () => {
      const next = readActiveMonitor();
      if (next !== last) {
        last = next;
        setActive(next);

        if (next) {
          // Announce arrival rather than intent, so the status always matches
          // what is on screen. Covers wheel-driven moves, not just the controls.
          setStatus(
            `${MONITOR_LABEL[next]} monitor, ${monitorIndex(next)} of ${MONITOR_ORDER.length}, opened.`,
          );
        }

        clearTimeout(timer);
        if (next !== "work") setTipOpen(false);

        if (next === "personal" && !tipSettled.current) {
          // Reaching the second monitor is what the tip was asking for.
          tipSettled.current = true;
          writePromptDone();
        } else if (next === "work" && !tipSettled.current) {
          timer = window.setTimeout(() => setTipOpen(true), PROMPT_DELAY);
        }
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, []);

  const dismissTip = useCallback(() => {
    tipSettled.current = true;
    writePromptDone();
    setTipOpen(false);
  }, []);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (!arrowsAllowedFrom(document.activeElement)) return;

      const next = MONITOR_ORDER[monitorIndex(active) - 1 + (e.key === "ArrowRight" ? 1 : -1)];
      if (!next) return;
      e.preventDefault();
      go(next);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, go]);

  const other: MonitorId | null =
    active === "work" ? "personal" : active === "personal" ? "work" : null;
  const side = active === "personal" ? "left" : "right";

  return (
    <div className="wsnav-root">
      {/* Outside the faded layer on purpose: during a transition both monitors
          are dimmed, and an aria-hidden live region announces nothing. */}
      <p className="wsnav-sr" role="status" aria-live="polite">
        {status}
      </p>

      <div className="wsnav-layer" ref={layerRef}>
        {other && (
          <button
            type="button"
            data-workspace-nav="true"
            className={`wsnav-edge ${side}`}
            aria-label={`Open the ${MONITOR_LABEL[other]} monitor`}
            onClick={() => go(other)}
          >
            <span className="wsnav-edge-light" aria-hidden="true" />
            <svg className="wsnav-chev" viewBox="0 0 12 20" aria-hidden="true">
              <path d={side === "right" ? "M4 3l7 7-7 7" : "M8 3l-7 7 7 7"} />
            </svg>
          </button>
        )}

        {tipOpen && active === "work" && (
          <div className="wsnav-tip" role="note" aria-labelledby="wsnav-tip-title">
            <p className="wsnav-tip-title" id="wsnav-tip-title">
              {"There's more on the Personal monitor"}
            </p>
            <p className="wsnav-tip-body">
              {"Open the second screen, or press the right arrow key."}
            </p>
            <div className="wsnav-tip-actions">
              <button
                type="button"
                data-workspace-nav="true"
                className="wsnav-tip-go"
                onClick={() => {
                  dismissTip();
                  go("personal");
                }}
              >
                Explore Personal <span aria-hidden="true">→</span>
              </button>
              <button
                type="button"
                data-workspace-nav="true"
                className="wsnav-tip-x"
                aria-label="Dismiss this tip"
                onClick={dismissTip}
              >
                <svg viewBox="0 0 12 12" aria-hidden="true">
                  <path d="M3.2 3.2l5.6 5.6M8.8 3.2l-5.6 5.6" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="wsnav-switch" role="group" aria-label="Monitor navigation">
          {MONITOR_ORDER.map((id) => (
            <button
              key={id}
              type="button"
              data-workspace-nav="true"
              className={`wsnav-tab${id === active ? " on" : ""}`}
              aria-label={`Open the ${MONITOR_LABEL[id]} monitor, ${monitorIndex(id)} of ${MONITOR_ORDER.length}`}
              aria-current={id === active ? "true" : undefined}
              onClick={() => go(id)}
            >
              <span className="wsnav-tab-dot" aria-hidden="true" />
              <span aria-hidden="true">{MONITOR_LABEL[id]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
