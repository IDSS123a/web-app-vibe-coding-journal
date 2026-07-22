/**
 * Gates cron execution to a single target local hour in the business's
 * configured internal operations timezone.
 *
 * The endpoint is triggered hourly by two independent external schedulers
 * (.github/workflows/hourly-digest-trigger.yml, and cron-job.org — Vercel
 * Hobby plan cannot schedule its own cron more than once a day) rather than
 * once at a fixed UTC time — a fixed UTC cron string requires a manual
 * twice-yearly edit whenever the operations timezone crosses a DST
 * boundary, which is exactly the kind of silent-drift risk P-1.1 (fail
 * loudly, no unattended incorrectness) exists to prevent. Firing hourly
 * and checking "is it currently the target local hour?" via a real IANA
 * timezone lookup (`Intl.DateTimeFormat`, which carries DST transition
 * data for every zone) means the correct invocation is always the one
 * that actually runs the pipeline, with no manual schedule maintenance.
 *
 * Two independent triggers exist because a single one (GitHub Actions
 * alone) was measured to miss its own hourly schedule badly enough to skip
 * the target hour entirely on some days — see the trigger-reliability
 * findings in corrections/SPRINT_06_LESSONS.md. `isPastCatchUpDeadline`
 * below is a third layer for the case where both triggers miss the target
 * hour on the same day.
 *
 * The timezone identifier itself is intentionally never hardcoded here or
 * anywhere else in committed code — it is read only from the
 * OPERATIONS_TIMEZONE environment variable (set in .env.local, gitignored,
 * and in the Vercel project's private environment variables). This is a
 * deliberate business-location-privacy decision, not an oversight — see
 * DECISION_LOG.md for the recorded rationale.
 */

const TARGET_LOCAL_HOUR = 7; // 07:00 in the configured operations timezone

// Catch-up safety net (2026-07-22): if neither external trigger (GitHub
// Actions, cron-job.org) has landed an invocation inside the target hour by
// this local hour, the next hourly invocation runs the pipeline anyway
// rather than silently waiting for tomorrow. Exists because GitHub Actions'
// own scheduling was measured to miss the target hour outright on ~7% of
// days (see corrections/SPRINT_06_LESSONS.md, the trigger-reliability
// findings) — idempotency (getDailyReportByDate) still governs whether a
// run actually happens; this only widens WHEN a run is allowed to be
// attempted, from "only the exact target hour" to "target hour, or any
// hour past this deadline with no report yet today."
const CATCH_UP_DEADLINE_LOCAL_HOUR = 12; // noon in the configured operations timezone

export class OperationsTimezoneNotConfiguredError extends Error {
  constructor() {
    super("OPERATIONS_TIMEZONE is not configured");
    this.name = "OperationsTimezoneNotConfiguredError";
  }
}

/**
 * Returns the current local hour (0-23) in the configured operations
 * timezone. Throws (fail loudly, P-1.1) if the timezone is not configured —
 * deliberately no hardcoded fallback zone.
 */
function getCurrentOperationsLocalHour(now: Date): number {
  const timezone = process.env.OPERATIONS_TIMEZONE;
  if (!timezone) {
    throw new OperationsTimezoneNotConfiguredError();
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    hour12: false,
  }).formatToParts(now);

  const hourPart = parts.find((p) => p.type === "hour");
  const currentLocalHour = hourPart ? parseInt(hourPart.value, 10) : NaN;

  // Intl can format midnight as "24" in some environments; normalize.
  return currentLocalHour === 24 ? 0 : currentLocalHour;
}

/**
 * Returns true if the current moment, converted to the configured
 * operations timezone, falls within the target local hour.
 */
export function isTargetOperationsHour(now: Date = new Date()): boolean {
  return getCurrentOperationsLocalHour(now) === TARGET_LOCAL_HOUR;
}

/**
 * Returns true once the current local hour has reached the catch-up
 * deadline (noon). Callers should combine this with a same-day idempotency
 * check (never run this bypass alone) — this function only answers "is it
 * late enough to stop waiting for the target hour," not "should we run."
 */
export function isPastCatchUpDeadline(now: Date = new Date()): boolean {
  return getCurrentOperationsLocalHour(now) >= CATCH_UP_DEADLINE_LOCAL_HOUR;
}
