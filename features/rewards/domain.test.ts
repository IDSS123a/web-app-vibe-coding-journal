import { describe, it, expect } from "vitest";
import {
  levelForCoinBalance,
  coinsToNextLevel,
  isStreakMilestone,
  updateStreak,
  LEVEL_THRESHOLDS,
} from "./domain";

describe("levelForCoinBalance", () => {
  it("starts at level 1 with zero coins", () => {
    expect(levelForCoinBalance(0)).toBe(1);
  });

  it("stays at level 1 just below the first threshold", () => {
    expect(levelForCoinBalance(LEVEL_THRESHOLDS[1]! - 1)).toBe(1);
  });

  it("reaches level 2 exactly at the second threshold", () => {
    expect(levelForCoinBalance(LEVEL_THRESHOLDS[1]!)).toBe(2);
  });

  it("reaches the max defined level with a very high balance", () => {
    expect(levelForCoinBalance(1_000_000)).toBe(LEVEL_THRESHOLDS.length);
  });
});

describe("coinsToNextLevel", () => {
  it("returns coins needed to reach level 2 from zero", () => {
    expect(coinsToNextLevel(0)).toBe(LEVEL_THRESHOLDS[1]);
  });

  it("returns null once the max defined level is reached", () => {
    expect(coinsToNextLevel(1_000_000)).toBeNull();
  });
});

describe("isStreakMilestone", () => {
  it("recognizes documented milestones", () => {
    expect(isStreakMilestone(3)).toBe(true);
    expect(isStreakMilestone(7)).toBe(true);
    expect(isStreakMilestone(30)).toBe(true);
  });

  it("does not treat an arbitrary day as a milestone", () => {
    expect(isStreakMilestone(4)).toBe(false);
    expect(isStreakMilestone(0)).toBe(false);
  });
});

describe("updateStreak", () => {
  it("starts a first-ever streak at 1", () => {
    const result = updateStreak(null, "2026-09-14", 0, 0);
    expect(result).toMatchObject({
      newStreak: 1,
      newLongestStreak: 1,
      streakContinued: false,
      streakBroken: false,
      alreadyCountedToday: false,
    });
  });

  it("continues the streak when last active was exactly yesterday", () => {
    const result = updateStreak("2026-09-13", "2026-09-14", 5, 5);
    expect(result).toMatchObject({
      newStreak: 6,
      newLongestStreak: 6,
      streakContinued: true,
      streakBroken: false,
      alreadyCountedToday: false,
    });
  });

  it("does not double-count the same calendar day", () => {
    const result = updateStreak("2026-09-14", "2026-09-14", 5, 5);
    expect(result).toMatchObject({
      newStreak: 5,
      alreadyCountedToday: true,
      streakContinued: false,
      streakBroken: false,
    });
  });

  it("resets to 1 when a day was missed", () => {
    const result = updateStreak("2026-09-10", "2026-09-14", 8, 8);
    expect(result).toMatchObject({
      newStreak: 1,
      newLongestStreak: 8, // longest streak record is preserved, not reset
      streakContinued: false,
      streakBroken: true,
      alreadyCountedToday: false,
    });
  });

  it("carries the longest-streak record forward when a new streak exceeds it", () => {
    const result = updateStreak("2026-09-13", "2026-09-14", 10, 8);
    expect(result.newLongestStreak).toBe(11);
  });

  it("handles a month boundary correctly (no manual offset math)", () => {
    const result = updateStreak("2026-08-31", "2026-09-01", 3, 3);
    expect(result).toMatchObject({ newStreak: 4, streakContinued: true });
  });
});
