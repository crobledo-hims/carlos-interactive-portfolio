import { APPS } from "./apps/registry";
import type { AppDef, AppId, OsAction } from "./types";

interface IconProps {
  def: AppDef;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
}

function Icon({ def, selected, onSelect, onOpen }: IconProps) {
  const inner = (
    <>
      <span className="os-icon-tile" style={{ background: def.tile }}>
        {def.glyph}
      </span>
      <span className="os-icon-label">{def.name}</span>
    </>
  );
  const cls = `os-icon${selected ? " selected" : ""}`;

  if (def.href) {
    return (
      <a
        className={cls}
        href={def.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          // Keyboard activation (detail 0) follows the link; a mouse click
          // only selects, and the second click of a double-click opens it.
          if (e.detail === 0) return;
          e.preventDefault();
          onSelect();
        }}
        onDoubleClick={() => window.open(def.href, "_blank", "noopener,noreferrer")}
      >
        {inner}
      </a>
    );
  }

  return (
    <button className={cls} onClick={onSelect} onDoubleClick={onOpen}>
      {inner}
    </button>
  );
}

interface DesktopIconsProps {
  apps: AppId[];
  selected: AppId | null;
  dispatch: (a: OsAction) => void;
  openApp: (id: AppId) => void;
}

export function DesktopIcons({ apps, selected, dispatch, openApp }: DesktopIconsProps) {
  return (
    <div className="os-icons">
      {apps.map((id) => (
        <Icon
          key={id}
          def={APPS[id]}
          selected={selected === id}
          onSelect={() => dispatch({ type: "selectIcon", appId: id })}
          onOpen={() => openApp(id)}
        />
      ))}
    </div>
  );
}
