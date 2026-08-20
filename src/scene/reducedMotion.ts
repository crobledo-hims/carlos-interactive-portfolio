import { useSyncExternalStore } from "react";

/**
 * `prefers-reduced-motion` as a reactive boolean. Every ambient animation in
 * the scene (leaf sway, mug steam, sun drift) gates on this, and each one
 * settles into a static pose rather than snapping to zero.
 */

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
