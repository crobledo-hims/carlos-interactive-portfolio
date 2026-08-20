import { overlayState } from "../overlayState";
import { Desktop } from "../os/Desktop";
import { useDrivenOpacity } from "./useDrivenOpacity";

function forwardWheel(e: React.WheelEvent) {
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
