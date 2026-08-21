import { APPS } from "./apps/registry";
import { BASE_Z, DOCK_RESERVE, MENUBAR_H, SCREEN_H, SCREEN_W } from "./constants";
import type { OsAction, OsState, Rect, ScreenId, WinState } from "./types";

/** Smallest slice of a window that must stay on screen so it can be dragged back. */
const KEEP_VISIBLE = 200;

/** Keep a window inside the screen, below the menu bar and above the dock. */
export function clampRect(r: Rect): Rect {
  const w = Math.min(r.w, SCREEN_W - 16);
  const h = Math.min(r.h, SCREEN_H - MENUBAR_H - 16);
  const x = Math.min(Math.max(r.x, -w + KEEP_VISIBLE), SCREEN_W - KEEP_VISIBLE);
  const y = Math.min(Math.max(r.y, MENUBAR_H + 4), SCREEN_H - 48);
  return { x, y, w, h };
}

function cascade(rect: Rect, n: number): Rect {
  const off = (n % 5) * 20;
  return clampRect({ ...rect, x: rect.x + off, y: rect.y + off });
}

export function zoomedRect(): Rect {
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

/**
 * Bring a window forward. `takeFocus` is true for deliberate actions — opening
 * an app, restoring it from the dock, zooming it — which should also move
 * keyboard focus into the window. Click-to-front does not: the browser has
 * already focused whatever was clicked.
 */
function raise(state: OsState, id: number, takeFocus = false): OsState {
  const z = state.topZ + 1;
  return {
    ...state,
    topZ: z,
    focused: id,
    menu: null,
    focusEpoch: takeFocus ? state.focusEpoch + 1 : state.focusEpoch,
    wins: state.wins.map((w) => (w.id === id ? { ...w, z, minimized: false } : w)),
  };
}

function patch(state: OsState, id: number, fn: (w: WinState) => WinState): OsState {
  return { ...state, wins: state.wins.map((w) => (w.id === id ? fn(w) : w)) };
}

export function initialOsState(screen: ScreenId): OsState {
  // Each screen boots with one window already open so the desk never looks dead.
  const bootApp = screen === "left" ? "cadence" : "resume";
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
    compact: false,
    focusEpoch: 0,
  };
}

export function osReducer(state: OsState, action: OsAction): OsState {
  switch (action.type) {
    case "open": {
      // A single click on a dock or desktop icon opens the app; if it is
      // already open the same click focuses it and raises it to the front.
      const existing = state.wins.find((w) => w.appId === action.appId && !w.closing);
      if (existing) return raise(state, existing.id, true);
      const def = APPS[action.appId];
      const z = state.topZ + 1;
      const placed = cascade(def.rect, state.wins.length);
      const win: WinState = {
        id: state.nextId,
        appId: action.appId,
        rect: state.compact ? zoomedRect() : placed,
        z,
        minimized: false,
        zoomed: state.compact,
        restore: state.compact ? placed : null,
        closing: false,
      };
      return {
        ...state,
        wins: [...state.wins, win],
        nextId: state.nextId + 1,
        topZ: z,
        focused: win.id,
        menu: null,
        focusEpoch: state.focusEpoch + 1,
      };
    }

    case "focus":
      return state.focused === action.id && !state.menu ? state : raise(state, action.id);

    case "close": {
      const wins = state.wins.map((w) => (w.id === action.id ? { ...w, closing: true } : w));
      return { ...state, wins, focused: topmost(wins, action.id), menu: null };
    }

    case "remove":
      return state.wins.some((w) => w.id === action.id)
        ? { ...state, wins: state.wins.filter((w) => w.id !== action.id) }
        : state;

    case "minimize": {
      const wins = state.wins.map((w) => (w.id === action.id ? { ...w, minimized: true } : w));
      return { ...state, wins, focused: topmost(wins, action.id), menu: null };
    }

    case "restore":
      return raise(state, action.id, true);

    case "zoom": {
      const next = patch(state, action.id, (w) =>
        w.zoomed
          ? { ...w, zoomed: false, rect: w.restore ?? w.rect, restore: null }
          : { ...w, zoomed: true, restore: w.rect, rect: zoomedRect() },
      );
      return raise(next, action.id, true);
    }

    case "setRect":
      return patch(state, action.id, (w) => ({
        ...w,
        rect: clampRect(action.rect),
        zoomed: false,
      }));

    case "selectIcon":
      return { ...state, selectedIcon: action.appId, menu: null };

    case "menu":
      return { ...state, menu: action.menu };

    case "about":
      return { ...state, about: action.open, menu: null };

    case "compact": {
      if (state.compact === action.value) return state;
      const next = { ...state, compact: action.value };
      // Entering compact maximizes whatever the visitor is looking at.
      if (!action.value || state.focused === null) return next;
      return patch(next, state.focused, (w) =>
        w.zoomed ? w : { ...w, zoomed: true, restore: w.rect, rect: zoomedRect() },
      );
    }

    default:
      return state;
  }
}
