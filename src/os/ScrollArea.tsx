import type { ReactNode, RefObject, WheelEvent } from "react";

/**
 * Wheel contract for the whole OS.
 *
 * A scrollable region keeps the wheel for itself *only while it can still
 * move in that direction*. Once it hits an edge — or if it was never
 * scrollable — the event bubbles up to the overlay, which forwards it to
 * drei's scroll container so the page keeps moving. The visitor can never be
 * trapped inside a window.
 */
export function keepWheelIfScrollable(e: WheelEvent<HTMLElement>) {
  const el = e.currentTarget;
  if (e.deltaY === 0) return;
  const max = el.scrollHeight - el.clientHeight;
  if (max <= 1) return;
  const atTop = el.scrollTop <= 0;
  const atBottom = el.scrollTop >= max - 1;
  if ((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom)) return;
  e.stopPropagation();
}

interface ScrollAreaProps {
  className?: string;
  children: ReactNode;
  innerRef?: RefObject<HTMLDivElement | null>;
}

export function ScrollArea({ className, children, innerRef }: ScrollAreaProps) {
  return (
    <div
      ref={innerRef}
      className={className ? `os-scroll ${className}` : "os-scroll"}
      onWheel={keepWheelIfScrollable}
    >
      {children}
    </div>
  );
}
