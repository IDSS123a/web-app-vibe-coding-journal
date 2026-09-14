"use client";

/**
 * Full-screen celebration (level-up, streak milestone) — DECISION_LOG.md
 * PDL-030. Rectangular card (radius 0, border-4), geometric SVG light
 * rays (straight lines radiating from center, not a soft radial glow —
 * glows/blurs would break P-20's flatness rule), the mascot, and a
 * rectangular black/red dismiss button. Confetti runs alongside via
 * ConfettiSystem, composed by the caller.
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
  const rayCount = 16;
  const rays = Array.from({ length: rayCount }, (_, i) => {
    const angle = (360 / rayCount) * i;
    return (
      <line
        key={i}
        x1="200"
        y1="200"
        x2={200 + 200 * Math.cos((angle * Math.PI) / 180)}
        y2={200 + 200 * Math.sin((angle * Math.PI) / 180)}
        stroke="#FF3000"
        strokeWidth="2"
        opacity="0.15"
      />
    );
  });
  return (
    <svg
      viewBox="0 0 400 400"
      className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2"
      aria-hidden
    >
      {rays}
    </svg>
  );
}

export function CelebrationOverlay({ open, title, subtitle, coins, onDismiss }: CelebrationOverlayProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 px-4">
      <LightRays />
      <div className="relative w-full max-w-md border-4 border-black bg-white p-10 text-center">
        <div className="mb-6 flex justify-center">
          <Mascot size={72} />
        </div>
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#FF3000]">
          Vibe-Coding Journal
        </p>
        <h2 className="text-3xl font-black uppercase tracking-tighter text-black">{title}</h2>
        <p className="mt-3 text-sm text-black">{subtitle}</p>
        {coins != null && (
          <p className="mt-4 text-lg font-black text-black">
            +{coins} <span className="text-sm font-bold uppercase tracking-widest">Vibe Coina</span>
          </p>
        )}
        <button
          type="button"
          onClick={onDismiss}
          className="mt-8 h-14 w-full border-4 border-black bg-black text-sm font-bold uppercase tracking-widest text-white transition-colors duration-150 ease-out hover:border-[#FF3000] hover:bg-[#FF3000]"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
