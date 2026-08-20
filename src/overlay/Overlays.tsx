import { useEffect, useRef } from "react";
import { overlayState } from "../overlayState";

function forwardWheel(e: React.WheelEvent) {
  overlayState.scrollEl?.scrollBy({ top: e.deltaY });
}

function useDrivenOpacity(read: () => number) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const el = ref.current;
      if (el) {
        const a = read();
        el.style.opacity = String(a);
        el.style.pointerEvents = a > 0.5 ? "auto" : "none";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [read]);
  return ref;
}

export function LeftMonitorOverlay() {
  const ref = useDrivenOpacity(() => overlayState.left);
  return (
    <div className="monitor-overlay" ref={ref} onWheel={forwardWheel}>
      <div className="panel">
        <h2>Rex — Recruiting Pipeline Alerts</h2>
        <p>
          Placeholder for the Rex Slack mock: live pipeline alerts, offer-stage
          notifications, stale-candidate nudges. This panel becomes a real,
          scrollable DOM app in the content phase.
        </p>
      </div>
    </div>
  );
}

export function RightMonitorOverlay() {
  const ref = useDrivenOpacity(() => overlayState.right);
  return (
    <div className="monitor-overlay" ref={ref} onWheel={forwardWheel}>
      <div className="panel">
        <h2>Carlos Robledo — Resume</h2>
        <p>
          Placeholder for the resume view in browser chrome. The full static
          version lives at <a href="/resume.html" style={{ color: "#8fb4ff" }}>/resume.html</a>.
        </p>
      </div>
    </div>
  );
}

export function ScrollHint() {
  const ref = useDrivenOpacity(() => overlayState.hint);
  return (
    <div className="scroll-hint" ref={ref as React.RefObject<HTMLDivElement>}>
      Scroll to enter
    </div>
  );
}
