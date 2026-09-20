import { describe, expect, it } from "vitest";
import { gradeExercise, gradeRepair, validateExerciseContent, type RepairAnswer, type RepairPublic } from "../domain";
import { AUTHORED_CHAPTERS } from "./index";
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
  it("marks a chapter available exactly when it is authored, and lists authored chapters in outline order", () => {
    const authored = AUTHORED_CHAPTERS.map((c) => c.slug);
    const availableInOutline = PROMPT_SCHOOL_OUTLINE.filter((c) => c.available).map((c) => c.slug);
    expect(authored).toEqual(availableInOutline);
  });
  it("plans exactly as many lessons as each authored chapter has", () => {
    for (const ch of AUTHORED_CHAPTERS) {
      const outline = PROMPT_SCHOOL_OUTLINE.find((c) => c.slug === ch.slug);
      expect(outline?.plannedLessons, ch.slug).toBe(ch.lessons.length);
    }
  });
});

describe.each(AUTHORED_CHAPTERS)("Authored chapter $slug", (chapter) => {
  it("has real lessons with unique slugs", () => {
    expect(chapter.lessons.length).toBeGreaterThanOrEqual(4);
    expect(new Set(chapter.lessons.map((l) => l.slug)).size).toBe(chapter.lessons.length);
    for (const l of chapter.lessons) {
      expect(l.body.length, l.slug).toBeGreaterThan(800);
      expect(l.minutes, l.slug).toBeGreaterThan(0);
      expect(l.slug, l.slug).toMatch(/^[a-z0-9-]{1,80}$/);
    }
  });

  it("has 8 exercises with unique slugs and a mix of kinds", () => {
    expect(chapter.exercises).toHaveLength(8);
    expect(new Set(chapter.exercises.map((e) => e.slug)).size).toBe(8);
    expect(new Set(chapter.exercises.map((e) => e.kind)).size).toBeGreaterThanOrEqual(4);
    expect(chapter.exercises.some((e) => e.kind === "repair")).toBe(true);
  });

  it("every exercise is structurally well formed", () => {
    expect(chapter.exercises.flatMap((e) => validateExerciseContent(e))).toEqual([]);
  });

  it("lessons and exercises are free of dashes and AI writing tells", () => {
    const dash = /—|–| -- /;
    for (const l of chapter.lessons) {
      expect(dash.test(l.title + l.body), l.slug).toBe(false);
      expect(hasAiTells(l.title + l.body), l.slug).toBe(false);
    }
    for (const e of chapter.exercises) {
      const text = JSON.stringify({ t: e.title, p: e.promptText, pub: e.public, ex: e.explanation, ans: e.answer });
      expect(dash.test(text), e.slug).toBe(false);
      expect(hasAiTells(text), e.slug).toBe(false);
    }
  });

  it("the correct answer of every non-repair exercise scores full marks", () => {
    for (const e of chapter.exercises) {
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

  it("a wrong choice does not pass, and the wrong answer is not always the first option", () => {
    const correctIndexes = new Set<number>();
    for (const e of chapter.exercises) {
      if (e.kind !== "choice") continue;
      correctIndexes.add(e.answer.correct);
      const stored = { id: e.slug, kind: e.kind, title: e.title, prompt_text: e.promptText, public: e.public, answer: e.answer, explanation: e.explanation };
      const wrong = (e.answer.correct + 1) % e.public.options.length;
      expect(gradeExercise(stored, { index: wrong })?.passed, e.slug).toBe(false);
    }
    // The right answer must not always sit in the same position, or a learner could guess the pattern.
    expect(correctIndexes.size).toBeGreaterThanOrEqual(2);
  });

  it("each repair rubric accepts its model answer and good samples and rejects bad ones", () => {
    for (const e of chapter.exercises) {
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

  it("the shuffled blocks of an order exercise never start in the answer order", () => {
    for (const e of chapter.exercises) {
      if (e.kind !== "order") continue;
      expect(e.public.blocks.map((b) => b.id)).not.toEqual(e.answer.order);
    }
  });
});
