import { memo, useRef } from "react";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import { APPS } from "./apps/registry";
import { MENUBAR_H, SCREEN_H, SCREEN_W } from "./constants";
import { keepWheelIfScrollable } from "./ScrollArea";
import type { AppId, OsAction, Rect, WinState } from "./types";

const HANDLES = ["n", "s", "e", "w", "ne", "nw", "se", "sw"] as const;

function moved(orig: Rect, dx: number, dy: number): Rect {
  return {
    ...orig,
    x: Math.min(Math.max(orig.x + dx, -orig.w + 160), SCREEN_W - 160),
    y: Math.min(Math.max(orig.y + dy, MENUBAR_H + 4), SCREEN_H - 48),
  };
}

function resized(orig: Rect, dir: string, dx: number, dy: number, minW: number, minH: number): Rect {
  let { x, y, w, h } = orig;
  if (dir.includes("e")) w = Math.max(minW, Math.min(orig.w + dx, SCREEN_W - orig.x - 6));
  if (dir.includes("s")) h = Math.max(minH, Math.min(orig.h + dy, SCREEN_H - orig.y - 6));
  if (dir.includes("w")) {
    const nw = Math.max(minW, Math.min(orig.w - dx, orig.x + orig.w - 6));
    x = orig.x + orig.w - nw;
    w = nw;
  }
  if (dir.includes("n")) {
    const nh = Math.max(minH, Math.min(orig.h - dy, orig.y + orig.h - MENUBAR_H - 6));
    y = orig.y + orig.h - nh;
    h = nh;
  }
  return { x, y, w, h };
}

interface WindowProps {
  win: WinState;
  focused: boolean;
  dispatch: (a: OsAction) => void;
  openApp: (id: AppId) => void;
  /** Live scale of the logical screen, so pointer deltas convert correctly. */
  scaleRef: RefObject<number>;
}

function WindowImpl({ win, focused, dispatch, openApp, scaleRef }: WindowProps) {
  const def = APPS[win.appId];
  const rootRef = useRef<HTMLDivElement>(null);
  const App = def.Component;

  const beginDrag = (e: ReactPointerEvent, dir: "move" | (typeof HANDLES)[number]) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const el = rootRef.current;
    if (!el) return;
    if (!focused) dispatch({ type: "focus", id: win.id });

    const scale = scaleRef.current || 1;
    const sx = e.clientX;
    const sy = e.clientY;
    const orig = win.rect;
    let next = orig;

    const onMove = (ev: globalThis.PointerEvent) => {
      const dx = (ev.clientX - sx) / scale;
      const dy = (ev.clientY - sy) / scale;
      next = dir === "move" ? moved(orig, dx, dy) : resized(orig, dir, dx, dy, def.minW, def.minH);
      el.style.left = `${next.x}px`;
      el.style.top = `${next.y}px`;
      el.style.width = `${next.w}px`;
      el.style.height = `${next.h}px`;
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.classList.remove("os-dragging");
      if (next !== orig) dispatch({ type: "setRect", id: win.id, rect: next });
    };

    document.body.classList.add("os-dragging");
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const cls = [
    "os-win",
    focused ? "focused" : "",
    win.minimized ? "min" : "",
    win.closing ? "closing" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      ref={rootRef}
      className={cls}
      style={{ left: win.rect.x, top: win.rect.y, width: win.rect.w, height: win.rect.h, zIndex: win.z }}
      aria-label={def.name}
      onPointerDown={() => {
        if (!focused) dispatch({ type: "focus", id: win.id });
      }}
      onAnimationEnd={() => {
        if (win.closing) dispatch({ type: "remove", id: win.id });
      }}
    >
      <header
        className="os-titlebar"
        onPointerDown={(e) => beginDrag(e, "move")}
        onDoubleClick={() => dispatch({ type: "zoom", id: win.id })}
      >
        <div className="os-lights" onPointerDown={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
          <button
            className="os-light close"
            title="Close"
            aria-label={`Close ${def.name}`}
            onClick={() => dispatch({ type: "close", id: win.id })}
          >
            <svg viewBox="0 0 10 10" aria-hidden="true">
              <path d="M3 3l4 4M7 3l-4 4" />
            </svg>
          </button>
          <button
            className="os-light min"
            title="Minimize"
            aria-label={`Minimize ${def.name}`}
            onClick={() => dispatch({ type: "minimize", id: win.id })}
          >
            <svg viewBox="0 0 10 10" aria-hidden="true">
              <path d="M2.6 5h4.8" />
            </svg>
          </button>
          <button
            className="os-light zoom"
            title="Zoom"
            aria-label={`Zoom ${def.name}`}
            onClick={() => dispatch({ type: "zoom", id: win.id })}
          >
            <svg viewBox="0 0 10 10" aria-hidden="true">
              <path d="M5 2.4v5.2M2.4 5h5.2" />
            </svg>
          </button>
        </div>
        <div className="os-title">
          <span className="os-title-name">{def.name}</span>
          <span className="os-title-sub">{def.subtitle}</span>
        </div>
      </header>

      <div className="os-win-body" onWheel={keepWheelIfScrollable}>
        {App ? <App openApp={openApp} /> : null}
      </div>

      {HANDLES.map((dir) => (
        <div key={dir} className={`os-grab ${dir}`} onPointerDown={(e) => beginDrag(e, dir)} />
      ))}
    </section>
  );
}

export const Window = memo(WindowImpl);
