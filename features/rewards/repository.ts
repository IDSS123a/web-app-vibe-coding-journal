import { supabaseAdmin } from "@/lib/db/client";
import { getOperationsLocalDateString } from "@/lib/time/operations-date";
import {
  COIN_AWARDS,
  levelForCoinBalance,
  updateStreak,
  isStreakMilestone,
  type RewardEventType,
} from "./domain";

export interface RewardState {
  coinBalance: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
}

export interface AwardResult {
  awarded: boolean; // false if this exact event was already awarded (idempotency)
  coinsAwarded: number;
  newState: RewardState;
  leveledUp: boolean;
  streakMilestoneHit: number | null; // the milestone number if one was just reached, else null
}

/**
 * Awards coins for a user action, idempotently. `dedupeKey` scopes the
 * idempotency check -- e.g. an article id for `bookmark_article`, so
 * bookmarking the SAME article twice (toggle on/off/on) only pays out
 * once, but bookmarking a DIFFERENT article pays out again. Pass null
 * for event types that are naturally at-most-once-per-day
 * (open_daily_report checks the day instead, via last_active_date).
 *
 * Single round-trip per call site is not attempted here -- correctness
 * (no double-award under concurrent requests) matters more than shaving
 * a query for what is, today, a low-traffic per-user action. A future
 * pass could move this into a single Postgres function if contention
 * ever becomes real.
 */
export async function awardCoins(
  userId: string,
  eventType: RewardEventType,
  dedupeKey: string | null,
): Promise<AwardResult> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  if (dedupeKey) {
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("reward_events")
      .select("id")
      .eq("user_id", userId)
      .eq("event_type", eventType)
      .eq("metadata->>dedupeKey", dedupeKey)
      .maybeSingle();

    if (existingError) {
      throw new Error(`Failed to check reward idempotency: ${existingError.message}`);
    }
    if (existing) {
      const state = await getRewardState(userId);
      return { awarded: false, coinsAwarded: 0, newState: state, leveledUp: false, streakMilestoneHit: null };
    }
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("user_profiles")
    .select("coin_balance, current_streak, longest_streak, level, last_active_date")
    .eq("id", userId)
    .single();

  if (profileError) {
    throw new Error(`Failed to load user profile for reward: ${profileError.message}`);
  }

  let coins = COIN_AWARDS[eventType];
  const previousLevel = profile.level as number;

  let currentStreak = profile.current_streak as number;
  let longestStreak = profile.longest_streak as number;
  let streakMilestoneHit: number | null = null;
  let lastActiveDate = profile.last_active_date as string | null;

  // Only "opening the daily report" advances the streak -- bookmarking
  // etc. earns coins without touching streak state, matching the
  // brief's own distinction between a daily habit signal and any
  // engagement action.
  if (eventType === "open_daily_report") {
    const today = getOperationsLocalDateString();
    const result = updateStreak(lastActiveDate, today, currentStreak, longestStreak);
    currentStreak = result.newStreak;
    longestStreak = result.newLongestStreak;
    lastActiveDate = today;
    if (!result.alreadyCountedToday && isStreakMilestone(currentStreak)) {
      streakMilestoneHit = currentStreak;
      // Gamification Wave 2 fix: COIN_AWARDS.streak_milestone (100) was
      // defined but never actually paid out -- this branch only ever
      // set streakMilestoneHit for the celebration UI, while `coins`
      // stayed at open_daily_report's base 10 regardless. Hitting a
      // real milestone (3/7/30/90/365) now adds the milestone bonus on
      // top of the day's normal award, in the same call -- one
      // reward_events row, one coherent total, not a second award()
      // round-trip for what is really one user action.
      coins += COIN_AWARDS.streak_milestone;
    }
  }

  const newBalance = (profile.coin_balance as number) + coins;
  const newLevel = levelForCoinBalance(newBalance);

  const { error: updateError } = await supabaseAdmin
    .from("user_profiles")
    .update({
      coin_balance: newBalance,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      level: newLevel,
      last_active_date: lastActiveDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (updateError) {
    throw new Error(`Failed to update reward state: ${updateError.message}`);
  }

  const { error: eventError } = await supabaseAdmin.from("reward_events").insert({
    user_id: userId,
    event_type: eventType,
    coins_awarded: coins,
    metadata: dedupeKey ? { dedupeKey } : {},
  });

  if (eventError) {
    // The balance update above already succeeded -- a failure to log
    // the audit event is real but must not undo a correctly-granted
    // reward (P-1.1: don't compound one failure into a worse one).
    // Logged, not thrown.
    console.error(`[REWARDS] Failed to record reward_events row: ${eventError.message}`);
  }

  return {
    awarded: true,
    coinsAwarded: coins,
    newState: {
      coinBalance: newBalance,
      currentStreak,
      longestStreak,
      level: newLevel,
    },
    leveledUp: newLevel > previousLevel,
    streakMilestoneHit,
  };
}

export async function getRewardState(userId: string): Promise<RewardState> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { data, error } = await supabaseAdmin
    .from("user_profiles")
    .select("coin_balance, current_streak, longest_streak, level")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(`Failed to load reward state: ${error.message}`);
  }

  return {
    coinBalance: data.coin_balance as number,
    currentStreak: data.current_streak as number,
    longestStreak: data.longest_streak as number,
    level: data.level as number,
  };
}
