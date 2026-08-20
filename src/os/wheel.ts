import type { WheelEvent } from "react";

/**
 * Wheel contract for the whole OS.
 *
 * An application window is a hard wheel boundary. Every wheel event that
 * starts anywhere inside one — titlebar, padding, a scroller that has hit its
 * edge, a region that never scrolls at all — is consumed by the window and
 * never reaches the monitor overlay, so it can never move the 3D scene.
 * Trackpad momentum and single high-delta gestures are contained by the same
 * rule, because containment does not depend on how far the inner scroller can
 * still travel.
 *
 * A visitor leaves a monitor by scrolling the desktop *outside* an application
 * window, by "Back to the desk", or by other explicit navigation.
 *
 * Applied once, on the root of the shared Window component (src/os/Window.tsx),
 * so every present and future app inherits it. Individual scrollers need no
 * wheel handler of their own.
 */
export function containWheelWithinWindow(e: WheelEvent<HTMLElement>) {
  // stopPropagation only. preventDefault would cancel the browser's native
  // scrolling of whichever container sits under the pointer, which is exactly
  // the behaviour apps still need.
  e.stopPropagation();
}
