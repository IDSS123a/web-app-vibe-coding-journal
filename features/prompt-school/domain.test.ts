import { describe, expect, it } from "vitest";
import {
  PASS_SCORE,
  chapterPassed,
  chapterScore,
  gradeChoice,
  gradeExercise,
  gradeFill,
  gradeOrder,
  gradeRepair,
  gradeSpot,
  splitTemplate,
  toPublicExercise,
  validateExerciseContent,
  type ExerciseContent,
  type StoredExercise,
} from "./domain";

describe("gradeChoice", () => {
  const pub = { options: ["a", "b", "c"] };
  it("scores the correct index 1 and reveals it", () => {
    const r = gradeChoice(pub, { correct: 1 }, { index: 1 });
    expect(r.score).toBe(1);
    expect(r.passed).toBe(true);
    expect(r.reveal).toEqual({ correctIndex: 1, correctText: "b" });
  });
  it("scores a wrong index 0", () => {
    const r = gradeChoice(pub, { correct: 1 }, { index: 2 });
    expect(r.score).toBe(0);
    expect(r.passed).toBe(false);
  });
});

describe("gradeFill", () => {
  const pub = {
    template: "{{a}} and {{b}}",
    blanks: [
      { id: "a", choices: ["x", "y"] },
      { id: "b", choices: ["x", "y"] },
    ],
  };
  const answer = { correct: { a: "x", b: "y" } };
  it("gives full marks for all blanks right", () => {
    expect(gradeFill(pub, answer, { values: { a: "x", b: "y" } }).score).toBe(1);
  });
  it("gives partial credit and fails below the pass score", () => {
    const r = gradeFill(pub, answer, { values: { a: "x", b: "x" } });
    expect(r.score).toBe(0.5);
    expect(r.passed).toBe(false);
    expect(r.feedback.map((f) => f.ok)).toEqual([true, false]);
  });
  it("counts a missing blank as wrong", () => {
    expect(gradeFill(pub, answer, { values: {} }).score).toBe(0);
  });
  it("passes at exactly the pass score", () => {
    const four = {
      template: "{{a}}{{b}}{{c}}{{d}}",
      blanks: ["a", "b", "c", "d"].map((id) => ({ id, choices: ["x", "y"] })),
    };
    const r = gradeFill(four, { correct: { a: "x", b: "x", c: "x", d: "x" } }, { values: { a: "x", b: "x", c: "x", d: "y" } });
    expect(r.score).toBe(PASS_SCORE);
    expect(r.passed).toBe(true);
  });
});

describe("gradeOrder", () => {
  const pub = { blocks: [{ id: "a", text: "A" }, { id: "b", text: "B" }, { id: "c", text: "C" }, { id: "d", text: "D" }] };
  const answer = { order: ["c", "a", "d", "b"] };
  it("scores a perfect order 1", () => {
    expect(gradeOrder(pub, answer, { order: ["c", "a", "d", "b"] }).score).toBe(1);
  });
  it("gives credit per correct position", () => {
    const r = gradeOrder(pub, answer, { order: ["c", "a", "b", "d"] });
    expect(r.score).toBe(0.5);
    expect(r.passed).toBe(false);
  });
  it("ignores unknown ids and short submissions", () => {
    // Unknown ids are dropped first, so "c" then lands on position 1 and earns that one point.
    expect(gradeOrder(pub, answer, { order: ["zzz", "c"] }).score).toBe(0.25);
    expect(gradeOrder(pub, answer, { order: ["zzz", "yyy"] }).score).toBe(0);
    expect(gradeOrder(pub, answer, { order: [] }).score).toBe(0);
  });
});

describe("gradeSpot", () => {
  const pub = { segments: [{ id: "s1", text: "1" }, { id: "s2", text: "2" }, { id: "s3", text: "3" }] };
  const answer = { flawed: ["s1", "s3"] };
  it("passes only on the exact set", () => {
    expect(gradeSpot(pub, answer, { picked: ["s3", "s1"] }).passed).toBe(true);
  });
  it("fails when a flaw is missed", () => {
    const r = gradeSpot(pub, answer, { picked: ["s1"] });
    expect(r.passed).toBe(false);
    expect(r.feedback[0]?.label).toContain("1 flaw not found");
  });
  it("fails when a fine part is marked", () => {
    const r = gradeSpot(pub, answer, { picked: ["s1", "s2", "s3"] });
    expect(r.passed).toBe(false);
    expect(r.feedback[0]?.label).toContain("1 part marked");
  });
  it("ignores unknown ids", () => {
    expect(gradeSpot(pub, answer, { picked: ["s1", "s3", "nope"] }).passed).toBe(true);
  });
});

