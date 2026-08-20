import { useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { getLocalTime, subscribeLocalTime } from "../lib/localClock";
import { APPS } from "./apps/registry";
import { BatteryGlyph, ChevronDown, ControlGlyph, Monogram, SearchGlyph, WifiGlyph } from "./icons";
import { scrollOnward } from "./pageScroll";
import type { AppDef, AppId, OsAction, WinState } from "./types";

interface MenuItem {
  label: string;
  shortcut?: string;
  disabled?: boolean;
  checked?: boolean;
  sep?: boolean;
  run?: () => void;
}

interface MenuGroup {
  id: string;
  label: ReactNode;
  className?: string;
  items: MenuItem[];
}

// Shares src/lib/localClock with the scene's wall TV: one timer, one snapshot,
// so the two clocks can never disagree across a minute boundary. Renders once
// per minute; the date line stays fresh because midnight is a minute change.
function Clock() {
  const time = useSyncExternalStore(subscribeLocalTime, getLocalTime, getLocalTime);
  const date = new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  return (
    <span className="os-clock">
      {date} {time}
    </span>
  );
}

interface MenuBarProps {
  focusedApp: AppDef | null;
  wins: WinState[];
  focusedId: number | null;
  menu: string | null;
  dispatch: (a: OsAction) => void;
  openApp: (id: AppId) => void;
}

export function MenuBar({ focusedApp, wins, focusedId, menu, dispatch, openApp }: MenuBarProps) {
  const live = wins.filter((w) => !w.closing);
  const appName = focusedApp ? focusedApp.name : "Desk";

  const close = () => dispatch({ type: "menu", menu: null });
  const withClose = (fn: () => void) => () => {
    fn();
    close();
  };

  const groups: MenuGroup[] = [
    {
      id: "logo",
      label: <Monogram />,
      className: "os-menu-logo",
      items: [
        { label: "About This Portfolio", run: () => dispatch({ type: "about", open: true }) },
        { label: "", sep: true },
        { label: "Back to the desk", shortcut: "⌄", run: scrollOnward },
        { label: "", sep: true },
        { label: "System Settings…", disabled: true },
        { label: "Sleep", disabled: true },
        { label: "Restart…", disabled: true },
      ],
    },
    {
      id: "app",
      label: <b>{appName}</b>,
      items: [
        { label: `About ${appName}`, run: () => dispatch({ type: "about", open: true }) },
        { label: "", sep: true },
        { label: "Settings…", shortcut: "⌘,", disabled: true },
        { label: "Services", disabled: true },
        { label: "", sep: true },
        {
          label: `Hide ${appName}`,
          shortcut: "⌘H",
          disabled: focusedId === null,
          run: () => focusedId !== null && dispatch({ type: "minimize", id: focusedId }),
        },
      ],
    },
    {
      id: "file",
      label: "File",
      items: [
        { label: "Open Resume", run: () => openApp("resume") },
        { label: "Open Terminal", run: () => openApp("terminal") },
        { label: "", sep: true },
        {
          label: "Close Window",
          shortcut: "⌘W",
          disabled: focusedId === null,
          run: () => focusedId !== null && dispatch({ type: "close", id: focusedId }),
        },
        {
          label: "Minimize",
          shortcut: "⌘M",
          disabled: focusedId === null,
          run: () => focusedId !== null && dispatch({ type: "minimize", id: focusedId }),
        },
      ],
    },
    {
      id: "edit",
      label: "Edit",
      items: [
        { label: "Undo", shortcut: "⌘Z", disabled: true },
        { label: "Redo", shortcut: "⇧⌘Z", disabled: true },
        { label: "", sep: true },
        { label: "Cut", shortcut: "⌘X", disabled: true },
        { label: "Copy", shortcut: "⌘C", disabled: true },
        { label: "Paste", shortcut: "⌘V", disabled: true },
      ],
    },
    {
      id: "view",
      label: "View",
      items: [
        {
          label: "Zoom Window",
          disabled: focusedId === null,
          run: () => focusedId !== null && dispatch({ type: "zoom", id: focusedId }),
        },
        {
          label: "Show All Windows",
          disabled: !live.some((w) => w.minimized),
          run: () => live.filter((w) => w.minimized).forEach((w) => dispatch({ type: "restore", id: w.id })),
        },
        { label: "", sep: true },
        { label: "Back to the desk", shortcut: "⌄", run: scrollOnward },
      ],
    },
    {
      id: "window",
      label: "Window",
      items: [
        {
          label: "Minimize All",
          disabled: live.length === 0,
          run: () => live.forEach((w) => dispatch({ type: "minimize", id: w.id })),
        },
        { label: "", sep: true },
        ...live.map((w) => ({
          label: APPS[w.appId].name,
          checked: w.id === focusedId,
          run: () => dispatch({ type: "restore", id: w.id }),
        })),
      ],
    },
    {
      id: "help",
      label: "Help",
      items: [
        { label: "This is a portfolio, not macOS", disabled: true },
        { label: "", sep: true },
        { label: "Open the Terminal", run: () => openApp("terminal") },
        { label: "Email Carlos", run: () => openApp("mail") },
      ],
    },
  ];

  return (
    <>
      {menu && <div className="os-menu-scrim" onClick={close} />}
      <div className="os-menubar">
        <div className="os-menus">
          {groups.map((g) => (
            <div className="os-menu" key={g.id}>
              <button
                className={`os-menu-title${menu === g.id ? " open" : ""} ${g.className ?? ""}`}
                onClick={() => dispatch({ type: "menu", menu: menu === g.id ? null : g.id })}
                onMouseEnter={() => menu && menu !== g.id && dispatch({ type: "menu", menu: g.id })}
              >
                {g.label}
              </button>
              {menu === g.id && (
                <div className="os-menu-drop">
                  {g.items.map((item, i) =>
                    item.sep ? (
                      <div className="os-menu-sep" key={`sep${i}`} />
                    ) : (
                      <button
                        key={item.label + i}
                        className={`os-menu-item${item.disabled ? " disabled" : ""}`}
                        disabled={item.disabled}
                        onClick={item.run ? withClose(item.run) : close}
                      >
                        <span className="os-menu-check">{item.checked ? "✓" : ""}</span>
                        <span className="os-menu-label">{item.label}</span>
                        {item.shortcut && <span className="os-menu-short">{item.shortcut}</span>}
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="os-status">
          <button className="os-back" onClick={scrollOnward} title="Continue scrolling the page">
            <ChevronDown />
            back to desk
          </button>
          <span className="os-status-icon">
            <ControlGlyph />
          </span>
          <span className="os-status-icon">
            <SearchGlyph />
          </span>
          <span className="os-status-icon">
            <WifiGlyph />
          </span>
          <span className="os-status-icon">
            <BatteryGlyph />
          </span>
          <Clock />
        </div>
      </div>
    </>
  );
}
