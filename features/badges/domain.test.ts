/**
 * Badges (PDL-075): the catalogue is well formed, the mapping functions point at real badges, and the University's
 * "expert" level and Prompt School's "advanced" level each get their own badge.
 */
import { describe, expect, it } from "vitest";
import { BADGES, badgeById, promptSchoolLevelBadge, streakBadge, universityLevelBadge } from "./domain";
import { COIN_AWARDS, SERVER_ONLY_REWARD_EVENTS, levelForCoinBalance } from "@/features/rewards/domain";
import { awardCoinsInputSchema } from "@/lib/validation/schemas";
import { AUTHORED_CHAPTERS } from "@/features/prompt-school/content";
import { LEVEL_TESTS } from "@/features/prompt-school/content/level-tests";

describe("badge catalogue", () => {
  it("has unique ids, titles and descriptions", () => {
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length);
    expect(new Set(BADGES.map((b) => b.title)).size).toBe(BADGES.length);
    for (const b of BADGES) {
      expect(b.title.length, b.id).toBeGreaterThan(2);
      expect(b.description.length, b.id).toBeGreaterThan(20);
    }
  });

  it("has no dash tells in the text a learner reads", () => {
    for (const b of BADGES) expect(/—|–| -- /.test(b.title + b.description), b.id).toBe(false);
  });

  it("every mapping points at a real badge", () => {
    for (const l of ["beginner", "intermediate", "advanced"]) expect(badgeById(promptSchoolLevelBadge(l)!), l).toBeDefined();
    for (const l of ["beginner", "intermediate", "expert"]) expect(badgeById(universityLevelBadge(l)!), l).toBeDefined();
    expect(badgeById(streakBadge(7)!)).toBeDefined();
    expect(badgeById(streakBadge(30)!)).toBeDefined();
  });

  it("maps only the levels and streaks that have a badge", () => {
    expect(promptSchoolLevelBadge("expert")).toBeNull();
    expect(universityLevelBadge("advanced")).toBeNull();
    expect(streakBadge(3)).toBeNull();
    expect(streakBadge(null)).toBeNull();
  });

  it("covers the fixed badge ids the routes grant", () => {
    for (const id of ["first-lesson", "first-chapter", "ps-graduate", "book-finder"]) expect(badgeById(id), id).toBeDefined();
  });
});

describe("University coin payouts (PDL-075)", () => {
  it("pays 5 per lesson, 30 per chapter quiz and 150 per level test, all server-only", () => {
    expect(COIN_AWARDS.uni_lesson_complete).toBe(5);
    expect(COIN_AWARDS.uni_chapter_quiz_pass).toBe(30);
    expect(COIN_AWARDS.uni_level_test_pass).toBe(150);
    for (const e of ["uni_lesson_complete", "uni_chapter_quiz_pass", "uni_level_test_pass"] as const) {
      expect(SERVER_ONLY_REWARD_EVENTS).toContain(e);
      expect(awardCoinsInputSchema.safeParse({ eventType: e, dedupeKey: "x" }).success, e).toBe(false);
    }
  });

  it("the two courses together stay below the top level", () => {
    const ps =
      AUTHORED_CHAPTERS.reduce((n, c) => n + c.lessons.length * COIN_AWARDS.ps_lesson_complete + c.exercises.length * COIN_AWARDS.ps_exercise_pass + COIN_AWARDS.ps_chapter_complete, 0) +
      Object.keys(LEVEL_TESTS).length * COIN_AWARDS.ps_level_test_pass;
    const uni = 75 * COIN_AWARDS.uni_lesson_complete + 15 * COIN_AWARDS.uni_chapter_quiz_pass + 3 * COIN_AWARDS.uni_level_test_pass;
    expect(uni).toBeGreaterThan(1000);
    expect(levelForCoinBalance(ps + uni)).toBeLessThan(11);
    expect(levelForCoinBalance(ps + uni)).toBeGreaterThanOrEqual(8);
  });
});
