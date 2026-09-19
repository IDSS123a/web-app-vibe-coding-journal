/**
 * Prompt School domain logic (specs/prompt-school/). Pure functions: exercise types, grading and the
 * pass rules. No I/O. Every grader is deterministic and free (no AI request), so practice can be
 * attempted as often as a learner likes without touching the shared free AI quota (PDL-058).
 *
 * An exercise has two halves. `public` is what the learner sees. `answer` holds the correct values or
 * the rubric and stays on the server until an attempt has been graded (see toPublicExercise).
 */

import { z } from "zod";

export type ExerciseKind = "choice" | "fill" | "order" | "spot" | "repair";
export type PromptSchoolLevel = "beginner" | "intermediate" | "advanced";

/** An exercise passes at this share of its points; a chapter passes at this average best score. */
export const PASS_SCORE = 0.75;
export const MAX_REPAIR_LENGTH = 4000;

// ---------- what the learner sees ----------

export interface ChoicePublic { options: string[] }
/** template holds markers {{id}}; each blank offers a list of choices. */
export interface FillPublic { template: string; blanks: Array<{ id: string; choices: string[] }> }
export interface OrderPublic { blocks: Array<{ id: string; text: string }> }
export interface SpotPublic { segments: Array<{ id: string; text: string }> }
export interface RepairPublic { starter: string; hint?: string }

// ---------- what grades an attempt (server only) ----------

export interface ChoiceAnswer { correct: number }
export interface FillAnswer { correct: Record<string, string> }
export interface OrderAnswer { order: string[] }
export interface SpotAnswer { flawed: string[] }
export interface RepairCriterion {
  id: string;
  label: string;
  weight: number;
  /** Regular expression sources (case-insensitive). The criterion is met when ANY of them matches. */
  anyOf: string[];
  /** Shown when the criterion is missed. */
  hint: string;
}
export interface RepairAnswer { criteria: RepairCriterion[]; model: string }

export type ExerciseContent =
  | { slug: string; kind: "choice"; title: string; promptText: string; public: ChoicePublic; answer: ChoiceAnswer; explanation: string }
  | { slug: string; kind: "fill"; title: string; promptText: string; public: FillPublic; answer: FillAnswer; explanation: string }
  | { slug: string; kind: "order"; title: string; promptText: string; public: OrderPublic; answer: OrderAnswer; explanation: string }
  | { slug: string; kind: "spot"; title: string; promptText: string; public: SpotPublic; answer: SpotAnswer; explanation: string }
  | { slug: string; kind: "repair"; title: string; promptText: string; public: RepairPublic; answer: RepairAnswer; explanation: string };

export interface StoredExercise {
  id: string;
  kind: ExerciseKind;
  title: string;
  prompt_text: string;
  public: unknown;
  answer: unknown;
  explanation: string;
}

// ---------- submissions (validated at the API boundary, E-2) ----------

export const submissionSchemas = {
  choice: z.object({ index: z.number().int().min(0).max(20) }),
  fill: z.object({ values: z.record(z.string().max(80), z.string().max(200)) }),
  order: z.object({ order: z.array(z.string().max(80)).max(30) }),
  spot: z.object({ picked: z.array(z.string().max(80)).max(30) }),
  repair: z.object({ text: z.string().max(MAX_REPAIR_LENGTH) }),
} as const;

export type Submission = {
  choice: z.infer<typeof submissionSchemas.choice>;
  fill: z.infer<typeof submissionSchemas.fill>;
  order: z.infer<typeof submissionSchemas.order>;
  spot: z.infer<typeof submissionSchemas.spot>;
  repair: z.infer<typeof submissionSchemas.repair>;
};

// ---------- results ----------

export interface FeedbackLine {
  label: string;
  ok: boolean;
  hint?: string;
}

