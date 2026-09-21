/**
 * Server-paid learning rewards (PDL-072 Prompt School, PDL-075 University): coins for finishing a lesson, passing an
 * exercise or a quiz for the first time, completing a chapter and passing a level test. Paid on the server, inside the routes that record the
 * progress, so the browser cannot claim them; idempotent through the reward dedupe key, so repeating a step
 * never pays twice. A failing award must never break the learning action itself, so errors are logged and
 * swallowed here (the same rule the browser-side rewards follow, P-1.1).
 */
import { awardCoins } from "@/features/rewards/repository";
import type { RewardEventType } from "@/features/rewards/domain";

/** What the browser needs to celebrate: only present when coins were actually paid. */
export interface LearningReward {
  event: RewardEventType;
  coinsAwarded: number;
  leveledUp: boolean;
  level: number;
  coinBalance: number;
  currentStreak: number;
  longestStreak: number;
}

export async function awardLearningStep(userId: string, event: RewardEventType, dedupeKey: string): Promise<LearningReward | null> {
  try {
    const r = await awardCoins(userId, event, dedupeKey);
    if (!r.awarded) return null;
    return {
      event,
      coinsAwarded: r.coinsAwarded,
      leveledUp: r.leveledUp,
      level: r.newState.level,
      coinBalance: r.newState.coinBalance,
      currentStreak: r.newState.currentStreak,
      longestStreak: r.newState.longestStreak,
    };
  } catch (err) {
    console.error(`[REWARDS] Learning reward ${event} failed: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}
