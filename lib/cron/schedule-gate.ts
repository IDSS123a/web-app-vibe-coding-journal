/**
 * Gates cron execution to a single target local hour in the business's
 * configured internal operations timezone.
 *
 * The underlying cron trigger fires hourly (see vercel.json) rather than
 * once at a fixed UTC time — a fixed UTC cron string requires a manual
 * twice-yearly edit whenever the operations timezone crosses a DST
 * boundary, which is exactly the kind of silent-drift risk P-1.1 (fail
 * loudly, no unattended incorrectness) exists to prevent. Firing hourly
 * and checking "is it currently the target local hour?" via a real IANA
 * timezone lookup (`Intl.DateTimeFormat`, which carries DST transition
 * data for every zone) means the correct invocation is always the one
 * that actually runs the pipeline, with no manual schedule maintenance.
 *
 * The timezone identifier itself is intentionally never hardcoded here or
 * anywhere else in committed code — it is read only from the
 * OPERATIONS_TIMEZONE environment variable (set in .env.local, gitignored,
 * and in the Vercel project's private environment variables). This is a
 * deliberate business-location-privacy decision, not an oversight — see
 * DECISION_LOG.md for the recorded rationale.
 */

const TARGET_LOCAL_HOUR = 7; // 07:00 in the configured operations timezone

export class OperationsTimezoneNotConfiguredError extends Error {
  constructor() {
    super("OPERATIONS_TIMEZONE is not configured");
    this.name = "OperationsTimezoneNotConfiguredError";
  }
}

/**
 * Returns true if the current moment, converted to the configured
 * operations timezone, falls within the target local hour.
 * Throws (fail loudly, P-1.1) if the timezone is not configured — this
 * function deliberately has no hardcoded fallback zone.
 */
export function isTargetOperationsHour(now: Date = new Date()): boolean {
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
  const normalizedHour = currentLocalHour === 24 ? 0 : currentLocalHour;

  return normalizedHour === TARGET_LOCAL_HOUR;
}
