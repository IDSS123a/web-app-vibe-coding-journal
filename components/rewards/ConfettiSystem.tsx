"use client";

/**
 * Rectangular-particle confetti (DECISION_LOG.md PDL-030). Deliberately
 * NOT canvas-confetti — that library's particles are round, which
 * violates P-20's `radius: 0` rule. Pure CSS keyframe animation:
 * squares/rectangles in the Swiss palette (black, Swiss Red, a muted
 * gold as the "reward" signal) fall and rotate, then unmount.
 *
 * Respects prefers-reduced-motion via the global CSS rule in
 * app/globals.css (animation-duration forced to ~0), so this never
 * needs its own reduced-motion branch — it just resolves instantly.
 */

import { useEffect, useState } from "react";

const COLORS = ["#000000", "#FF3000", "#D4A017"]; // black, Swiss Red, muted gold (reward accent)
const PARTICLE_COUNT = 24;

interface Particle {
  id: number;
  left: number; // vw
  delay: number; // ms
  duration: number; // ms
  color: string;
  size: number; // px
  rotation: number; // deg
}

function makeParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 200,
    duration: 900 + Math.random() * 500,
    color: COLORS[i % COLORS.length]!,
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 360,
  }));
}

export function ConfettiSystem({ active, onDone }: { active: boolean; onDone?: () => void }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) return;
    setParticles(makeParticles());
    const timeout = setTimeout(() => {
      setParticles([]);
      onDone?.();
    }, 1600);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (particles.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.left}vw`,
            top: "-20px",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            transform: `rotate(${p.rotation}deg)`,
            animation: `swiss-confetti-fall ${p.duration}ms ${p.delay}ms ease-in forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes swiss-confetti-fall {
          from { transform: translateY(0) rotate(0deg); opacity: 1; }
          to { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