export interface GradeResult {
  /** 0 to 1. */
  score: number;
  passed: boolean;
  feedback: FeedbackLine[];
  /** The correct answer or a model answer, shown only after grading. */
  reveal: unknown;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const passes = (score: number, exact: boolean) => (exact ? score >= 1 : score >= PASS_SCORE);

export function gradeChoice(pub: ChoicePublic, answer: ChoiceAnswer, sub: Submission["choice"]): GradeResult {
  const ok = sub.index === answer.correct;
  return {
    score: ok ? 1 : 0,
    passed: ok,
    feedback: [{ label: ok ? "Correct choice" : "Not the best choice", ok }],
    reveal: { correctIndex: answer.correct, correctText: pub.options[answer.correct] },
  };
}

export function gradeFill(pub: FillPublic, answer: FillAnswer, sub: Submission["fill"]): GradeResult {
  const feedback: FeedbackLine[] = [];
  let right = 0;
  for (const blank of pub.blanks) {
    const wanted = answer.correct[blank.id];
    const ok = sub.values[blank.id] === wanted;
    if (ok) right++;
    feedback.push({ label: `Blank ${blank.id}`, ok, hint: ok ? undefined : "Look again at what this part of the prompt is for." });
  }
  const score = pub.blanks.length === 0 ? 0 : round2(right / pub.blanks.length);
  return { score, passed: passes(score, false), feedback, reveal: { correct: answer.correct } };
}

export function gradeOrder(pub: OrderPublic, answer: OrderAnswer, sub: Submission["order"]): GradeResult {
  const total = answer.order.length;
  const validIds = new Set(pub.blocks.map((b) => b.id));
  const submitted = sub.order.filter((id) => validIds.has(id));
  let right = 0;
  const feedback: FeedbackLine[] = answer.order.map((id, i) => {
    const ok = submitted[i] === id;
    if (ok) right++;
    return { label: `Position ${i + 1}`, ok, hint: ok ? undefined : "This place holds a different part." };
  });
  const score = total === 0 ? 0 : round2(right / total);
  return { score, passed: passes(score, false), feedback, reveal: { order: answer.order } };
}

export function gradeSpot(pub: SpotPublic, answer: SpotAnswer, sub: Submission["spot"]): GradeResult {
  const picked = new Set(sub.picked.filter((id) => pub.segments.some((s) => s.id === id)));
  const flawed = new Set(answer.flawed);
  const missed = [...flawed].filter((id) => !picked.has(id));
  const wrong = [...picked].filter((id) => !flawed.has(id));
  const exact = missed.length === 0 && wrong.length === 0;
  const feedback: FeedbackLine[] = [];
  if (exact) feedback.push({ label: "You found every flaw and nothing else", ok: true });
  if (missed.length > 0) feedback.push({ label: `${missed.length} flaw${missed.length > 1 ? "s" : ""} not found`, ok: false, hint: "Read each part again and ask what it lets the model guess." });
  if (wrong.length > 0) feedback.push({ label: `${wrong.length} part${wrong.length > 1 ? "s" : ""} marked that ${wrong.length > 1 ? "are" : "is"} fine`, ok: false });
  return { score: exact ? 1 : 0, passed: exact, feedback, reveal: { flawed: answer.flawed } };
}

/** Rubric grading of a rewritten prompt: the weighted share of criteria whose patterns match. */
export function gradeRepair(pub: RepairPublic, answer: RepairAnswer, sub: Submission["repair"]): GradeResult {
  const text = sub.text.trim();
  if (text === "" || text === pub.starter.trim()) {
    return {
      score: 0,
      passed: false,
      feedback: [{ label: "The prompt has not been changed yet", ok: false, hint: "Rewrite it so that it fixes the problems." }],
      reveal: { model: answer.model },
    };
  }
  let earned = 0;
  let total = 0;
  const feedback: FeedbackLine[] = answer.criteria.map((c) => {
    total += c.weight;
    const ok = c.anyOf.some((src) => new RegExp(src, "i").test(text));
    if (ok) earned += c.weight;
    return { label: c.label, ok, hint: ok ? undefined : c.hint };
  });
  const score = total === 0 ? 0 : round2(earned / total);
  return { score, passed: passes(score, false), feedback, reveal: { model: answer.model } };
}

/** Grades a submission against a stored exercise. Returns null when the submission has the wrong shape for the kind. */
export function gradeExercise(ex: StoredExercise, rawSubmission: unknown): GradeResult | null {
  switch (ex.kind) {
    case "choice": {
      const p = submissionSchemas.choice.safeParse(rawSubmission);
      return p.success ? gradeChoice(ex.public as ChoicePublic, ex.answer as ChoiceAnswer, p.data) : null;
    }
    case "fill": {
      const p = submissionSchemas.fill.safeParse(rawSubmission);
      return p.success ? gradeFill(ex.public as FillPublic, ex.answer as FillAnswer, p.data) : null;
    }
    case "order": {
      const p = submissionSchemas.order.safeParse(rawSubmission);
      return p.success ? gradeOrder(ex.public as OrderPublic, ex.answer as OrderAnswer, p.data) : null;
    }
    case "spot": {
      const p = submissionSchemas.spot.safeParse(rawSubmission);
      return p.success ? gradeSpot(ex.public as SpotPublic, ex.answer as SpotAnswer, p.data) : null;
    }
    case "repair": {
      const p = submissionSchemas.repair.safeParse(rawSubmission);
      return p.success ? gradeRepair(ex.public as RepairPublic, ex.answer as RepairAnswer, p.data) : null;
    }
  }
}

/** The part of an exercise the browser may see before an attempt: never the answer or the explanation. */
export function toPublicExercise(ex: StoredExercise): { id: string; kind: ExerciseKind; title: string; promptText: string; public: unknown } {
  return { id: ex.id, kind: ex.kind, title: ex.title, promptText: ex.prompt_text, public: ex.public };
}

/** Average of the best scores over ALL exercises of a chapter; an exercise never attempted counts as 0. */
export function chapterScore(bestScores: Record<string, number>, exerciseIds: string[]): number {
  if (exerciseIds.length === 0) return 0;
  const sum = exerciseIds.reduce((s, id) => s + (bestScores[id] ?? 0), 0);
  return round2(sum / exerciseIds.length);
}

export function chapterPassed(score: number): boolean {
  return score >= PASS_SCORE;
}

/** Splits a fill template into text and blank parts for rendering. */
export function splitTemplate(template: string): Array<{ text: string } | { blank: string }> {
  const out: Array<{ text: string } | { blank: string }> = [];
  const re = /\{\{([a-z0-9_-]+)\}\}/gi;
  let last = 0;
  for (let m = re.exec(template); m; m = re.exec(template)) {
    if (m.index > last) out.push({ text: template.slice(last, m.index) });
    out.push({ blank: m[1]! });
    last = m.index + m[0].length;
  }
  if (last < template.length) out.push({ text: template.slice(last) });
  return out;
}

/** Structural problems of an authored exercise, for the content test. Empty means well formed. */
export function validateExerciseContent(ex: ExerciseContent): string[] {
  const problems: string[] = [];
  const tag = `${ex.kind}:${ex.slug}`;
  if (!ex.title || !ex.promptText || !ex.explanation) problems.push(`${tag}: title, prompt text and explanation are required`);
  switch (ex.kind) {
    case "choice":
      if (ex.public.options.length < 2 || ex.public.options.length > 6) problems.push(`${tag}: 2 to 6 options`);
      if (!Number.isInteger(ex.answer.correct) || ex.answer.correct < 0 || ex.answer.correct >= ex.public.options.length) problems.push(`${tag}: correct index out of range`);
      if (new Set(ex.public.options).size !== ex.public.options.length) problems.push(`${tag}: duplicate options`);
      break;
    case "fill": {
      const ids = splitTemplate(ex.public.template).flatMap((p) => ("blank" in p ? [p.blank] : []));
      const blankIds = ex.public.blanks.map((b) => b.id);
      if (ids.length === 0) problems.push(`${tag}: no blanks in the template`);
      if (JSON.stringify([...ids].sort()) !== JSON.stringify([...blankIds].sort())) problems.push(`${tag}: template markers and blanks differ`);
      for (const b of ex.public.blanks) {
        if (b.choices.length < 2) problems.push(`${tag}: blank ${b.id} needs 2 or more choices`);
        if (!b.choices.includes(ex.answer.correct[b.id] ?? "")) problems.push(`${tag}: blank ${b.id} correct value is not among its choices`);
      }
      break;
    }
    case "order": {
      const ids = ex.public.blocks.map((b) => b.id);
      if (ids.length < 3) problems.push(`${tag}: at least 3 blocks`);
      if (JSON.stringify([...ids].sort()) !== JSON.stringify([...ex.answer.order].sort())) problems.push(`${tag}: answer order must use exactly the block ids`);
      if (JSON.stringify(ids) === JSON.stringify(ex.answer.order)) problems.push(`${tag}: blocks are shown already in the correct order`);
      break;
    }
    case "spot": {
      const ids = ex.public.segments.map((s) => s.id);
      if (ex.answer.flawed.length === 0) problems.push(`${tag}: at least one flawed segment`);
      for (const f of ex.answer.flawed) if (!ids.includes(f)) problems.push(`${tag}: flawed id ${f} is not a segment`);
      break;
    }
    case "repair":
      if (ex.answer.criteria.length < 3) problems.push(`${tag}: at least 3 criteria`);
      for (const c of ex.answer.criteria) {
        if (c.weight <= 0) problems.push(`${tag}: criterion ${c.id} weight must be positive`);
        if (c.anyOf.length === 0) problems.push(`${tag}: criterion ${c.id} has no pattern`);
        for (const src of c.anyOf) {
          try {
            new RegExp(src, "i");
          } catch {
            problems.push(`${tag}: criterion ${c.id} has an invalid pattern ${src}`);
          }
        }
      }
      if (ex.public.starter.trim() === ex.answer.model.trim()) problems.push(`${tag}: starter equals the model answer`);
      break;
  }
  return problems;
}
