"use client";

/**
 * Rectangular-particle confetti (DECISION_LOG.md PDL-030, richer per
 * PDL-044's "controlled juicy deviation" — more particles, size/shape
 * variety, and horizontal drift, but still deliberately NOT
 * canvas-confetti: that library's particles are round, which violates
 * P-20's `radius: 0` rule even here — the juicy-deviation brief asks
 * for "richer, more dynamic confetti," not round confetti, and Wave 1's
 * own reasoning for staying rectangular still applies. Pure CSS
 * keyframe animation: squares/rects/strips in the Swiss palette
 * (black, Swiss Red, a muted gold as the "reward" signal) fall, drift,
 * and rotate, then unmount.
 *
 * Respects prefers-reduced-motion via the global CSS rule in
 * app/globals.css (animation-duration forced to ~0), so this never
 * needs its own reduced-motion branch — it just resolves instantly.
 */

import { useEffect, useState } from "react";

const COLORS = ["#000000", "#FF3000", "#D4A017"]; // black, Swiss Red, muted gold (reward accent)
const PARTICLE_COUNT = 40;

interface Particle {
  id: number;
  left: number; // vw
  delay: number; // ms
  duration: number; // ms
  color: string;
  width: number; // px
  height: number; // px
  rotation: number; // deg
  drift: number; // vw, horizontal wobble amount (can be negative)
}

function makeParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    // A minority render as thin "strips" rather than squares -- more
    // visual variety while staying strictly rectangular (radius 0).
    const isStrip = Math.random() < 0.3;
    return {
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 250,
      duration: 1000 + Math.random() * 700,
      color: COLORS[i % COLORS.length]!,
      width: isStrip ? 3 + Math.random() * 3 : 6 + Math.random() * 9,
      height: isStrip ? 12 + Math.random() * 10 : 6 + Math.random() * 9,
      rotation: Math.random() * 360,
      drift: (Math.random() - 0.5) * 14,
    };
  });
}

export function ConfettiSystem({ active, onDone }: { active: boolean; onDone?: () => void }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) return;
    setParticles(makeParticles());
    const timeout = setTimeout(() => {
      setParticles([]);
      onDone?.();
    }, 1900);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (particles.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          style={
            {
              position: "absolute",
              left: `${p.left}vw`,
              top: "-24px",
              width: p.width,
              height: p.height,
              backgroundColor: p.color,
              "--confetti-drift": `${p.drift}vw`,
              "--confetti-rot": `${p.rotation}deg`,
              animation: `swiss-confetti-fall ${p.duration}ms ${p.delay}ms ease-in forwards`,
            } as React.CSSProperties
          }
        />
      ))}
      <style>{`
        @keyframes swiss-confetti-fall {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          60% { transform: translate(calc(var(--confetti-drift) * 0.7), 60vh) rotate(calc(var(--confetti-rot) * 0.6)); opacity: 1; }
          100% { transform: translate(var(--confetti-drift), 100vh) rotate(var(--confetti-rot)); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
