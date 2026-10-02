/**
 * Top Profitable Ideas for Vibe-Coders -- pure domain logic (Director-approved,
 * 2026-10-02 six-step feasibility study, step 5). Deliberately self-contained (no
 * import from features/university): this project's feature folders don't cross-import
 * each other (A-2), so the small ISO-week helper this cron's own weekly idempotency key
 * needs is duplicated here in its own form rather than shared (same precedent already
 * set by features/tools/domain.ts for slugify/normalizeKey).
 */

/** ISO week string (e.g. "2026-W40") for the weekly generation cron's idempotency check. */
export function getIsoWeekString(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

/** Ideas waiting for the admin. Generation pauses at this many so the queue cannot grow unbounded. */
export const MAX_PENDING_REVIEW_IDEAS = 3;

export interface PublicIdea {
  id: string;
  title: string;
  pitch: string;
  body: string;
  createdAt: string;
}
