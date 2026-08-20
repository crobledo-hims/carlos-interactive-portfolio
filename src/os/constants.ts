// The desktop renders at a fixed logical resolution and is scaled to fit the
// overlay, exactly like a real display. Every window coordinate below is in
// these logical pixels, so layout is deterministic on any viewport.
export const SCREEN_W = 1280;
export const SCREEN_H = 800;

export const MENUBAR_H = 26;
export const DOCK_RESERVE = 84; // space the dock occupies at the bottom

// Windows stack from here; the dock and menu bar sit above them.
export const BASE_Z = 10;
