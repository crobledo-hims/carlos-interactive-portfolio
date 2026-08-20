import { useEffect, useRef } from "react";
import { overlayState } from "../overlayState";
import { Desktop } from "../os/Desktop";

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
        el.inert = a <= 0.5; // keep the hidden desktop out of the Tab order
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
      <Desktop screen="left" />
    </div>
  );
}

export function RightMonitorOverlay() {
  const ref = useDrivenOpacity(() => overlayState.right);
  return (
    <div className="monitor-overlay" ref={ref} onWheel={forwardWheel}>
      <Desktop screen="right" />
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
