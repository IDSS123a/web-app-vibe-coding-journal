/**
 * Vibe-Coding University domain logic (specs/vibe-coding-university/).
 * Pure functions only -- no DB/network access here (see repository.ts),
 * same layering convention as features/pipeline/domain.ts and
 * features/rewards/domain.ts.
 */

export type CourseProgressStatus = "not_started" | "in_progress" | "completed";

/**
 * Derives a course's progress status from how many of its PUBLISHED
 * lessons the user has completed. Deliberately counts against
 * published lessons only -- stub/pending_review lessons aren't
 * real content yet, so they must never count toward "how much is
 * left," which would make a course look permanently incomplete no
 * matter how much a user finishes (the curriculum keeps growing
 * indefinitely, per its own self-improving design).
 */
export function computeCourseStatus(
  completedCount: number,
  totalPublishedLessons: number,
): CourseProgressStatus {
  if (totalPublishedLessons === 0 || completedCount === 0) return "not_started";
  if (completedCount >= totalPublishedLessons) return "completed";
  return "in_progress";
}

/**
 * ISO week string (e.g. "2026-W38") for the weekly generation cron's
 * idempotency check (university_generation_runs.iso_week, migration
 * 014) -- same UTC-week-boundary convention regardless of
 * OPERATIONS_TIMEZONE, since "once a week" doesn't need the same
 * local-hour precision the daily digest's target-hour gate does.
 */
export function getIsoWeekString(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

/**
 * Key that makes a generation run idempotent (stored in university_generation_runs.iso_week,
 * a column that predates the daily cadence and simply holds this key). Generation used to
 * run once per ISO week, so the supplementary layer produced at most one lesson a week and
 * looked frozen between Mondays (Director, 2026-09-19: "no new questions since a few days
 * ago"). It now runs once per UTC day; set UNIVERSITY_CADENCE=weekly to go back.
 */
export function getGenerationRunKey(date: Date = new Date(), cadence: string | undefined = process.env.UNIVERSITY_CADENCE): string {
  if (cadence === "weekly") return getIsoWeekString(date);
  return date.toISOString().slice(0, 10);
}

/** Lessons waiting for the admin. Generation pauses at this many so the queue cannot grow unbounded. */
export const MAX_PENDING_REVIEW_LESSONS = 5;

/**
 * Chapter gating (Director's 2026-09-15 structural requirement,
 * specs/vibe-coding-university/SPEC.md Amendment): chapter 1 of a
 * level is always open; chapter N (N>1) unlocks only once chapter
 * N-1's quiz has been PASSED (chapter_quiz_attempts, migration 017) --
 * not merely attempted. `passedChapterOrderIndexes` is the set of
 * order_index values the user has a passing attempt for, scoped to a
 * single course/level (callers pass one course's data, not a
 * cross-level set).
 */
export function isChapterUnlocked(
  chapterOrderIndex: number,
  passedChapterOrderIndexes: ReadonlySet<number>,
): boolean {
  if (chapterOrderIndex <= 1) return true;
  return passedChapterOrderIndexes.has(chapterOrderIndex - 1);
}

/**
 * A chapter's quiz becomes available once every core lesson IN that
 * chapter is marked complete (SPEC: "nakon svakog poglavlja korisnik
 * mora odgovoriti na 5 pitanja" -- after finishing the chapter, not
 * partway through it).
 */
export function isChapterQuizAvailable(
  chapterLessonIds: readonly string[],
  completedLessonIds: ReadonlySet<string>,
): boolean {
  if (chapterLessonIds.length === 0) return false;
  return chapterLessonIds.every((id) => completedLessonIds.has(id));
}

export const CHAPTER_QUIZ_QUESTION_COUNT = 5;
/** Confirmed with the Director 2026-09-15: 4 of 5 (80%) to pass. */
export const CHAPTER_QUIZ_PASSING_SCORE = 4;

export interface QuizGradeResult {
  score: number;
  passed: boolean;
}

/**
 * Grades a submitted quiz attempt. `answers` and `correctIndexes` are
 * aligned by question order (both callers -- chapter quiz and level
 * test API routes -- build them from the same ordered question list,
 * so index-alignment is safe here without re-matching by question id).
 */
export function gradeQuiz(
  answers: readonly number[],
  correctIndexes: readonly number[],
  passingScore: number,
): QuizGradeResult {
  const score = answers.reduce(
    (count, answer, i) => (answer === correctIndexes[i] ? count + 1 : count),
    0,
  );
  return { score, passed: score >= passingScore };
}

/**
 * The level final test unlocks once every chapter in that level has a
 * passing quiz attempt -- which, transitively via isChapterQuizAvailable
 * above, already implies every core lesson in the level is complete
 * too (SPEC: "nakon svih... lekcija i svih poglavlja").
 */
export function isLevelTestUnlocked(totalChaptersInLevel: number, passedChapterCount: number): boolean {
  if (totalChaptersInLevel === 0) return false;
  return passedChapterCount >= totalChaptersInLevel;
}
