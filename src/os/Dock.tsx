import { APPS } from "./apps/registry";
import { useActivate } from "./useActivate";
import type { AppDef, AppId, WinState } from "./types";

interface DockItemProps {
  def: AppDef;
  running: boolean;
  focused: boolean;
  label?: string;
  onActivate: () => void;
  register?: (id: AppId, el: HTMLElement | null) => void;
}

function DockItem({ def, running, focused, label, onActivate, register }: DockItemProps) {
  const handlers = useActivate(def.href ? () => undefined : onActivate, Boolean(def.href));
  const name = label ?? def.name;

  const inner = (
    <>
      <span className="os-dock-label">{name}</span>
      <span className="os-tile" style={{ background: def.tile }}>
        {def.glyph}
      </span>
      <span className={`os-run-dot${running ? " on" : ""}`} />
    </>
  );

  if (def.href) {
    return (
      <a
        ref={(el) => register?.(def.id, el)}
        className="os-dock-item"
        href={def.href}
        target="_blank"
        rel="noopener noreferrer"
        draggable={false}
        aria-label={`${name} — opens in a new tab`}
        {...handlers}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      ref={(el) => register?.(def.id, el)}
      className={`os-dock-item${focused ? " focused" : ""}`}
      type="button"
      aria-label={running ? `${name} — open, bring to front` : `Open ${name}`}
      {...handlers}
    >
      {inner}
    </button>
  );
}

interface DockProps {
  pinned: AppId[];
  wins: WinState[];
  focusedId: number | null;
  openApp: (id: AppId) => void;
  registerDock: (id: AppId, el: HTMLElement | null) => void;
}

export function Dock({ pinned, wins, focusedId, openApp, registerDock }: DockProps) {
  const live = wins.filter((w) => !w.closing);
  // Running apps that aren't pinned appear after a separator, like macOS.
  const extras = live
    .map((w) => w.appId)
    .filter((id, i, arr) => !pinned.includes(id) && arr.indexOf(id) === i);

  const renderItem = (id: AppId) => {
    const win = live.find((w) => w.appId === id);
    return (
      <DockItem
        key={id}
        def={APPS[id]}
        running={Boolean(win)}
        focused={Boolean(win && win.id === focusedId && !win.minimized)}
        register={registerDock}
        onActivate={() => openApp(id)}
      />
    );
  };

  return (
    <div className="os-dock-wrap">
      <div className="os-dock">
        {pinned.map(renderItem)}
        {extras.length > 0 && <span className="os-dock-sep" />}
        {extras.map(renderItem)}
        {!pinned.includes("resume") && !extras.includes("resume") && (
          <>
            <span className="os-dock-sep" />
            <DockItem
              def={APPS.resume}
              running={live.some((w) => w.appId === "resume")}
              focused={false}
              label="Resume"
              onActivate={() => openApp("resume")}
            />
          </>
        )}
      </div>
    </div>
  );
}
