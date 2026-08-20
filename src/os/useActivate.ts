import { useRef } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import { DRAG_SLOP } from "./constants";

interface ActivateHandlers {
  onPointerDown: (e: ReactPointerEvent) => void;
  onPointerMove: (e: ReactPointerEvent) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
  onClick: (e: ReactMouseEvent) => void;
}

/**
 * One click / one tap opens an app.
 *
 * The only thing a plain `onClick` gets wrong is a press that turns into a
 * drag or a swipe — a scroll gesture that starts on an icon still ends in a
 * click. So the press is tracked and anything that travels more than
 * DRAG_SLOP px is treated as a gesture and swallowed.
 *
 * Keyboard activation (Enter / Space on a button) arrives with no preceding
 * pointerdown, so it always passes through.
 */
export function useActivate(onActivate: () => void, preventDefaultOnDrag = false): ActivateHandlers {
  const origin = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);

  return {
    onPointerDown: (e) => {
      origin.current = { x: e.clientX, y: e.clientY };
      dragged.current = false;
    },
    onPointerMove: (e) => {
      const o = origin.current;
      if (!o || dragged.current) return;
      if (Math.abs(e.clientX - o.x) > DRAG_SLOP || Math.abs(e.clientY - o.y) > DRAG_SLOP) {
        dragged.current = true;
      }
    },
    onPointerUp: () => {
      origin.current = null;
    },
    onPointerCancel: () => {
      origin.current = null;
      dragged.current = true;
    },
    onClick: (e) => {
      if (dragged.current) {
        dragged.current = false;
        if (preventDefaultOnDrag) e.preventDefault();
        return;
      }
      onActivate();
    },
  };
}
