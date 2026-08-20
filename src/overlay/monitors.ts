import { overlayState } from "../overlayState";
import { PERSONAL_DOCK_OFFSET, WORK_DOCK_OFFSET } from "../scene/CameraRig";

export type MonitorId = "work" | "personal";

/** Left to right, the way the monitors actually sit on the desk. */
export const MONITOR_ORDER: MonitorId[] = ["work", "personal"];

export const MONITOR_LABEL: Record<MonitorId, string> = {
  work: "Work",
  personal: "Personal",
};

/** Scroll offset that docks the camera on each monitor. */
export const MONITOR_OFFSET: Record<MonitorId, number> = {
  work: WORK_DOCK_OFFSET,
  personal: PERSONAL_DOCK_OFFSET,
};

/** 1-based position, for accessible names and status announcements. */
export function monitorIndex(id: MonitorId) {
  return MONITOR_ORDER.indexOf(id) + 1;
}

/**
 * Which monitor the camera is docked on right now, or null while it is between
 * them or still in the intro.
 *
 * Reads the same per-frame alphas the desktop overlays use, and shares their
 * 0.5 threshold, so "active" here and "interactive" in useDrivenOpacity can
 * never disagree.
 */
export function readActiveMonitor(): MonitorId | null {
  if (overlayState.left > 0.5) return "work";
  if (overlayState.right > 0.5) return "personal";
  return null;
}
