import type { ComponentType, ReactNode } from "react";

export type AppId =
  | "rex"
  | "pulse"
  | "gauge"
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
  | { type: "dockClick"; appId: AppId }
  | { type: "selectIcon"; appId: AppId | null }
  | { type: "menu"; menu: string | null }
  | { type: "about"; open: boolean };
