/**
 * A pausable clock for the Cadence opening sequence.
 *
 * The sequence reads as a straight line of `await clock.sleep(...)` calls, so
 * the script in CadenceApp looks like the script Carlos wrote. Everything that
 * makes it survive a real browser lives here:
 *
 *   - pause()/resume() checkpoint whatever sleep is in flight, so hiding the
 *     tab freezes the story mid-step and showing it again continues from the
 *     same millisecond rather than restarting or fast-forwarding.
 *   - cancel() releases every pending sleep at once. Awaiting code checks
 *     `alive()` immediately after each await and returns, so a skip or a
 *     channel switch unwinds the whole sequence on the next tick with no
 *     stranded timers.
 *
 * Deliberately built on setTimeout rather than requestAnimationFrame: a
 * backgrounded tab starves rAF completely, which would strand a half-typed
 * message. Timers are merely throttled, and pause() takes over before the
 * throttling matters.
 */
export interface Clock {
  /** Resolves after `ms` of unpaused time, or immediately once cancelled. */
  sleep: (ms: number) => Promise<void>;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
  /** False once cancelled. Check after every await. */
  alive: () => boolean;
  paused: () => boolean;
  /** Unpaused milliseconds since this clock was created. */
  elapsed: () => number;
}

interface Pending {
  resolve: () => void;
  /** Time still owed when the clock is paused. */
  remaining: number;
  /** When the current timer was armed. */
  armedAt: number;
  timer: number;
}

export function makeClock(): Clock {
  let cancelled = false;
  let isPaused = false;
  let elapsedBeforePause = 0;
  let activeStartedAt = performance.now();
  const pending = new Set<Pending>();

  const elapsed = () =>
    elapsedBeforePause + (isPaused || cancelled ? 0 : performance.now() - activeStartedAt);

  const arm = (p: Pending) => {
    p.armedAt = performance.now();
    p.timer = window.setTimeout(() => {
      pending.delete(p);
      p.resolve();
    }, p.remaining);
  };

  return {
    sleep(ms) {
      if (cancelled) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const p: Pending = { resolve, remaining: Math.max(0, ms), armedAt: 0, timer: 0 };
        pending.add(p);
        if (isPaused) return; // resume() arms it
        arm(p);
      });
    },
    pause() {
      if (isPaused || cancelled) return;
      const now = performance.now();
      elapsedBeforePause += now - activeStartedAt;
      isPaused = true;
      for (const p of pending) {
        clearTimeout(p.timer);
        p.timer = 0;
        p.remaining = Math.max(0, p.remaining - (now - p.armedAt));
      }
    },
    resume() {
      if (!isPaused || cancelled) return;
      isPaused = false;
      activeStartedAt = performance.now();
      for (const p of pending) arm(p);
    },
    cancel() {
      if (cancelled) return;
      if (!isPaused) elapsedBeforePause += performance.now() - activeStartedAt;
      cancelled = true;
      for (const p of pending) {
        clearTimeout(p.timer);
        p.resolve();
      }
      pending.clear();
    },
    alive: () => !cancelled,
    paused: () => isPaused,
    elapsed,
  };
}

/* ------------------------------------------------------------- typing feel */

/** Every simulated human response uses the same 150 WPM baseline. */
export const TYPING_WPM = 150;
const CHARS_PER_WORD = 5;
const BASE_MS = Math.round(60_000 / (TYPING_WPM * CHARS_PER_WORD));

/** Characters a person pauses after, mid-thought. */
const PUNCTUATION = /[.,!?;:—]/;

/**
 * Delay before the character at `i`, decided by the character just typed.
 *
 * The variation is a deterministic function of the index rather than
 * Math.random: it keeps the rhythm from sounding mechanical without the
 * frame-to-frame jitter that reads as jerky, and it makes a given message type
 * out identically every replay.
 */
export function charDelay(prev: string, i: number): number {
  if (!prev) return BASE_MS;
  if (PUNCTUATION.test(prev)) return 180 + ((i * 37) % 121); // 180..300
  if (prev === " ") return Math.round(BASE_MS * 0.82); // words start a touch quicker
  return BASE_MS + (((i * 17) % 25) - 12); // +/-12ms, no jitter
}

/**
 * Types `text` one character at a time, publishing each prefix through
 * `onText`. Each character targets an absolute point on the clock so delayed
 * browser timers cannot compound into a slower effective WPM. Because the
 * clock counts only unpaused time, hiding the tab still freezes the typing
 * exactly where it stands.
 */
export async function typeOut(
  clock: Clock,
  text: string,
  onText: (value: string) => void,
): Promise<void> {
  const delays = Array.from(text, (_, i) => charDelay(i === 0 ? "" : text[i - 1], i));
  const rawDuration = delays.reduce((total, delay) => total + delay, 0);
  const targetDuration = typingDurationMs(text);
  const scale = rawDuration > 0 ? targetDuration / rawDuration : 0;
  const startedAt = clock.elapsed();
  let scheduledAt = startedAt;

  for (let i = 0; i < text.length; i++) {
    scheduledAt += delays[i] * scale;
    await clock.sleep(Math.max(0, scheduledAt - clock.elapsed()));
    if (!clock.alive()) return;
    onText(text.slice(0, i + 1));
  }
}

/**
 * How long an incoming Slack typing indicator should remain visible for a
 * reply of `text` words. Incoming messages arrive whole in Slack, so their
 * human pace is represented by the indicator rather than characters appearing
 * inside the posted message.
 */
export function typingDurationMs(text: string, wordsPerMinute: number = TYPING_WPM): number {
  const words = text.trim().match(/\S+/g)?.length ?? 0;
  if (words === 0 || wordsPerMinute <= 0) return 0;
  return Math.round((words / wordsPerMinute) * 60_000);
}
