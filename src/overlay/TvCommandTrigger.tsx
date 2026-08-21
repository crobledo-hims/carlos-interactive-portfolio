import { launchHireCarlos, setHireCarlosHint } from "../easterEgg/hireCarlos";
import { overlayState } from "../overlayState";
import { useDrivenOpacity } from "./useDrivenOpacity";

/**
 * Keyboard-accessible hit target over the wall TV in the opening composition.
 * The root is click-through so it cannot block the intro card beneath it.
 */
export function TvCommandTrigger() {
  const ref = useDrivenOpacity(() => overlayState.intro, false);

  return (
    <div className="tv-command-layer" ref={ref}>
      <button
        type="button"
        className="tv-command-trigger"
        aria-label="Run a hidden command on the Personal monitor"
        onPointerEnter={() => setHireCarlosHint(true)}
        onPointerLeave={() => setHireCarlosHint(false)}
        onFocus={() => setHireCarlosHint(true)}
        onBlur={() => setHireCarlosHint(false)}
        onClick={() => {
          setHireCarlosHint(false);
          launchHireCarlos();
        }}
      >
        <span className="tv-command-label" aria-hidden="true">
          Run a command
        </span>
      </button>
    </div>
  );
}
