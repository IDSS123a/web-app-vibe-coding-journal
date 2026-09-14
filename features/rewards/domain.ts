/**
 * Gamification domain logic (DECISION_LOG.md PDL-030, CONSTITUTION.md
 * P-20). Pure functions only -- no DB/network access here (see
 * repository.ts for that), same layering convention as
 * features/pipeline/domain.ts.
 */

export type RewardEventType =
  | "bookmark_article"
  | "open_daily_report"
  | "streak_milestone"
  | "level_up"
  | "onboarding_complete";

/**
 * Coin amounts per event, centralized here (P-5-style documented
 * constant) rather than scattered across call sites. `bookmark_article`
 * is the Director's own example ("+15 Vibe Coina") from the original
 * brief; the rest are first, deliberately modest values to calibrate
 * against once real usage exists -- not treated as final.
 */
export const COIN_AWARDS: Record<RewardEventType, number> = {
  bookmark_article: 15,
  open_daily_report: 10,
  streak_milestone: 100,
  level_up: 0, // Level-ups are a consequence of earned coins, not a separate payout.
  onboarding_complete: 50,
};

/**
 * Level thresholds: total coins ever earned (== coin_balance, since
 * there is no spending yet) required to reach each level. Level 1 is
 * the floor -- everyone starts there. Widening gaps (not linear) so
 * early levels come quickly (onboarding delight) and later ones mean
 * something.
 */
export const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5200] as const;

export function levelForCoinBalance(coinBalance: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (coinBalance >= LEVEL_THRESHOLDS[i]!) {
      level = i + 1;
    }
  }
  return level;
}

/** Coins still needed to reach the next level; null if already at the max defined level. */
export function coinsToNextLevel(coinBalance: number): number | null {
  const currentLevel = levelForCoinBalance(coinBalance);
  const nextThreshold = LEVEL_THRESHOLDS[currentLevel]; // index == currentLevel is the NEXT level's threshold
  return nextThreshold === undefined ? null : nextThreshold - coinBalance;
}

/** Streak milestones that trigger the bigger celebration (brief's own examples: 3/7/30). */
export const STREAK_MILESTONES = [3, 7, 30, 90, 365] as const;

export function isStreakMilestone(streak: number): boolean {
  return (STREAK_MILESTONES as readonly number[]).includes(streak);
}

export interface StreakUpdateResult {
  newStreak: number;
  newLongestStreak: number;
  streakContinued: boolean;
  streakBroken: boolean;
  alreadyCountedToday: boolean;
}

/**
 * Given the user's last-active date and today's date (both
 * YYYY-MM-DD strings in OPERATIONS_TIMEZONE, see
 * lib/time/operations-date.ts), decides the new streak state.
 * Pure date-string comparison -- no Date object arithmetic, since
 * this project's own DST-safe convention (schedule-gate.ts) is to
 * derive calendar dates via Intl, not to do offset math on Date
 * objects.
 */
export function updateStreak(
  lastActiveDate: string | null,
  today: string,
  currentStreak: number,
  longestStreak: number,
): StreakUpdateResult {
  if (lastActiveDate === today) {
    return {
      newStreak: currentStreak,
      newLongestStreak: longestStreak,
      streakContinued: false,
      streakBroken: false,
      alreadyCountedToday: true,
    };
  }

  const yesterday = dateStringAddDays(today, -1);
  const continued = lastActiveDate === yesterday;
  const newStreak = continued ? currentStreak + 1 : 1;
  const newLongestStreak = Math.max(longestStreak, newStreak);

  return {
    newStreak,
    newLongestStreak,
    streakContinued: continued,
    streakBroken: lastActiveDate !== null && !continued,
    alreadyCountedToday: false,
  };
}

/**
 * Adds (or subtracts) whole days to a YYYY-MM-DD string, returning
 * another YYYY-MM-DD string. Deliberately goes through Date.UTC (not
 * timezone-sensitive arithmetic) because the input is already a plain
 * calendar date with no time-of-day component -- "the day before
 * 2026-09-15" is unambiguous regardless of timezone.
 */
function dateStringAddDays(dateString: string, days: number): string {
  const [year, month, day] = dateString.split("-").map(Number) as [number, number, number];
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0]!;
}
