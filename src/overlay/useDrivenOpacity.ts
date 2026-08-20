import { useEffect, useRef } from "react";

/**
 * Drives one overlay "scene" from a value the camera rig writes every frame:
 * opacity, hit-testing, and — the part that matters for keyboard and screen
 * reader users — whether the whole scene exists at all.
 *
 * A scene that is off camera is `inert` (unfocusable, skipped by find-in-page)
 * and `aria-hidden` (absent from the accessibility tree), so Tab can never
 * wander into the intro once the visitor has entered the workspace, or into
 * the Personal desktop while the Work desktop is on screen.
 *
 * The attributes are only touched when visibility actually flips, so the
 * per-frame cost stays at one property read. Focus is moved out *before* the
 * scene is hidden: aria-hidden must never contain the focused element.
 */
export function useDrivenOpacity(read: () => number) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let shown: boolean | null = null;

    const tick = () => {
      const el = ref.current;
      if (el) {
        const a = read();
        el.style.opacity = String(a);
        const visible = a > 0.5;
        if (visible !== shown) {
          shown = visible;
          el.style.pointerEvents = visible ? "auto" : "none";
          if (visible) {
            el.inert = false;
            el.removeAttribute("aria-hidden");
          } else {
            const active = document.activeElement;
            if (active instanceof HTMLElement && el.contains(active)) active.blur();
            el.inert = true;
            el.setAttribute("aria-hidden", "true");
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [read]);

  return ref;
}
