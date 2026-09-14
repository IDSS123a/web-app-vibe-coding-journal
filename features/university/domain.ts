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
