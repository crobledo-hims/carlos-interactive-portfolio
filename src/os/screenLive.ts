import { createContext, useContext } from "react";

/**
 * True once this monitor has actually been on camera.
 *
 * Both desktops mount at page load, long before the visitor scrolls to them,
 * so "the app just opened" is not the same as "someone can see it". Scripted
 * intros (the Rex demo) wait for this latch so the story starts when the
 * visitor arrives, not while the camera is still on the wide shot.
 */
export const ScreenLiveContext = createContext(true);

export function useScreenLive() {
  return useContext(ScreenLiveContext);
}
