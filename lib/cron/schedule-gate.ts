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

// Catch-up safety net (2026-07-22, fixed 2026-07-24 — see finding #14 in
// corrections/SPRINT_06_LESSONS.md): if neither external trigger (GitHub
// Actions, cron-job.org) has landed an invocation inside the target hour by
// this many hours after it, the next hourly invocation runs the pipeline
// anyway rather than silently waiting for tomorrow. Idempotency
// (getDailyReportByDate) still governs whether a run actually happens; this
// only widens WHEN a run is allowed to be attempted.
//
// Expressed as an OFFSET from TARGET_LOCAL_HOUR, not an absolute local hour
// — the original "local hour >= 12" version wrapped to 0 at local midnight
// (a ~2-hour UTC window each day, local midnight falling before UTC
// midnight in this operations timezone), permanently disabling catch-up
// for the rest of that UTC calendar day even though it wasn't over yet. Fixed by
// comparing linear UTC timestamps (today's target instant + this offset)
// instead of cyclical local-hour numbers — a timestamp comparison has no
// wrap-around, regardless of what local hour "now" happens to be.
const CATCH_UP_OFFSET_HOURS = 5; // 07:00 + 5h = noon local, unchanged behavior

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
 * Returns the real UTC instant corresponding to TARGET_LOCAL_HOUR:00:00 on
 * "today" — today meaning the current local calendar date in the
 * configured operations timezone, evaluated at `now`. Uses the same
 * iterative Intl-correction technique as the rest of this project's
 * timezone math (no manual UTC-offset arithmetic, DST-safe by
 * construction): guess a UTC instant, see what local wall-clock time it
 * actually displays as in the target zone, correct by the difference,
 * repeat. Two iterations is enough to converge for any real IANA zone.
 */
function getTodaysTargetInstantUTC(now: Date, timezone: string): Date {
  const dateParts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const getPart = (parts: Intl.DateTimeFormatPart[], type: string) =>
    parts.find((p) => p.type === type)!.value;

  const year = Number(getPart(dateParts, "year"));
  const month = Number(getPart(dateParts, "month"));
  const day = Number(getPart(dateParts, "day"));
  const wantedAsUTC = Date.UTC(year, month - 1, day, TARGET_LOCAL_HOUR, 0, 0);

  let guess = new Date(wantedAsUTC);
  for (let i = 0; i < 2; i++) {
    const shownParts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(guess);
    const shownHour = Number(getPart(shownParts, "hour"));
    const shownAsUTC = Date.UTC(
      Number(getPart(shownParts, "year")),
      Number(getPart(shownParts, "month")) - 1,
      Number(getPart(shownParts, "day")),
      shownHour === 24 ? 0 : shownHour,
      Number(getPart(shownParts, "minute")),
      Number(getPart(shownParts, "second")),
    );
    guess = new Date(guess.getTime() + (wantedAsUTC - shownAsUTC));
  }
  return guess;
}

/**
 * Returns true once real elapsed time has passed CATCH_UP_OFFSET_HOURS
 * past today's target instant — a linear UTC timestamp comparison, not a
 * cyclical local-hour comparison, so it cannot wrap around at local
 * midnight (finding #14). Callers should combine this with a same-day
 * idempotency check (never run this bypass alone) — this function only
 * answers "is it late enough to stop waiting for the target hour," not
 * "should we run."
 */
export function isPastCatchUpDeadline(now: Date = new Date()): boolean {
  const timezone = process.env.OPERATIONS_TIMEZONE;
  if (!timezone) {
    throw new OperationsTimezoneNotConfiguredError();
  }

  const todaysTarget = getTodaysTargetInstantUTC(now, timezone);
  const deadline = todaysTarget.getTime() + CATCH_UP_OFFSET_HOURS * 60 * 60 * 1000;
  return now.getTime() >= deadline;
}
