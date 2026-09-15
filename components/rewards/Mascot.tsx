/**
 * Official 3D mascot (Gamification Wave 2.5, DECISION_LOG.md PDL-044).
 * Replaces the earlier abstract geometric robot-face placeholder with
 * the REAL brand mark -- public/favicon.png (the bearded profile with
 * the mechanical spiral ear) -- rendered with genuine perceived depth.
 *
 * Technique (Director-confirmed option "b" -- no image-generation or
 * 3D-rendering tool is available in this environment, so this is a
 * real, deliberate CSS technique, not a claim of an AI-rendered asset):
 * layered extrusion. Several copies of the exact same PNG are stacked
 * behind the front-most one, each offset a few pixels toward the
 * light-away direction and progressively darkened -- the same
 * principle behind most "isometric sticker" mascot depth (a paper-cut
 * stack, not a flat silhouette). A highlight layer, masked to the
 * image's own alpha channel so it never spills outside the character's
 * silhouette, adds a soft specular hit for a rounded-surface read. A
 * slow idle tilt (perspective + rotateY) reinforces the volume further
 * without ever being a spring/bounce motion -- that liberty is reserved
 * for the celebration layer itself (CelebrationOverlay), not the
 * mascot's own idle state, which stays mechanical per P-20.
 *
 * Colour stays black/white/grey everywhere the mascot appears -- the
 * Swiss Red accent glow permitted by the Director's "controlled juicy
 * deviation" is applied by the CALLER (CelebrationOverlay), as a glow
 * BEHIND the mascot, not baked into the character itself. This
 * component alone is safe to render anywhere in the app (see
 * app/welcome/page.tsx), not just inside a celebration.
 */

const FAVICON_SRC = "/favicon.png";

export function Mascot({ className = "", size = 64 }: { className?: string; size?: number }) {
  // Offsets scale with size so the depth reads correctly from 40px up
  // to 180px, per the brief's own size range -- a fixed pixel offset
  // that looks right at 150px would look like a smear at 40px.
  const backOffset = Math.max(1, size * 0.055);
  const midOffset = Math.max(0.5, size * 0.028);

  return (
    <div
      className={`mascot-idle-tilt relative inline-block ${className}`}
      style={{ width: size, height: size, filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.28))" }}
      role="img"
      aria-label="Vibe-Coding Journal mascot"
    >
      {/* Back layer -- darkest, most offset. */}
      <img
        src={FAVICON_SRC}
        alt=""
        aria-hidden="true"
        className="absolute left-0 top-0 h-full w-full select-none"
        style={{
          transform: `translate(${backOffset}px, ${backOffset}px)`,
          filter: "brightness(0.3) saturate(0.6)",
        }}
        draggable={false}
      />
      {/* Mid layer -- medium tone, half the offset. */}
      <img
        src={FAVICON_SRC}
        alt=""
        aria-hidden="true"
        className="absolute left-0 top-0 h-full w-full select-none"
        style={{
          transform: `translate(${midOffset}px, ${midOffset}px)`,
          filter: "brightness(0.58) saturate(0.75)",
        }}
        draggable={false}
      />
      {/* Front layer -- the real, crisp mascot. */}
      <img src={FAVICON_SRC} alt="" className="absolute left-0 top-0 h-full w-full select-none" draggable={false} />
      {/* Specular highlight, masked to the mascot's own silhouette so it
          never bleeds past the character's edge. */}
      <div
        className="pointer-events-none absolute left-0 top-0 h-full w-full mix-blend-overlay"
        style={{
          background: "radial-gradient(circle at 38% 28%, rgba(255,255,255,0.65), transparent 55%)",
          WebkitMaskImage: `url(${FAVICON_SRC})`,
          maskImage: `url(${FAVICON_SRC})`,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
        }}
      />
    </div>
  );
}
