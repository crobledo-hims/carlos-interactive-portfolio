import type { ReactNode, RefObject } from "react";
import { keepWheelIfScrollable } from "./wheel";

interface ScrollAreaProps {
  className?: string;
  children: ReactNode;
  innerRef?: RefObject<HTMLDivElement | null>;
}

/** A scroll container that plays by the wheel contract in ./wheel.ts. */
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
