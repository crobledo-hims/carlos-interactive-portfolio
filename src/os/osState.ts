import { APPS } from "./apps/registry";
import { BASE_Z, DOCK_RESERVE, MENUBAR_H, SCREEN_H, SCREEN_W } from "./constants";
import type { OsAction, OsState, Rect, ScreenId, WinState } from "./types";

/** Keep a window inside the screen, below the menu bar and above the dock. */
export function clampRect(r: Rect): Rect {
  const w = Math.min(r.w, SCREEN_W - 16);
  const h = Math.min(r.h, SCREEN_H - MENUBAR_H - 16);
  const x = Math.min(Math.max(r.x, -w + 160), SCREEN_W - 160);
  const y = Math.min(Math.max(r.y, MENUBAR_H + 4), SCREEN_H - 48);
  return { x, y, w, h };
}

function cascade(rect: Rect, n: number): Rect {
  const off = (n % 5) * 22;
  return clampRect({ ...rect, x: rect.x + off, y: rect.y + off });
}

function zoomedRect(): Rect {
  return {
    x: 10,
    y: MENUBAR_H + 8,
    w: SCREEN_W - 20,
    h: SCREEN_H - MENUBAR_H - DOCK_RESERVE - 14,
  };
}

/** Highest-z window that is actually on screen. */
function topmost(wins: WinState[], exclude?: number): number | null {
  let best: WinState | null = null;
  for (const w of wins) {
    if (w.id === exclude || w.closing || w.minimized) continue;
    if (!best || w.z > best.z) best = w;
  }
  return best ? best.id : null;
}

function raise(state: OsState, id: number): OsState {
  const z = state.topZ + 1;
  return {
    ...state,
    topZ: z,
    focused: id,
    menu: null,
    wins: state.wins.map((w) => (w.id === id ? { ...w, z, minimized: false } : w)),
  };
}

function patch(state: OsState, id: number, fn: (w: WinState) => WinState): OsState {
  return { ...state, wins: state.wins.map((w) => (w.id === id ? fn(w) : w)) };
}

export function initialOsState(screen: ScreenId): OsState {
  // Each screen boots with one window already open so the desk never looks dead.
  const bootApp = screen === "left" ? "rex" : "resume";
  const def = APPS[bootApp];
  return {
    wins: [
      {
        id: 1,
        appId: bootApp,
        rect: clampRect(def.rect),
        z: BASE_Z + 1,
        minimized: false,
        zoomed: false,
        restore: null,
        closing: false,
      },
    ],
    nextId: 2,
    topZ: BASE_Z + 1,
    focused: 1,
    selectedIcon: null,
    menu: null,
    about: false,
  };
}

export function osReducer(state: OsState, action: OsAction): OsState {
  switch (action.type) {
    case "open": {
      const existing = state.wins.find((w) => w.appId === action.appId && !w.closing);
      if (existing) return raise(state, existing.id);
      const def = APPS[action.appId];
      const z = state.topZ + 1;
      const win: WinState = {
        id: state.nextId,
        appId: action.appId,
        rect: cascade(def.rect, state.wins.length),
        z,
        minimized: false,
        zoomed: false,
        restore: null,
        closing: false,
      };
      return {
        ...state,
        wins: [...state.wins, win],
        nextId: state.nextId + 1,
        topZ: z,
        focused: win.id,
        menu: null,
      };
    }

    case "focus":
      return state.focused === action.id && !state.menu ? state : raise(state, action.id);

    case "close": {
      const wins = state.wins.map((w) => (w.id === action.id ? { ...w, closing: true } : w));
      return { ...state, wins, focused: topmost(wins, action.id), menu: null };
    }

    case "remove":
      return { ...state, wins: state.wins.filter((w) => w.id !== action.id) };

    case "minimize": {
      const wins = state.wins.map((w) => (w.id === action.id ? { ...w, minimized: true } : w));
      return { ...state, wins, focused: topmost(wins, action.id), menu: null };
    }

    case "restore":
      return raise(state, action.id);

    case "zoom": {
      const next = patch(state, action.id, (w) =>
        w.zoomed
          ? { ...w, zoomed: false, rect: w.restore ?? w.rect, restore: null }
          : { ...w, zoomed: true, restore: w.rect, rect: zoomedRect() },
      );
      return raise(next, action.id);
    }

    case "setRect":
      return patch(state, action.id, (w) => ({
        ...w,
        rect: clampRect(action.rect),
        zoomed: false,
      }));

    case "dockClick": {
      const win = state.wins.find((w) => w.appId === action.appId && !w.closing);
      if (!win) return osReducer(state, { type: "open", appId: action.appId });
      if (win.minimized) return raise(state, win.id);
      if (state.focused === win.id) {
        const wins = state.wins.map((w) => (w.id === win.id ? { ...w, minimized: true } : w));
        return { ...state, wins, focused: topmost(wins, win.id), menu: null };
      }
      return raise(state, win.id);
    }

    case "selectIcon":
      return { ...state, selectedIcon: action.appId, menu: null };

    case "menu":
      return { ...state, menu: action.menu };

    case "about":
      return { ...state, about: action.open, menu: null };

    default:
      return state;
  }
}
