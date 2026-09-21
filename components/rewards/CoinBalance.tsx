"use client";

/**
 * Persistent gamification indicator (Gamification Wave 2). One
 * consolidated pill -- coins, level, streak -- rather than three
 * separate boxes; the brief asks for all three to be "always visible"
 * and "elegant, not cartoony," and three competing badges in an
 * already-busy nav (five links + Sign Out) reads as clutter, not
 * elegance. Clicking expands a small summary (the brief's own
 * "opcionalno" affordance) restating the same numbers with labels, for
 * anyone who wants the detail spelled out.
 *
 * No icons/emoji, matching CoinToast's existing "small colored square,
 * not 🪙" convention -- text + the same gold (#D4A017) accent square
 * used there, kept consistent rather than introducing a second visual
 * language for the same currency.
 */

import { useEffect, useRef, useState } from "react";
import { useRewards } from "./RewardsProvider";

/**
 * Animates a displayed integer toward `target` whenever it changes --
 * a plain requestAnimationFrame tween, no animation library. Checks
 * prefers-reduced-motion itself (jumps straight to `target` when set)
 * -- the global CSS rule in app/globals.css only covers CSS
 * animation/transition properties, not a JS-driven rAF loop like this
 * one.
 */
function useCountUp(target: number, durationMs = 400): number {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;

    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(target);
      fromRef.current = target;
      return;
    }

    const start = performance.now();

    function tick(now: number) {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic, matches the project's ease-out convention
      setDisplay(Math.round(from + (target - from) * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs]);

  return display;
}

export function CoinBalance({ variant = "full" }: { variant?: "full" | "compact" }) {
  const { state } = useRewards();
  const [expanded, setExpanded] = useState(false);
  const displayCoins = useCountUp(state?.coinBalance ?? 0);

  if (!state) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label={`${state.coinBalance} Vibe Coins, Level ${state.level}, ${state.currentStreak}-day streak. Show details.`}
        className={`k-meta flex shrink-0 items-center gap-2 border border-black px-3 py-1 font-semibold text-black transition-colors duration-150 ease-out hover:border-signal${variant === "compact" ? " min-h-11" : ""}`}
      >
        <span className="inline-block h-2.5 w-2.5 shrink-0 border border-black bg-studio-lemon" aria-hidden />
        <span>{displayCoins}</span>
        {variant === "full" && (
          <>
            <span className="text-black/30" aria-hidden>
              ·
            </span>
            <span>LVL {state.level}</span>
            <span className="text-black/30" aria-hidden>
              ·
            </span>
            <span>{state.currentStreak}-DAY</span>
          </>
        )}
      </button>

      {expanded && (
        <div className="k-meta absolute right-0 top-full z-30 mt-2 w-56 border border-black bg-white p-4 font-semibold text-black shadow-none">
          <div className="flex items-center justify-between border-b border-rule pb-2">
            <span className="text-ink-soft">Vibe Coins</span>
            <span>{state.coinBalance}</span>
          </div>
          <div className="flex items-center justify-between border-b border-rule py-2">
            <span className="text-ink-soft">Level</span>
            <span>{state.level}</span>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-ink-soft">Current Streak</span>
            <span>{state.currentStreak} day{state.currentStreak === 1 ? "" : "s"}</span>
          </div>
        </div>
      )}
    </div>
  );
}
