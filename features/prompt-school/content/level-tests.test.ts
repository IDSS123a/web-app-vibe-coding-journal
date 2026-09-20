/**
 * Level tests (specs/prompt-school/, phase B): each test is well formed, every chapter of its level is checked at
 * least once, every answer key and repair rubric works, and the wording follows the writing rule.
 */
import { describe, expect, it } from "vitest";
import { hasAiTells } from "@/lib/text/no-ai-tells";
import { gradeExercise, gradeRepair, isLevelTestUnlocked, levelTestPassed, levelTestScore, validateExerciseContent, type RepairAnswer, type RepairPublic } from "../domain";
import { LEVEL_TESTS } from "./level-tests";
import { PROMPT_SCHOOL_OUTLINE } from "./outline";
import { AUTHORED_CHAPTERS } from "./index";

const LEVELS = ["beginner", "intermediate", "advanced"] as const;

describe.each(LEVELS)("level test: %s", (level) => {
  const test = LEVEL_TESTS[level];
  const chaptersOfLevel = PROMPT_SCHOOL_OUTLINE.filter((c) => c.level === level).map((c) => c.slug);

  it("has at least 10 questions with unique slugs, a mix of kinds and a repair question", () => {
    expect(test.length).toBeGreaterThanOrEqual(10);
    expect(new Set(test.map((e) => e.slug)).size).toBe(test.length);
    expect(new Set(test.map((e) => e.kind)).size).toBeGreaterThanOrEqual(4);
    expect(test.some((e) => e.kind === "repair")).toBe(true);
  });

  it("checks every chapter of the level at least once, and only chapters of the level", () => {
    for (const slug of chaptersOfLevel) expect(test.some((e) => e.chapter === slug), `${level} checks ${slug}`).toBe(true);
    for (const e of test) expect(chaptersOfLevel, `${e.slug} -> ${e.chapter}`).toContain(e.chapter);
  });

  it("every question is structurally well formed", () => {
    expect(test.flatMap((e) => validateExerciseContent(e))).toEqual([]);
  });

  it("is free of dashes and AI writing tells", () => {
    const dash = /—|–| -- /;
    for (const e of test) {
      const text = JSON.stringify({ t: e.title, p: e.promptText, pub: e.public, ex: e.explanation, ans: e.answer });
      expect(dash.test(text), e.slug).toBe(false);
      expect(hasAiTells(text), e.slug).toBe(false);
    }
  });

  it("the correct answer of every non-repair question scores full marks", () => {
    for (const e of test) {
      const stored = { id: e.slug, kind: e.kind, title: e.title, prompt_text: e.promptText, public: e.public, answer: e.answer, explanation: e.explanation };
      let submission: unknown;
      if (e.kind === "choice") submission = { index: e.answer.correct };
      else if (e.kind === "fill") submission = { values: e.answer.correct };
      else if (e.kind === "order") submission = { order: e.answer.order };
      else if (e.kind === "spot") submission = { picked: e.answer.flawed };
      else continue;
      expect(gradeExercise(stored, submission)?.score, e.slug).toBe(1);
    }
  });

  it("a wrong choice fails, and the right option does not always sit in the same position", () => {
    const positions = new Set<number>();
    for (const e of test) {
      if (e.kind !== "choice") continue;
      positions.add(e.answer.correct);
      const stored = { id: e.slug, kind: e.kind, title: e.title, prompt_text: e.promptText, public: e.public, answer: e.answer, explanation: e.explanation };
      expect(gradeExercise(stored, { index: (e.answer.correct + 1) % e.public.options.length })?.passed, e.slug).toBe(false);
    }
    expect(positions.size).toBeGreaterThanOrEqual(2);
  });

  it("each repair rubric accepts its model answer and good samples and rejects bad ones", () => {
    for (const e of test) {
      if (e.kind !== "repair") continue;
      const pub: RepairPublic = e.public;
      const answer: RepairAnswer = e.answer;
      expect(gradeRepair(pub, answer, { text: answer.model }).score, `${e.slug} model`).toBe(1);
      expect(e.samples?.good.length, `${e.slug} has good samples`).toBeGreaterThan(0);
      expect(e.samples?.bad.length, `${e.slug} has bad samples`).toBeGreaterThan(0);
      for (const g of e.samples?.good ?? []) expect(gradeRepair(pub, answer, { text: g }).passed, `${e.slug} good: ${g.slice(0, 40)}`).toBe(true);
      for (const b of e.samples?.bad ?? []) expect(gradeRepair(pub, answer, { text: b }).passed, `${e.slug} bad: ${b.slice(0, 40)}`).toBe(false);
    }
  });

  it("the shuffled blocks of an order question never start in the answer order", () => {
    for (const e of test) {
      if (e.kind !== "order") continue;
      expect(e.public.blocks.map((b) => b.id)).not.toEqual(e.answer.order);
    }
  });
});

describe("level tests versus the chapter practice", () => {
  it("no level test question repeats a chapter exercise (the tests are new questions)", () => {
    const practiceTitles = new Set(AUTHORED_CHAPTERS.flatMap((c) => c.exercises.map((e) => e.title.toLowerCase())));
    for (const level of LEVELS) {
      for (const e of LEVEL_TESTS[level]) expect(practiceTitles.has(e.title.toLowerCase()), `${level}/${e.slug}: ${e.title}`).toBe(false);
    }
  });

  it("all level test slugs are unique within their level", () => {
    for (const level of LEVELS) expect(new Set(LEVEL_TESTS[level].map((e) => e.slug)).size).toBe(LEVEL_TESTS[level].length);
  });
});

describe("level test rules", () => {
  it("unlocks only when the level has chapters and all are complete", () => {
    expect(isLevelTestUnlocked([])).toBe(false);
    expect(isLevelTestUnlocked([true, true, false])).toBe(false);
    expect(isLevelTestUnlocked([true, true, true])).toBe(true);
  });

  it("scores over ALL questions, so an unanswered question counts as zero", () => {
    expect(levelTestScore([1, 1, 1, 1], 5)).toBe(0.8);
    expect(levelTestScore([], 5)).toBe(0);
    expect(levelTestScore([1], 0)).toBe(0);
  });

  it("passes at 80 percent, the University's bar", () => {
    expect(levelTestPassed(0.8)).toBe(true);
    expect(levelTestPassed(0.79)).toBe(false);
  });
});
