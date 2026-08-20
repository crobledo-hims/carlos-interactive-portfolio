import { overlayState } from "../overlayState";

const DURATION = 850;
/** Extra time for drei's scroll damping to settle before the lock releases. */
const SETTLE = 250;

let running = false;

function easeInOutCubic(x: number) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** True while a scripted scroll is in flight. */
export function isNavigating() {
  return running;
}

/**
 * Smooth-scrolls drei's scroll container to a normalized offset (0..1).
 *
 * The camera rig reads scroll offset every frame, so driving scrollTop drives
 * the camera; its damping supplies the final settle. This is the one scripted
 * path between camera positions: the intro's "Enter workspace" button and
 * every monitor-navigation control share it.
 *
 * Only one scripted scroll runs at a time. A call made while another is in
 * flight is refused rather than queued, so repeated clicks on a navigation
 * control cannot stack transitions or fight each other for scrollTop. The
 * visitor's own wheel gestures are untouched by the lock.
 *
 * Returns false when the scroll container is not mounted yet or the lock is
 * held, so callers can tell a refused navigation from a completed one.
 */
export function scrollToOffset(offset: number): boolean {
  const el = overlayState.scrollEl;
  if (!el || running) return false;

  const target = (el.scrollHeight - el.clientHeight) * offset;

  // Nothing to animate, so nothing to lock either.
  if (reducedMotion()) {
    el.scrollTop = target;
    return true;
  }

  running = true;
  const start = el.scrollTop;
  const t0 = performance.now();

  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / DURATION);
    el.scrollTop = start + (target - start) * easeInOutCubic(p);
    if (p < 1) {
      requestAnimationFrame(step);
      return;
    }
    running = false;
  };
  requestAnimationFrame(step);

  // If rAF stalls (tab backgrounded mid-transition) the step loop never
  // reaches p === 1: land on target and release the lock regardless, so a
  // backgrounded transition can never strand navigation.
  setTimeout(() => {
    if (Math.abs(el.scrollTop - target) > 1) el.scrollTop = target;
    running = false;
  }, DURATION + SETTLE);

  return true;
}
