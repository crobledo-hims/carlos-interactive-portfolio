import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { overlayState } from "../overlayState";
import { APPS, SCREEN_APPS, SCREEN_LABEL } from "./apps/registry";
import {
  ARRIVED_ALPHA,
  COMPACT_H,
  COMPACT_W,
  FIT_H,
  FIT_W,
  SCREEN_H,
  SCREEN_W,
  SETTLE_MS,
  SETTLE_POLL_MS,
} from "./constants";
import { DesktopIcons } from "./DesktopIcons";
import { Dock } from "./Dock";
import { MenuBar } from "./MenuBar";
import { Monogram } from "./icons";
import { initialOsState, osReducer } from "./osState";
import { scrollOnward } from "./pageScroll";
import { ScreenLiveContext } from "./screenLive";
import { Window } from "./Window";
import type { AppId, ScreenId } from "./types";
import "./os.css";
import { getHireCarlosSnapshot, subscribeHireCarlos } from "../easterEgg/hireCarlos";

/**
 * One desktop per monitor. Both instances stay mounted for the whole visit —
 * the overlay only animates opacity — so every open window, scroll position
 * and terminal line survives scrolling away and back.
 */
export function Desktop({ screen }: { screen: ScreenId }) {
  const [state, dispatch] = useReducer(osReducer, screen, initialOsState);
  const viewportRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(1);
  const compactRef = useRef(false);
  const [live, setLive] = useState(false);
  const lastHireRun = useRef(0);

  // The TV easter egg belongs to the Personal desktop. Open (or raise) its
  // Terminal as soon as the launch happens; Terminal itself waits until the
  // camera has arrived before it starts typing.
  useEffect(() => {
    if (screen !== "right") return;
    const receive = () => {
      const event = getHireCarlosSnapshot();
      if (!event.auto || event.phase !== "running" || event.runId <= lastHireRun.current) return;
      lastHireRun.current = event.runId;
      dispatch({ type: "open", appId: "terminal" });
    };
    receive();
    return subscribeHireCarlos(receive);
  }, [screen]);

  // The desktop is a fixed logical display scaled to fit the overlay, so every
  // window coordinate is deterministic regardless of viewport size — and one
  // logical pixel grows with the viewport instead of staying at 1 CSS px.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const apply = () => {
      const s = Math.min((el.clientWidth * FIT_W) / SCREEN_W, (el.clientHeight * FIT_H) / SCREEN_H);
      scaleRef.current = s;
      el.style.setProperty("--os-scale", String(s));
      const compact = el.clientWidth < COMPACT_W || el.clientHeight < COMPACT_H;
      if (compact !== compactRef.current) {
        compactRef.current = compact;
        dispatch({ type: "compact", value: compact });
      }
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Latch "this monitor has arrived and the camera has stopped moving".
  //
  // Alpha crossing a threshold is not enough on its own: it crosses while the
  // camera is still gliding in, and a scripted intro that started there would
  // play over the tail of the movement. So the alpha has to *hold* — see
  // ARRIVED_ALPHA / SETTLE_MS. Polled cheaply, and only until the latch flips.
  useEffect(() => {
    if (live) return;
    let heldSince = 0;
    const id = setInterval(() => {
      if (overlayState[screen] < ARRIVED_ALPHA) {
        heldSince = 0; // turned away again; the hold starts over
        return;
      }
      const now = performance.now();
      if (!heldSince) heldSince = now;
      else if (now - heldSince >= SETTLE_MS) setLive(true);
    }, SETTLE_POLL_MS);
    return () => clearInterval(id);
  }, [live, screen]);

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

  // Desktop icons and dock items register themselves so a closing window can
  // hand focus back to whatever opened it.
  const iconRefs = useRef<Partial<Record<AppId, HTMLElement | null>>>({});
  const dockRefs = useRef<Partial<Record<AppId, HTMLElement | null>>>({});

  const registerIcon = useCallback((id: AppId, el: HTMLElement | null) => {
    iconRefs.current[id] = el;
  }, []);
  const registerDock = useCallback((id: AppId, el: HTMLElement | null) => {
    dockRefs.current[id] = el;
  }, []);

  // A closing window asks for its opener back, but the focus itself has to wait
  // for the commit that hides the window.
  const pendingFocus = useRef<AppId | null>(null);

  const focusOpener = useCallback((id: AppId) => {
    pendingFocus.current = id;
  }, []);

  // Restoring focus has to be the *last* thing that touches it in this commit,
  // because two effects in Window.tsx move focus first: the closing window
  // blurs itself on the way to hidden, and whatever window is left on top may
  // pull focus in on its focus epoch. Both are child effects, so running this
  // as a plain effect on the parent puts it after both of them — and unlike the
  // requestAnimationFrame this replaces, it still runs in a background tab,
  // where frame callbacks are never delivered.
  useEffect(() => {
    const id = pendingFocus.current;
    if (id === null) return;
    pendingFocus.current = null;
    const el = iconRefs.current[id] ?? dockRefs.current[id];
    el?.focus({ preventScroll: true });
  });

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
            <span className="os-watermark-hint">click an icon · drag windows · scroll to continue</span>
          </div>
        </div>

        <DesktopIcons
          apps={pinned}
          selected={state.selectedIcon}
          dispatch={dispatch}
          openApp={openApp}
          registerIcon={registerIcon}
        />

        <ScreenLiveContext value={live}>
          {state.wins.map((w) => (
            <Window
              key={w.id}
              win={w}
              focused={w.id === state.focused}
              dispatch={dispatch}
              openApp={openApp}
              scaleRef={scaleRef}
              focusEpoch={state.focusEpoch}
              onClosed={focusOpener}
            />
          ))}
        </ScreenLiveContext>

        <MenuBar
          focusedApp={focusedApp}
          wins={state.wins}
          focusedId={focusedWin ? focusedWin.id : null}
          menu={state.menu}
          dispatch={dispatch}
          openApp={openApp}
          onClosed={focusOpener}
        />

        <Dock
          pinned={pinned}
          wins={state.wins}
          focusedId={state.focused}
          openApp={openApp}
          registerDock={registerDock}
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
                <dd>
                  <ul className="os-about-apps">
                    {pinned.map((id) => (
                      <li key={id}>
                        <b>{APPS[id].name}</b>
                        {APPS[id].description ?? APPS[id].subtitle}
                      </li>
                    ))}
                  </ul>
                </dd>
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
