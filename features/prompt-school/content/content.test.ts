import { describe, expect, it } from "vitest";
import { gradeExercise, gradeRepair, validateExerciseContent, type RepairAnswer, type RepairPublic } from "../domain";
import { FIVE_PILLARS_EXERCISES, FIVE_PILLARS_LESSONS } from "./five-pillars";
import { PLANNED_LESSON_TOTAL, PROMPT_SCHOOL_OUTLINE } from "./outline";
import { hasAiTells } from "@/lib/text/no-ai-tells";

describe("Prompt School outline", () => {
  it("has unique slugs and a plan of about 45 lessons", () => {
    const slugs = PROMPT_SCHOOL_OUTLINE.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(PLANNED_LESSON_TOTAL).toBeGreaterThanOrEqual(40);
    expect(PLANNED_LESSON_TOTAL).toBeLessThanOrEqual(50);
  });
  it("covers all three levels", () => {
    const levels = new Set(PROMPT_SCHOOL_OUTLINE.map((c) => c.level));
    expect([...levels].sort()).toEqual(["advanced", "beginner", "intermediate"]);
  });
  it("plans the five pillars chapter with as many lessons as are authored", () => {
    const ch = PROMPT_SCHOOL_OUTLINE.find((c) => c.slug === "five-pillars");
    expect(ch?.available).toBe(true);
    expect(ch?.plannedLessons).toBe(FIVE_PILLARS_LESSONS.length);
  });
});

describe("Five Pillars content", () => {
  it("has 6 lessons with unique slugs and real bodies", () => {
    expect(FIVE_PILLARS_LESSONS).toHaveLength(6);
    expect(new Set(FIVE_PILLARS_LESSONS.map((l) => l.slug)).size).toBe(6);
    for (const l of FIVE_PILLARS_LESSONS) {
      expect(l.body.length).toBeGreaterThan(800);
      expect(l.minutes).toBeGreaterThan(0);
    }
  });

  it("has 8 exercises with unique slugs, every kind used", () => {
    expect(FIVE_PILLARS_EXERCISES).toHaveLength(8);
    expect(new Set(FIVE_PILLARS_EXERCISES.map((e) => e.slug)).size).toBe(8);
    expect(new Set(FIVE_PILLARS_EXERCISES.map((e) => e.kind))).toEqual(new Set(["choice", "fill", "order", "spot", "repair"]));
  });

  it("every exercise is structurally well formed", () => {
    const problems = FIVE_PILLARS_EXERCISES.flatMap((e) => validateExerciseContent(e));
    expect(problems).toEqual([]);
  });

  it("every exercise, read by learners, is free of AI writing tells and dashes", () => {
    const dash = /—|–| -- /;
    for (const l of FIVE_PILLARS_LESSONS) {
      expect(dash.test(l.title + l.body), l.slug).toBe(false);
      expect(hasAiTells(l.title + l.body), l.slug).toBe(false);
    }
    for (const e of FIVE_PILLARS_EXERCISES) {
      const text = JSON.stringify({ t: e.title, p: e.promptText, pub: e.public, ex: e.explanation, ans: e.answer });
      expect(dash.test(text), e.slug).toBe(false);
      expect(hasAiTells(text), e.slug).toBe(false);
    }
  });

  it("the correct answer of every non-repair exercise scores full marks", () => {
    for (const e of FIVE_PILLARS_EXERCISES) {
      const stored = { id: e.slug, kind: e.kind, title: e.title, prompt_text: e.promptText, public: e.public, answer: e.answer, explanation: e.explanation };
      let submission: unknown;
      if (e.kind === "choice") submission = { index: e.answer.correct };
      else if (e.kind === "fill") submission = { values: e.answer.correct };
      else if (e.kind === "order") submission = { order: e.answer.order };
      else if (e.kind === "spot") submission = { picked: e.answer.flawed };
      else continue;
      const r = gradeExercise(stored, submission);
      expect(r?.score, e.slug).toBe(1);
      expect(r?.passed, e.slug).toBe(true);
    }
  });

  it("a wrong first answer does not pass a choice exercise", () => {
    for (const e of FIVE_PILLARS_EXERCISES) {
      if (e.kind !== "choice") continue;
      const stored = { id: e.slug, kind: e.kind, title: e.title, prompt_text: e.promptText, public: e.public, answer: e.answer, explanation: e.explanation };
      const wrong = (e.answer.correct + 1) % e.public.options.length;
      expect(gradeExercise(stored, { index: wrong })?.passed).toBe(false);
    }
  });

  it("each repair rubric accepts its model answer and good samples and rejects bad ones", () => {
    const repairs = FIVE_PILLARS_EXERCISES.filter((e) => e.kind === "repair");
    expect(repairs.length).toBeGreaterThanOrEqual(2);
    for (const e of repairs) {
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

  it("the shuffled order block lists never start in the answer order", () => {
    for (const e of FIVE_PILLARS_EXERCISES) {
      if (e.kind !== "order") continue;
      expect(e.public.blocks.map((b) => b.id)).not.toEqual(e.answer.order);
    }
  });
});
