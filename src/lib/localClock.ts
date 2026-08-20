/**
 * Visitor-local wall clock, shared by every surface in the app that shows the
 * time (the wall TV in the 3D scene, and — once it migrates — the OS menu bar).
 *
 * Framework-agnostic on purpose: no React import lives here. The exported
 * pair is deliberately shaped for `useSyncExternalStore`, so the React binding
 * is a one-liner:
 *
 *   const time = useSyncExternalStore(subscribeLocalTime, getLocalTime, getLocalTime);
 *
 * Non-React consumers use `onLocalMinute(cb)` instead.
 *
 * Why one module rather than two `setInterval`s: two independently-seeded
 * timers formatting two `Date`s can straddle a minute boundary and disagree
 * for up to a second. One snapshot, one timer, one string — no drift.
 */

const FORMAT: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };

/** Locale-respecting 12/24h, no seconds. */
let formatter: Intl.DateTimeFormat | null = null;

function format(date: Date): string {
  if (!formatter) formatter = new Intl.DateTimeFormat(undefined, FORMAT);
  return formatter.format(date);
}

/**
 * Cached so `getLocalTime` is referentially stable between minute changes —
 * `useSyncExternalStore` re-renders forever if the snapshot is a fresh value
 * on every read.
 */
let snapshot = format(new Date());

const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | null = null;

/**
 * Milliseconds until the next wall-clock minute boundary. Every timezone in
 * current use is a whole number of minutes from UTC, so a UTC-aligned
 * boundary is also the local one.
 */
function msToNextMinute(): number {
  return 60_000 - (Date.now() % 60_000);
}

/** Re-read the clock; notify only when the *displayed* string actually moves. */
function refresh(): boolean {
  const next = format(new Date());
  if (next === snapshot) return false;
  snapshot = next;
  for (const listener of listeners) listener();
  return true;
}

function schedule(): void {
  if (timer !== null) clearTimeout(timer);
  // +250 ms so a timer that fires a hair early still lands inside the new
  // minute rather than re-reading the old one and skipping a tick.
  timer = setTimeout(onTick, msToNextMinute() + 250);
}

function onTick(): void {
  refresh();
  schedule();
}

/**
 * A backgrounded tab throttles timers; on return the snapshot can be minutes
 * stale. Re-read as soon as we are visible again.
 */
function onVisible(): void {
  if (document.visibilityState !== "visible") return;
  refresh();
  schedule();
}

/** Current formatted local time. Cheap, cached, safe to call every frame. */
export function getLocalTime(): string {
  return snapshot;
}

/**
 * Subscribe to minute changes. Signature matches `useSyncExternalStore`'s
 * `subscribe`: the callback takes no arguments and reads `getLocalTime()`.
 * Returns an unsubscribe function; the timer stops when the last listener
 * detaches, so nothing leaks.
 */
export function subscribeLocalTime(onChange: () => void): () => void {
  listeners.add(onChange);
  if (listeners.size === 1) {
    // Coming back from dormant: the cached snapshot may predate this minute.
    refresh();
    schedule();
    document.addEventListener("visibilitychange", onVisible);
  }
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      document.removeEventListener("visibilitychange", onVisible);
    }
  };
}

/**
 * Convenience wrapper for imperative consumers (e.g. redrawing a canvas
 * texture). Fires with the new string on each minute change.
 */
export function onLocalMinute(callback: (time: string) => void): () => void {
  return subscribeLocalTime(() => callback(snapshot));
}
