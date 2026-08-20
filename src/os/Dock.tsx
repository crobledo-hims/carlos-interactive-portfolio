import { APPS } from "./apps/registry";
import type { AppId, OsAction, WinState } from "./types";

interface DockProps {
  pinned: AppId[];
  wins: WinState[];
  focusedId: number | null;
  dispatch: (a: OsAction) => void;
  openApp: (id: AppId) => void;
}

export function Dock({ pinned, wins, focusedId, dispatch, openApp }: DockProps) {
  const live = wins.filter((w) => !w.closing);
  // Running apps that aren't pinned appear after a separator, like macOS.
  const extras = live.map((w) => w.appId).filter((id, i, arr) => !pinned.includes(id) && arr.indexOf(id) === i);

  const renderItem = (id: AppId) => {
    const def = APPS[id];
    const win = live.find((w) => w.appId === id);
    const running = Boolean(win);
    const inner = (
      <>
        <span className="os-dock-label">{def.name}</span>
        <span className="os-tile" style={{ background: def.tile }}>
          {def.glyph}
        </span>
        <span className={`os-run-dot${running ? " on" : ""}`} />
      </>
    );

    if (def.href) {
      return (
        <a
          key={id}
          className="os-dock-item"
          href={def.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${def.name} (opens in a new tab)`}
        >
          {inner}
        </a>
      );
    }
    return (
      <button
        key={id}
        className={`os-dock-item${win && win.id === focusedId && !win.minimized ? " focused" : ""}`}
        aria-label={def.name}
        onClick={() => dispatch({ type: "dockClick", appId: id })}
      >
        {inner}
      </button>
    );
  };

  return (
    <div className="os-dock-wrap">
      <div className="os-dock">
        {pinned.map(renderItem)}
        {extras.length > 0 && <span className="os-dock-sep" />}
        {extras.map(renderItem)}
        {!pinned.includes("resume") && (
          <>
            <span className="os-dock-sep" />
            <button
              className="os-dock-item"
              aria-label="Open the resume viewer"
              onClick={() => openApp("resume")}
            >
              <span className="os-dock-label">Resume</span>
              <span className="os-tile os-tile-doc">📄</span>
              <span className="os-run-dot" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
