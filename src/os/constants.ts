// The desktop renders at a fixed logical resolution and is scaled to fit the
// overlay, exactly like a real display. Every window coordinate below is in
// these logical pixels, so layout is deterministic on any viewport.
//
// The logical resolution is deliberately modest: the screen always occupies
// ~92% of the overlay's height, so a smaller logical canvas means every
// logical pixel lands on more real pixels. At a 1280x720 browser viewport the
// scale works out to ~0.95, which keeps primary interface text at an apparent
// 13-14px without any browser zoom.
export const SCREEN_W = 1160;
export const SCREEN_H = 700;

/** Fraction of the overlay the screen is allowed to fill. */
export const FIT_W = 0.965;
export const FIT_H = 0.925;

export const MENUBAR_H = 28;
export const DOCK_RESERVE = 84; // space the dock occupies at the bottom

/** Below this overlay width (CSS px) new windows open maximized. */
export const COMPACT_W = 760;
export const COMPACT_H = 480;

/** Windows stack from here; the dock and menu bar sit above them. */
export const BASE_Z = 10;

/** Pointer travel (CSS px) past which a press counts as a drag, not a click. */
export const DRAG_SLOP = 6;

/**
 * When a monitor counts as "arrived and settled".
 *
 * The camera rig writes each overlay's alpha every frame. Rather than latching
 * on the first frame that crosses a threshold — which fires while the camera is
 * still gliding in — a monitor is considered live only once its alpha has held
 * at ARRIVED_ALPHA continuously for SETTLE_MS. That single rule covers every
 * way a visitor can arrive: the Enter Workspace trip, the monitor switcher, and
 * plain scrolling all end with the alpha pinned high and the camera at rest.
 * Turning away mid-settle drops the alpha and resets the hold.
 */
export const ARRIVED_ALPHA = 0.99;
export const SETTLE_MS = 600;
/** How often the hold is sampled. Cheap, and only until the latch flips. */
export const SETTLE_POLL_MS = 100;
