import type { ReactNode, RefObject } from "react";

interface ScrollAreaProps {
  className?: string;
  children: ReactNode;
  innerRef?: RefObject<HTMLDivElement | null>;
}

/**
 * A scroll container inside an app window.
 *
 * No wheel handler of its own: the window frame already contains every wheel
 * event (see ./wheel.ts), so reaching the top or bottom here does nothing to
 * the scene. Do not re-add edge forwarding.
 */
export function ScrollArea({ className, children, innerRef }: ScrollAreaProps) {
  return (
    <div ref={innerRef} className={className ? `os-scroll ${className}` : "os-scroll"}>
      {children}
    </div>
  );
}
