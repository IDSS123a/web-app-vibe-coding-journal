/**
 * Prompt School rewards (PDL-072): the payouts are small and once-only, the whole course adds up to a sensible
 * number of levels, and the public award endpoint can never be used to claim them.
 */
import { describe, expect, it } from "vitest";
import { COIN_AWARDS, SERVER_ONLY_REWARD_EVENTS, levelForCoinBalance } from "@/features/rewards/domain";
import { awardCoinsInputSchema } from "@/lib/validation/schemas";
import { AUTHORED_CHAPTERS } from "./content";
import { LEVEL_TESTS } from "./content/level-tests";

const PS_EVENTS = ["ps_lesson_complete", "ps_exercise_pass", "ps_chapter_complete", "ps_level_test_pass"] as const;

describe("Prompt School coin payouts", () => {
  it("pays 5 per lesson, 5 per exercise, 50 per chapter and 150 per level test", () => {
    expect(COIN_AWARDS.ps_lesson_complete).toBe(5);
    expect(COIN_AWARDS.ps_exercise_pass).toBe(5);
    expect(COIN_AWARDS.ps_chapter_complete).toBe(50);
    expect(COIN_AWARDS.ps_level_test_pass).toBe(150);
  });

  it("every Prompt School event is server-only", () => {
    for (const e of PS_EVENTS) expect(SERVER_ONLY_REWARD_EVENTS).toContain(e);
  });

  it("the public award endpoint refuses every Prompt School event", () => {
    for (const e of PS_EVENTS) expect(awardCoinsInputSchema.safeParse({ eventType: e, dedupeKey: "x" }).success, e).toBe(false);
  });

  it("finishing the whole course is worth a lot but does not run past the top level", () => {
    const lessons = AUTHORED_CHAPTERS.reduce((n, c) => n + c.lessons.length, 0);
    const exercises = AUTHORED_CHAPTERS.reduce((n, c) => n + c.exercises.length, 0);
    const total =
      lessons * COIN_AWARDS.ps_lesson_complete +
      exercises * COIN_AWARDS.ps_exercise_pass +
      AUTHORED_CHAPTERS.length * COIN_AWARDS.ps_chapter_complete +
      Object.keys(LEVEL_TESTS).length * COIN_AWARDS.ps_level_test_pass;
    expect(total).toBeGreaterThan(2000);
    expect(levelForCoinBalance(total)).toBeGreaterThanOrEqual(7);
    expect(levelForCoinBalance(total)).toBeLessThan(10);
  });
});
