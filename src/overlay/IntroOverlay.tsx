import { overlayState } from "../overlayState";
import { WORK_DOCK_OFFSET } from "../scene/CameraRig";
import { scrollToOffset } from "./scrollTo";
import { useDrivenOpacity } from "./useDrivenOpacity";

// Docks the camera on the Work desktop. Shares the scripted-scroll helper with
// the monitor navigation controls, so both obey the same transition lock.
function enterWorkspace() {
  scrollToOffset(WORK_DOCK_OFFSET);
}

export function IntroOverlay() {
  const ref = useDrivenOpacity(() => overlayState.intro);
  return (
    <div className="intro-overlay" ref={ref}>
      <section className="intro-inner" aria-label="Introduction">
        <h1>Carlos Robledo</h1>
        <p className="intro-role">Technical Sourcing Lead &amp; Recruiting Systems Builder</p>
        <p className="intro-value">
          I build recruiting systems that make complex technical hiring faster, clearer, and more
          consistent.
        </p>
        <div className="intro-actions">
          <button type="button" className="intro-primary" onClick={enterWorkspace}>
            Enter workspace
          </button>
          <a className="intro-secondary" href="/resume.html">
            View resume
          </a>
        </div>
      </section>
    </div>
  );
}
