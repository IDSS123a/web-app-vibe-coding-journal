"use client";

/**
 * Full-screen celebration (level-up, streak milestone) — DECISION_LOG.md
 * PDL-030, upgraded PDL-044 ("controlled juicy deviation," Gamification
 * Wave 2.5). This is the ONE place in the app where P-20's "no soft
 * shadows/glows, no spring/overshoot motion" rules are deliberately
 * relaxed, on the Director's explicit, scoped instruction — everywhere
 * else in the app (SiteNav, Dashboard, cards, forms, CoinBalance) stays
 * 100% mechanical Swiss. What's added here:
 *   - A soft red (#FF3000) glow/bloom pulsing behind the mascot
 *     (celebration-glow-pulse, app/globals.css) — the only blurred glow
 *     anywhere in the codebase, confined to this component.
 *   - A spring/overshoot entrance for the card itself
 *     (celebration-spring-in) — the only non-ease-out motion curve
 *     anywhere in the codebase.
 *   - A matching pop-in on the coin total (celebration-coin-pop).
 *   - Richer light rays: more of them, animated rotation, still pure
 *     SVG geometry (never a raster/blur asset).
 * The rectangular card itself, its border, and its colour palette are
 * still Swiss (radius 0, border-4, black/white/red) — the deviation is
 * motion and glow, not the shapes.
 */

import { Mascot } from "./Mascot";

interface CelebrationOverlayProps {
  open: boolean;
  title: string;
  subtitle: string;
  coins?: number;
  onDismiss: () => void;
}

function LightRays() {
  const rayCount = 24;
  const rays = Array.from({ length: rayCount }, (_, i) => {
    const angle = (360 / rayCount) * i;
    return (
      <line
        key={i}
        x1="200"
        y1="200"
        x2={200 + 200 * Math.cos((angle * Math.PI) / 180)}
        y2={200 + 200 * Math.sin((angle * Math.PI) / 180)}
        stroke="var(--studio-blueberry)"
        strokeWidth="2"
        opacity="0.18"
      />
    );
  });
  return (
    <svg
      viewBox="0 0 400 400"
      className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 animate-[spin_40s_linear_infinite]"
      aria-hidden
    >
      {rays}
    </svg>
  );
}

export function CelebrationOverlay({ open, title, subtitle, coins, onDismiss }: CelebrationOverlayProps) {
  if (!open) return null;

  return (
    <div className="layer-campus fixed inset-0 z-50 flex items-center justify-center bg-studio-canvas/95 px-4">
      <LightRays />
      <div className="k-card celebration-spring-in relative w-full max-w-md p-10 text-center">
        <div className="relative mb-6 flex justify-center">
          {/* Soft glow behind the mascot -- the celebration layer's one
              permitted blur, per this component's header comment. */}
          <div
            className="celebration-glow-pulse pointer-events-none absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-studio-lemon blur-2xl"
            aria-hidden
          />
          <Mascot size={72} className="relative" />
        </div>
        <p className="k-clabel mb-2 text-studio-blueberry">
          Vibe-Coding Journal
        </p>
        <h2 className="k-cheading">{title}</h2>
        <p className="k-cintro mt-3">{subtitle}</p>
        {coins != null && (
          <p className="celebration-coin-pop k-h4 mt-4">
            +{coins} <span className="k-clabel">Vibe Coins</span>
          </p>
        )}
        <button
          type="button"
          onClick={onDismiss}
          className="k-cbtn k-cbtn-primary mt-8 h-14 w-full"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
