import { useCallback, useEffect, useRef, useState } from "react";

export function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Best-effort clipboard write; the demo never fails loudly if it is blocked. */
export async function copyText(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* clipboard permission denied — fall through to the manual hint */
  }
  return false;
}

/** Transient confirmation. Announcement is handled by the app's live region. */
export function useToast() {
  const [toast, setToast] = useState("");
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  const show = useCallback((message: string) => {
    setToast(message);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(""), 2200);
  }, []);
  return { toast, show };
}
