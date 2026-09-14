/**
 * Gamification mascot (DECISION_LOG.md PDL-030) — a deliberate, logged
 * deviation from the Swiss International system's "no illustration,
 * geometric abstraction only" principle (Director's explicit choice
 * over this session's own geometric-token recommendation). Kept as
 * minimal and geometrically-constructed as an illustrated character
 * can be: solid fill, no gradients, no shadows, built from the same
 * basic shapes (circle, rectangle) the Swiss spec already sanctions
 * for composition — so it reads as "this system's character," not an
 * unrelated cartoon import.
 */
export function Mascot({ className = "", size = 64 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Vibe-Coding Journal mascot"
    >
      {/* Body */}
      <rect x="8" y="16" width="48" height="40" fill="#000000" />
      {/* Eyes */}
      <rect x="18" y="30" width="8" height="8" fill="#FFFFFF" />
      <rect x="38" y="30" width="8" height="8" fill="#FFFFFF" />
      <rect x="21" y="33" width="2" height="2" fill="#000000" />
      <rect x="41" y="33" width="2" height="2" fill="#000000" />
      {/* Antenna / signal mark, in the accent color */}
      <rect x="30" y="4" width="4" height="12" fill="#FF3000" />
      <rect x="26" y="0" width="12" height="4" fill="#FF3000" />
      {/* Mouth */}
      <rect x="24" y="44" width="16" height="4" fill="#FFFFFF" />
    </svg>
  );
}
