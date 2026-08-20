import { APPS } from "./apps/registry";
import { useActivate } from "./useActivate";
import type { AppDef, AppId, OsAction } from "./types";

interface IconProps {
  def: AppDef;
  selected: boolean;
  onActivate: () => void;
}

function Icon({ def, selected, onActivate }: IconProps) {
  // Anchors navigate on their own; the hook only cancels the click when the
  // press turned into a drag.
  const handlers = useActivate(def.href ? () => undefined : onActivate, Boolean(def.href));

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
        draggable={false}
        aria-label={`${def.name} — opens in a new tab`}
        {...handlers}
      >
        {inner}
      </a>
    );
  }

  return (
    <button className={cls} type="button" aria-label={`Open ${def.name}`} {...handlers}>
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
          onActivate={() => {
            dispatch({ type: "selectIcon", appId: id });
            openApp(id);
          }}
        />
      ))}
    </div>
  );
}
