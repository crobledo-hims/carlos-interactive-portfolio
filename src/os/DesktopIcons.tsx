import { APPS } from "./apps/registry";
import { useActivate } from "./useActivate";
import type { AppDef, AppId, OsAction } from "./types";

interface IconProps {
  def: AppDef;
  selected: boolean;
  onActivate: () => void;
  register: (id: AppId, el: HTMLElement | null) => void;
}

function Icon({ def, selected, onActivate, register }: IconProps) {
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
        ref={(el) => register(def.id, el)}
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
    <button
      ref={(el) => register(def.id, el)}
      className={cls}
      type="button"
      aria-label={`Open ${def.name}`}
      {...handlers}
    >
      {inner}
    </button>
  );
}

interface DesktopIconsProps {
  apps: AppId[];
  selected: AppId | null;
  dispatch: (a: OsAction) => void;
  openApp: (id: AppId) => void;
  registerIcon: (id: AppId, el: HTMLElement | null) => void;
}

export function DesktopIcons({ apps, selected, dispatch, openApp, registerIcon }: DesktopIconsProps) {
  return (
    <div className="os-icons">
      {apps.map((id) => (
        <Icon
          key={id}
          def={APPS[id]}
          selected={selected === id}
          register={registerIcon}
          onActivate={() => {
            dispatch({ type: "selectIcon", appId: id });
            openApp(id);
          }}
        />
      ))}
    </div>
  );
}
