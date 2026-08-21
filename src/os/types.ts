import type { ComponentType, ReactNode } from "react";

export type AppId =
  | "rex"
  | "beacon"
  | "lens"
  | "relay"
  | "resume"
  | "linkedin"
  | "mail"
  | "terminal";

export type ScreenId = "left" | "right";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Props every app window body receives. */
export interface AppProps {
  openApp: (id: AppId) => void;
}

export interface AppDef {
  id: AppId;
  name: string;
  /** Shown under the window title and in the About panel. */
  subtitle: string;
  /**
   * One-sentence product description, used wherever an app is described rather
   * than merely labelled. The About panel falls back to the subtitle for apps
   * that carry no description of their own.
   */
  description?: string;
  /** CSS background for the rounded icon tile. */
  tile: string;
  glyph: ReactNode;
  /** External apps open a new tab instead of a window. */
  href?: string;
  rect: Rect;
  minW: number;
  minH: number;
  Component: ComponentType<AppProps> | null;
}

export interface WinState {
  id: number;
  appId: AppId;
  rect: Rect;
  z: number;
  minimized: boolean;
  zoomed: boolean;
  /** Geometry to restore when un-zooming. */
  restore: Rect | null;
  /** True while the close animation plays; removed on animationend. */
  closing: boolean;
}

export interface OsState {
  wins: WinState[];
  nextId: number;
  topZ: number;
  focused: number | null;
  selectedIcon: AppId | null;
  /** id of the open menu-bar menu, if any. */
  menu: string | null;
  about: boolean;
  /** Overlay is too small for floating windows — open them maximized. */
  compact: boolean;
  /**
   * Bumped whenever a window is deliberately opened or brought forward, so the
   * window can move keyboard focus into itself exactly once per such action.
   * Starts at 0: the boot window must never steal focus at page load.
   */
  focusEpoch: number;
}

export type OsAction =
  | { type: "open"; appId: AppId }
  | { type: "close"; id: number }
  | { type: "remove"; id: number }
  | { type: "focus"; id: number }
  | { type: "minimize"; id: number }
  | { type: "restore"; id: number }
  | { type: "zoom"; id: number }
  | { type: "setRect"; id: number; rect: Rect }
  | { type: "selectIcon"; appId: AppId | null }
  | { type: "menu"; menu: string | null }
  | { type: "about"; open: boolean }
  | { type: "compact"; value: boolean };