describe("gradeRepair", () => {
  const pub = { starter: "Do the thing." };
  const answer = {
    model: "model answer",
    criteria: [
      { id: "a", label: "has audience", weight: 2, anyOf: ["\\bfor beginners\\b"], hint: "name the audience" },
      { id: "b", label: "has limit", weight: 1, anyOf: ["\\bunder \\d+ words\\b", "\\bat most \\d+\\b"], hint: "add a limit" },
    ],
  };
  it("scores the weighted share of matched criteria", () => {
    const r = gradeRepair(pub, answer, { text: "Explain this for beginners." });
    expect(r.score).toBe(0.67);
    expect(r.feedback.map((f) => f.ok)).toEqual([true, false]);
    expect(r.feedback[1]?.hint).toBe("add a limit");
  });
  it("matches case-insensitively and by any pattern", () => {
    const r = gradeRepair(pub, answer, { text: "FOR BEGINNERS, at most 5 points" });
    expect(r.score).toBe(1);
    expect(r.passed).toBe(true);
  });
  it("gives no credit for an unchanged or empty prompt", () => {
    expect(gradeRepair(pub, answer, { text: "  Do the thing.  " }).score).toBe(0);
    expect(gradeRepair(pub, answer, { text: "" }).score).toBe(0);
  });
  it("always reveals the model answer", () => {
    expect(gradeRepair(pub, answer, { text: "x" }).reveal).toEqual({ model: "model answer" });
  });
});

describe("gradeExercise", () => {
  const ex: StoredExercise = {
    id: "e1",
    kind: "choice",
    title: "t",
    prompt_text: "p",
    public: { options: ["a", "b"] },
    answer: { correct: 0 },
    explanation: "why",
  };
  it("grades a well formed submission", () => {
    expect(gradeExercise(ex, { index: 0 })?.score).toBe(1);
  });
  it("returns null for a submission of the wrong shape", () => {
    expect(gradeExercise(ex, { text: "x" })).toBeNull();
    expect(gradeExercise(ex, null)).toBeNull();
    expect(gradeExercise(ex, { index: -1 })).toBeNull();
    expect(gradeExercise(ex, { index: 1.5 })).toBeNull();
  });
  it("rejects an oversized repair text", () => {
    const rep: StoredExercise = { ...ex, kind: "repair", public: { starter: "s" }, answer: { criteria: [], model: "m" } };
    expect(gradeExercise(rep, { text: "x".repeat(4001) })).toBeNull();
  });
});

describe("toPublicExercise", () => {
  it("never carries the answer or the explanation", () => {
    const view = toPublicExercise({
      id: "e1",
      kind: "choice",
      title: "t",
      prompt_text: "p",
      public: { options: ["a", "b"] },
      answer: { correct: 0 },
      explanation: "secret reasoning",
    });
    const json = JSON.stringify(view);
    expect(json).not.toContain("secret reasoning");
    expect(json).not.toContain("correct");
    expect(view.promptText).toBe("p");
  });
});

describe("chapter score", () => {
  it("averages best scores over all exercises, counting untried ones as 0", () => {
    expect(chapterScore({ a: 1, b: 0.5 }, ["a", "b", "c", "d"])).toBe(0.38);
    expect(chapterScore({}, [])).toBe(0);
  });
  it("passes at the pass score", () => {
    expect(chapterPassed(0.75)).toBe(true);
    expect(chapterPassed(0.74)).toBe(false);
  });
});

describe("splitTemplate", () => {
  it("splits text and blanks in order", () => {
    expect(splitTemplate("a {{x}} b {{y}}")).toEqual([{ text: "a " }, { blank: "x" }, { text: " b " }, { blank: "y" }]);
  });
  it("handles a template with no blanks", () => {
    expect(splitTemplate("plain")).toEqual([{ text: "plain" }]);
  });
});

describe("validateExerciseContent", () => {
  const base = { slug: "s", title: "t", promptText: "p", explanation: "e" };
  it("accepts a well formed choice and rejects a bad index", () => {
    const good: ExerciseContent = { ...base, kind: "choice", public: { options: ["a", "b"] }, answer: { correct: 1 } };
    expect(validateExerciseContent(good)).toEqual([]);
    const bad: ExerciseContent = { ...base, kind: "choice", public: { options: ["a", "b"] }, answer: { correct: 5 } };
    expect(validateExerciseContent(bad).join()).toContain("out of range");
  });
  it("flags a fill answer that is not among the choices", () => {
    const bad: ExerciseContent = {
      ...base,
      kind: "fill",
      public: { template: "{{a}}", blanks: [{ id: "a", choices: ["x", "y"] }] },
      answer: { correct: { a: "z" } },
    };
    expect(validateExerciseContent(bad).join()).toContain("not among its choices");
  });
  it("flags an order exercise shown already solved", () => {
    const bad: ExerciseContent = {
      ...base,
      kind: "order",
      public: { blocks: [{ id: "a", text: "A" }, { id: "b", text: "B" }, { id: "c", text: "C" }] },
      answer: { order: ["a", "b", "c"] },
    };
    expect(validateExerciseContent(bad).join()).toContain("already in the correct order");
  });
  it("flags a spot exercise whose flawed id is unknown", () => {
    const bad: ExerciseContent = { ...base, kind: "spot", public: { segments: [{ id: "s1", text: "x" }] }, answer: { flawed: ["s9"] } };
    expect(validateExerciseContent(bad).join()).toContain("not a segment");
  });
  it("flags an invalid regular expression in a repair rubric", () => {
    const bad: ExerciseContent = {
      ...base,
      kind: "repair",
      public: { starter: "s" },
      answer: {
        model: "m",
        criteria: [
          { id: "a", label: "a", weight: 1, anyOf: ["("], hint: "h" },
          { id: "b", label: "b", weight: 1, anyOf: ["x"], hint: "h" },
          { id: "c", label: "c", weight: 1, anyOf: ["y"], hint: "h" },
        ],
      },
    };
    expect(validateExerciseContent(bad).join()).toContain("invalid pattern");
  });
});
