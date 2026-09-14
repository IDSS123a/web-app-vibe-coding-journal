"use client";

/**
 * Orchestrates a single reward call: hits /api/rewards/award, then
 * decides which UI to show -- a small CoinToast for an everyday award,
 * or the full CelebrationOverlay + confetti for a level-up or streak
 * milestone. One hook per consuming component (not a global context)
 * since this wave only has one real integration point (bookmarking,
 * DECISION_LOG.md PDL-030) -- promoting this to app-wide context is a
 * next-wave concern once more trigger points exist.
 */

import { useState, useCallback } from "react";
import type { RewardEventType } from "@/features/rewards/domain";

interface AwardApiResult {
  awarded: boolean;
  coinsAwarded: number;
  leveledUp: boolean;
  streakMilestoneHit: number | null;
  newState: { coinBalance: number; currentStreak: number; longestStreak: number; level: number };
}

interface CelebrationState {
  title: string;
  subtitle: string;
  coins?: number;
}

export function useRewardCelebration(token: string | null) {
  const [toastCoins, setToastCoins] = useState<number | null>(null);
  const [celebration, setCelebration] = useState<CelebrationState | null>(null);
  const [confettiActive, setConfettiActive] = useState(false);

  const award = useCallback(
    async (eventType: RewardEventType, dedupeKey: string | null) => {
      if (!token) return;
      try {
        const res = await fetch("/api/rewards/award", {
          method: "POST",
          headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
          body: JSON.stringify({ eventType, dedupeKey }),
        });
        if (!res.ok) return;
        const result: AwardApiResult = await res.json();
        if (!result.awarded) return;

        if (result.leveledUp) {
          setConfettiActive(true);
          setCelebration({
            title: `Level ${result.newState.level}`,
            subtitle: "You've reached a new level.",
            coins: result.coinsAwarded,
          });
        } else if (result.streakMilestoneHit) {
          setConfettiActive(true);
          setCelebration({
            title: `${result.streakMilestoneHit}-Day Streak`,
            subtitle: "Excellent progress. Keep up the pace.",
            coins: result.coinsAwarded,
          });
        } else if (result.coinsAwarded > 0) {
          setToastCoins(result.coinsAwarded);
        }
      } catch {
        // Reward feedback is a delight layer, not core functionality --
        // a failed award call must never surface as a user-facing error
        // or block the underlying action (M-4 / P-1.1 spirit: never let
        // a non-critical feature degrade a critical one).
      }
    },
    [token],
  );

  return {
    award,
    toastCoins,
    clearToast: () => setToastCoins(null),
    celebration,
    dismissCelebration: () => setCelebration(null),
    confettiActive,
    stopConfetti: () => setConfettiActive(false),
  };
}
