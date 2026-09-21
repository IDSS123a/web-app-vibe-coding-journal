"use client";

/**
 * Small, non-blocking "+N Vibe Coina" toast for everyday actions
 * (bookmarking an article) — the brief's "mali leteći coin burst"
 * trigger. Mechanical motion (translate + fade, ease-out, 250ms),
 * never a spring/bounce, per the Swiss animation spec.
 */

import { useEffect, useState } from "react";

export function CoinToast({ coins, onDone }: { coins: number; onDone: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    const timeout = setTimeout(onDone, 1400);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`pointer-events-none fixed bottom-[max(2rem,env(safe-area-inset-bottom))] right-[max(2rem,env(safe-area-inset-right))] z-[60] flex items-center gap-2 border border-black bg-white px-4 py-2 text-black transition-all duration-300 ease-out k-meta font-semibold ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <span className="inline-block h-3 w-3 border border-black bg-studio-lemon" aria-hidden />+{coins} Vibe Coins
    </div>
  );
}
