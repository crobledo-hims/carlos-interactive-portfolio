import { overlayState } from "../overlayState";
import { WORK_DOCK_OFFSET } from "../scene/CameraRig";
import { useDrivenOpacity } from "./Overlays";

function easeInOutCubic(x: number) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

// Smooth-scrolls the drei scroll container to the Work-desktop dock.
// The camera rig reads scroll offset, so driving scrollTop drives the camera;
// its damping supplies the final settle. ~850ms + settle ≈ the 700–1000ms brief.
function enterWorkspace() {
  const el = overlayState.scrollEl;
  if (!el) return;
  const target = (el.scrollHeight - el.clientHeight) * WORK_DOCK_OFFSET;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.scrollTop = target;
    return;
  }
  const start = el.scrollTop;
  const t0 = performance.now();
  const duration = 850;
  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / duration);
    el.scrollTop = start + (target - start) * easeInOutCubic(p);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  // If rAF stalls (tab backgrounded mid-transition), land on target anyway.
  setTimeout(() => {
    if (Math.abs(el.scrollTop - target) > 1) el.scrollTop = target;
  }, duration + 250);
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
