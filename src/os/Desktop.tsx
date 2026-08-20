import { useCallback, useEffect, useReducer, useRef } from "react";
import { APPS, SCREEN_APPS, SCREEN_LABEL } from "./apps/registry";
import { SCREEN_H, SCREEN_W } from "./constants";
import { DesktopIcons } from "./DesktopIcons";
import { Dock } from "./Dock";
import { MenuBar } from "./MenuBar";
import { Monogram } from "./icons";
import { initialOsState, osReducer } from "./osState";
import { scrollOnward } from "./pageScroll";
import { Window } from "./Window";
import type { AppId, ScreenId } from "./types";
import "./os.css";

/**
 * One desktop per monitor. Both instances stay mounted for the whole visit —
 * the overlay only animates opacity — so every open window, scroll position
 * and terminal line survives scrolling away and back.
 */
export function Desktop({ screen }: { screen: ScreenId }) {
  const [state, dispatch] = useReducer(osReducer, screen, initialOsState);
  const viewportRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(1);

  // The desktop is a fixed 1280x800 "display" scaled to fit the overlay, so
  // every window coordinate is deterministic regardless of viewport size.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const apply = () => {
      const s = Math.min((el.clientWidth * 0.96) / SCREEN_W, (el.clientHeight * 0.9) / SCREEN_H);
      scaleRef.current = s;
      el.style.setProperty("--os-scale", String(s));
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!state.menu && !state.about) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      dispatch({ type: "menu", menu: null });
      dispatch({ type: "about", open: false });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.menu, state.about]);

  const openApp = useCallback((id: AppId) => {
    const def = APPS[id];
    if (def.href) {
      window.open(def.href, "_blank", "noopener,noreferrer");
      return;
    }
    dispatch({ type: "open", appId: id });
  }, []);

  const focusedWin = state.wins.find((w) => w.id === state.focused && !w.closing && !w.minimized);
  const focusedApp = focusedWin ? APPS[focusedWin.appId] : null;
  const pinned = SCREEN_APPS[screen];

  return (
    <div className="os-viewport" ref={viewportRef}>
      <div className="os-screen" data-screen={screen}>
        <div
          className="os-wallpaper"
          onPointerDown={() => {
            if (state.selectedIcon) dispatch({ type: "selectIcon", appId: null });
          }}
        >
          <div className="os-watermark">
            <span className="os-watermark-label">{SCREEN_LABEL[screen]}</span>
            <span className="os-watermark-hint">double-click an icon · drag windows · scroll to continue</span>
          </div>
        </div>

        <DesktopIcons apps={pinned} selected={state.selectedIcon} dispatch={dispatch} openApp={openApp} />

        {state.wins.map((w) => (
          <Window
            key={w.id}
            win={w}
            focused={w.id === state.focused}
            dispatch={dispatch}
            openApp={openApp}
            scaleRef={scaleRef}
          />
        ))}

        <MenuBar
          focusedApp={focusedApp}
          wins={state.wins}
          focusedId={focusedWin ? focusedWin.id : null}
          menu={state.menu}
          dispatch={dispatch}
          openApp={openApp}
        />

        <Dock
          pinned={pinned}
          wins={state.wins}
          focusedId={state.focused}
          dispatch={dispatch}
          openApp={openApp}
        />

        {state.about && (
          <div className="os-about-scrim" onClick={() => dispatch({ type: "about", open: false })}>
            <div className="os-about" onClick={(e) => e.stopPropagation()}>
              <div className="os-about-mark">
                <Monogram size={30} />
              </div>
              <h2>PortfolioOS</h2>
              <p className="os-about-ver">Version 1.0 · {SCREEN_LABEL[screen]} display</p>
              <dl className="os-about-specs">
                <dt>Built with</dt>
                <dd>React 19, three.js, and a lot of hand-written CSS</dd>
                <dt>Display</dt>
                <dd>
                  {SCREEN_W} × {SCREEN_H}, scaled to fit
                </dd>
                <dt>Apps</dt>
                <dd>{pinned.map((id) => APPS[id].name).join(", ")}</dd>
              </dl>
              <div className="os-about-actions">
                <button
                  onClick={() => {
                    dispatch({ type: "about", open: false });
                    scrollOnward();
                  }}
                >
                  Back to the desk
                </button>
                <button className="primary" onClick={() => dispatch({ type: "about", open: false })}>
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
