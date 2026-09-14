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
      className={`pointer-events-none fixed bottom-8 right-8 z-[60] flex items-center gap-2 border-4 border-black bg-white px-4 py-2 text-sm font-bold uppercase tracking-widest text-black transition-all duration-300 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <span className="inline-block h-3 w-3 bg-[#D4A017]" aria-hidden />+{coins} Vibe Coins
    </div>
  );
}
