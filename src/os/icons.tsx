// All glyphs are hand-drawn SVG — no external image or icon-font dependencies.
// The shell mark is a custom monogram, deliberately not any vendor's logo.

export function Monogram({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M8 1.2 14.2 8 8 14.8 1.8 8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M8 4.6 11.4 8 8 11.4Z" fill="currentColor" />
    </svg>
  );
}

export function WifiGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
        <path d="M1.8 6.1a9 9 0 0 1 12.4 0" />
        <path d="M4.2 8.7a5.6 5.6 0 0 1 7.6 0" />
        <path d="M6.5 11.2a2.3 2.3 0 0 1 3 0" />
      </g>
      <circle cx="8" cy="13.4" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function BatteryGlyph({ level = 0.82 }: { level?: number }) {
  return (
    <svg width="26" height="14" viewBox="0 0 26 14" aria-hidden="true">
      <rect
        x="0.7"
        y="2.4"
        width="21"
        height="9.2"
        rx="2.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.55"
      />
      <rect x="2.2" y="3.9" width={18 * level} height="6.2" rx="1.4" fill="currentColor" />
      <path d="M23.2 5.4v3.2a2.2 2.2 0 0 0 0-3.2Z" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

export function SearchGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="7" cy="7" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.4 10.4 14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function ControlGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
        <path d="M2 5h12M2 11h12" opacity="0.5" />
      </g>
      <circle cx="10" cy="5" r="2" fill="currentColor" />
      <circle cx="6" cy="11" r="2" fill="currentColor" />
    </svg>
  );
}

export function ChevronDown() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3.5 6 8 10.5 12.5 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LockGlyph() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="1.8" fill="currentColor" />
      <path
        d="M5.4 7V5.2a2.6 2.6 0 0 1 5.2 0V7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

/* ---------------------------------------------------------------- app tiles */

export function RexGlyph() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
      <g fill="#fff">
        <rect x="5" y="12.4" width="12.6" height="3.4" rx="1.7" opacity="0.95" />
        <rect x="5" y="18" width="8.4" height="3.4" rx="1.7" opacity="0.7" />
        <circle cx="23.2" cy="11.4" r="3.1" opacity="0.95" />
        <path d="M18.4 22.8a4.8 4.8 0 0 1 9.6 0Z" opacity="0.7" />
        <rect x="5" y="6.8" width="16.2" height="3.4" rx="1.7" opacity="0.55" />
      </g>
    </svg>
  );
}

/**
 * A lighthouse throwing two flat beams.
 *
 * The beams are solid wedges rather than arcs on purpose: concentric rings
 * would read as a signal-strength motif, which is the shape this icon exists
 * to get away from. The lamp is the one warm accent, the way Terminal keeps a
 * single green.
 */
export function BeaconGlyph() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
      <g fill="#fff" opacity="0.4">
        <path d="M12.9 10.2 3 6.8v6.8Z" />
        <path d="M19.1 10.2 29 6.8v6.8Z" />
      </g>
      <path d="M12.4 26.4 13.7 13.6h4.6l1.3 12.8Z" fill="#fff" opacity="0.95" />
      <rect x="12.6" y="11.7" width="6.8" height="2.1" rx="1.05" fill="#fff" />
      <path d="M13.5 11.7V8.6h5v3.1Z" fill="#fff" />
      <path d="M12.9 8.6 16 5.4l3.1 3.2Z" fill="#fff" opacity="0.78" />
      <rect x="14.8" y="8.7" width="2.4" height="2.9" rx="0.7" fill="#ffd88a" />
      <rect x="10.2" y="26.2" width="11.6" height="2.6" rx="1.3" fill="#fff" opacity="0.8" />
    </svg>
  );
}

/**
 * A magnifier held over lines of text: reading the evidence, not scoring the
 * person. Deliberately not an eye, a target, or a rank.
 */
export function LensGlyph() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
      <path
        d="M21.4 21.4 27.6 27.6"
        stroke="#fff"
        strokeWidth="3.4"
        strokeLinecap="round"
        opacity="0.85"
      />
      <circle cx="14" cy="14" r="8.7" fill="#fff" opacity="0.15" />
      <circle cx="14" cy="14" r="8.7" fill="none" stroke="#fff" strokeWidth="2.6" />
      <g stroke="#fff" strokeWidth="1.9" strokeLinecap="round">
        <path d="M10.2 11.5h7.6" />
        <path d="M10.2 14.8h7.6" opacity="0.8" />
        <path d="M10.2 18.1h4.3" opacity="0.6" />
      </g>
    </svg>
  );
}

export function ResumeGlyph() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M7 4h12l6 6v18H7Z" fill="#fff" opacity="0.94" />
      <path d="M19 4l6 6h-6Z" fill="#c9ccd6" />
      <g stroke="#5b6070" strokeWidth="1.5" strokeLinecap="round">
        <path d="M11 14h10M11 18h10M11 22h6" />
      </g>
    </svg>
  );
}

export function LinkedInGlyph() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
      <g fill="#fff">
        <circle cx="9" cy="9.4" r="2.6" />
        <rect x="6.9" y="13.6" width="4.2" height="11.4" rx="1.2" />
        <path d="M14.6 25V13.6h4v1.7a4.7 4.7 0 0 1 8.4 3v6.7h-4.2v-6a2.2 2.2 0 0 0-4.4 0v6Z" />
      </g>
    </svg>
  );
}

export function MailGlyph() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
      <rect x="3.6" y="7.4" width="24.8" height="17.2" rx="3.2" fill="#fff" opacity="0.95" />
      <path
        d="M5.4 10.4 16 18l10.6-7.6"
        fill="none"
        stroke="#4b5570"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RelayGlyph() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
      <path
        d="M8.5 12.2a11 11 0 0 1 15 0"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.45"
      />
      <circle cx="7" cy="19.4" r="3.3" fill="#fff" />
      <circle cx="25" cy="19.4" r="3.3" fill="#fff" opacity="0.72" />
      <path d="M11.6 19.4h7.2" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="M16.4 16.2 20.5 19.4l-4.1 3.2"
        fill="none"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TerminalGlyph() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
      <rect x="3.4" y="5.6" width="25.2" height="20.8" rx="3.4" fill="#0d0f12" />
      <path
        d="M8.6 12.2 13 16.4l-4.4 4.2"
        fill="none"
        stroke="#8de08d"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M15.6 21h7.8" stroke="#8de08d" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
