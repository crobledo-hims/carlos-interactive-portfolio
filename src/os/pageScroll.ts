import { overlayState } from "../overlayState";

/**
 * Nudge the page forward by roughly one viewport — the same distance one
 * scroll "page" of drei's ScrollControls covers — so the visitor can always
 * leave a monitor without touching their wheel.
 */
export function scrollOnward() {
  const el = overlayState.scrollEl;
  if (!el) return;
  el.scrollTo({ top: el.scrollTop + el.clientHeight * 1.05, behavior: "smooth" });
}
