import { useSyncExternalStore } from "react";
import { SETTLE_MS } from "../os/constants";
import { MONITOR_OFFSET, readActiveMonitor } from "../overlay/monitors";
import { ENTER_MS, NAV_MS, scrollToOffset } from "../overlay/scrollTo";

export type HireCarlosPhase = "idle" | "hint" | "running" | "complete";

export interface HireCarlosSnapshot {
  /** Increments for every automatic launch so Terminal runs it exactly once. */
  runId: number;
  phase: HireCarlosPhase;
  auto: boolean;
  /** Earliest time the command may type, after the camera has arrived. */
  readyAt: number;
}

const COMPLETE_MS = 5_000;
const listeners = new Set<() => void>();

let snapshot: HireCarlosSnapshot = {
  runId: 0,
  phase: "idle",
  auto: false,
  readyAt: 0,
};
let resetTimer = 0;

function publish(next: HireCarlosSnapshot) {
  snapshot = next;
  for (const listener of listeners) listener();
}

export function getHireCarlosSnapshot() {
  return snapshot;
}

export function subscribeHireCarlos(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useHireCarlosSnapshot() {
  return useSyncExternalStore(subscribeHireCarlos, getHireCarlosSnapshot, getHireCarlosSnapshot);
}

/** The TV hover/focus affordance never interrupts an active run or result. */
export function setHireCarlosHint(active: boolean) {
  if (snapshot.phase !== "idle" && snapshot.phase !== "hint") return;
  publish({ ...snapshot, phase: active ? "hint" : "idle" });
}

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Launches the easter egg from the TV. The Personal monitor owns Terminal, so
 * the camera moves there first; the command waits for that trip to settle.
 */
export function launchHireCarlos(): boolean {
  if (snapshot.phase === "running") return false;

  const active = readActiveMonitor();
  const duration = active === "personal" ? 0 : active === "work" ? NAV_MS : ENTER_MS;
  if (active !== "personal" && !scrollToOffset(MONITOR_OFFSET.personal, duration)) return false;

  if (resetTimer) window.clearTimeout(resetTimer);
  const travelMs = reducedMotion() ? 0 : duration;
  publish({
    runId: snapshot.runId + 1,
    phase: "running",
    auto: true,
    readyAt: performance.now() + travelMs + SETTLE_MS,
  });
  return true;
}

/** Gives the manually entered hidden command the same TV state as the trigger. */
export function beginManualHireCarlos() {
  if (resetTimer) window.clearTimeout(resetTimer);
  publish({ ...snapshot, phase: "running", auto: false, readyAt: performance.now() });
}

/** Shows the result on the TV briefly, then restores the visitor's local time. */
export function completeHireCarlos() {
  if (resetTimer) window.clearTimeout(resetTimer);
  publish({ ...snapshot, phase: "complete", auto: false });
  resetTimer = window.setTimeout(() => {
    resetTimer = 0;
    publish({ ...snapshot, phase: "idle", auto: false });
  }, COMPLETE_MS);
}
