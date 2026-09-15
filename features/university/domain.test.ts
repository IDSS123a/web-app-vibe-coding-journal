import { describe, it, expect } from "vitest";
import {
  computeCourseStatus,
  getIsoWeekString,
  isChapterUnlocked,
  isChapterQuizAvailable,
  gradeQuiz,
  isLevelTestUnlocked,
  CHAPTER_QUIZ_PASSING_SCORE,
} from "./domain";

describe("computeCourseStatus", () => {
  it("is not_started with zero completed lessons", () => {
    expect(computeCourseStatus(0, 5)).toBe("not_started");
  });

  it("is not_started when the course has no published lessons yet", () => {
    expect(computeCourseStatus(0, 0)).toBe("not_started");
  });

  it("is in_progress partway through", () => {
    expect(computeCourseStatus(2, 5)).toBe("in_progress");
  });

  it("is completed once every published lesson is done", () => {
    expect(computeCourseStatus(5, 5)).toBe("completed");
  });

  it("stays completed if completed count exceeds current total (course grew after completion, still counts as caught up)", () => {
    expect(computeCourseStatus(5, 5)).toBe("completed");
  });
});

describe("getIsoWeekString", () => {
  it("formats a known date correctly", () => {
    // 2026-09-14 is a Monday in ISO week 38 of 2026.
    expect(getIsoWeekString(new Date("2026-09-14T12:00:00Z"))).toBe("2026-W38");
  });

  it("handles a year boundary correctly", () => {
    // 2026-01-01 is a Thursday, ISO week 1.
    expect(getIsoWeekString(new Date("2026-01-01T12:00:00Z"))).toBe("2026-W01");
  });
});

describe("isChapterUnlocked", () => {
  it("chapter 1 is always unlocked", () => {
    expect(isChapterUnlocked(1, new Set())).toBe(true);
  });

  it("chapter 2 is locked until chapter 1 is passed", () => {
    expect(isChapterUnlocked(2, new Set())).toBe(false);
    expect(isChapterUnlocked(2, new Set([1]))).toBe(true);
  });

  it("chapter 4 needs chapter 3 specifically, not just any earlier pass", () => {
    expect(isChapterUnlocked(4, new Set([1, 2]))).toBe(false);
    expect(isChapterUnlocked(4, new Set([1, 2, 3]))).toBe(true);
  });
});

describe("isChapterQuizAvailable", () => {
  it("is unavailable for a chapter with no lessons yet", () => {
    expect(isChapterQuizAvailable([], new Set())).toBe(false);
  });

  it("is unavailable until every lesson in the chapter is completed", () => {
    expect(isChapterQuizAvailable(["a", "b", "c"], new Set(["a", "b"]))).toBe(false);
  });

  it("is available once every lesson in the chapter is completed", () => {
    expect(isChapterQuizAvailable(["a", "b", "c"], new Set(["a", "b", "c", "d"]))).toBe(true);
  });
});

describe("gradeQuiz", () => {
  it("scores a perfect attempt", () => {
    const result = gradeQuiz([0, 1, 2, 3, 0], [0, 1, 2, 3, 0], CHAPTER_QUIZ_PASSING_SCORE);
    expect(result).toEqual({ score: 5, passed: true });
  });

  it("passes at exactly the threshold (4 of 5)", () => {
    const result = gradeQuiz([0, 1, 2, 3, 1], [0, 1, 2, 3, 0], CHAPTER_QUIZ_PASSING_SCORE);
    expect(result).toEqual({ score: 4, passed: true });
  });

  it("fails just below the threshold (3 of 5)", () => {
    const result = gradeQuiz([0, 1, 2, 1, 1], [0, 1, 2, 3, 0], CHAPTER_QUIZ_PASSING_SCORE);
    expect(result).toEqual({ score: 3, passed: false });
  });

  it("scores zero for an all-wrong attempt", () => {
    const result = gradeQuiz([1, 2, 3, 0, 1], [0, 1, 2, 3, 0], CHAPTER_QUIZ_PASSING_SCORE);
    expect(result).toEqual({ score: 0, passed: false });
  });
});

describe("isLevelTestUnlocked", () => {
  it("is locked with zero chapters passed", () => {
    expect(isLevelTestUnlocked(4, 0)).toBe(false);
  });

  it("is locked with some but not all chapters passed", () => {
    expect(isLevelTestUnlocked(4, 3)).toBe(false);
  });

  it("unlocks once every chapter in the level is passed", () => {
    expect(isLevelTestUnlocked(4, 4)).toBe(true);
  });

  it("is never unlocked for a level with no chapters defined", () => {
    expect(isLevelTestUnlocked(0, 0)).toBe(false);
  });
});
