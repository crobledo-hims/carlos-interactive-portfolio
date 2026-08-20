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
