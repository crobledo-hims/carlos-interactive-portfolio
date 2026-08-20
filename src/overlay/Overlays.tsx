import { overlayState } from "../overlayState";
import { Desktop } from "../os/Desktop";
import { useDrivenOpacity } from "./useDrivenOpacity";

/**
 * Scrolling the desktop — wallpaper, icons, dock, menu bar — keeps driving the
 * scene, so the visitor can always move on to the next monitor.
 *
 * App windows are wheel boundaries and already stop their own events (see
 * src/os/wheel.ts). The boundary check here is defence in depth: if anything
 * inside a window ever swallows the synthetic event's stopPropagation, a
 * gesture that started in an app still must not move the camera.
 */
function forwardWheel(e: React.WheelEvent) {
  const target = e.target;
  if (target instanceof Element && target.closest("[data-monitor-scroll-boundary]")) return;
  overlayState.scrollEl?.scrollBy({ top: e.deltaY });
}

// Both desktops mount off camera, so they start out inert and hidden; the
// visibility driver flips that the moment the camera docks on them.
export function LeftMonitorOverlay() {
  const ref = useDrivenOpacity(() => overlayState.left);
  return (
    <div className="monitor-overlay" ref={ref} onWheel={forwardWheel} inert aria-hidden="true">
      <Desktop screen="left" />
    </div>
  );
}

export function RightMonitorOverlay() {
  const ref = useDrivenOpacity(() => overlayState.right);
  return (
    <div className="monitor-overlay" ref={ref} onWheel={forwardWheel} inert aria-hidden="true">
      <Desktop screen="right" />
    </div>
  );
}
