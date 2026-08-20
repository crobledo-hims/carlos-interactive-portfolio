// Shared mutable state written by the camera rig every frame and read by DOM
// overlays on their own rAF loop — avoids React re-renders at 60fps.
export const overlayState = {
  left: 0, // 0..1 opacity of the left-monitor overlay
  right: 0, // 0..1 opacity of the right-monitor overlay
  intro: 1, // 0..1 opacity of the intro hero layer
  // drei ScrollControls' scroll container; overlays forward wheel events here
  // so the page keeps scrolling while an overlay is interactive.
  scrollEl: null as HTMLElement | null,
};
