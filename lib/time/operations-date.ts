/**
 * Returns "today" as a YYYY-MM-DD string in the configured operations
 * timezone (the same OPERATIONS_TIMEZONE env var lib/cron/schedule-gate.ts
 * uses for the daily report's target-hour gate — see that file's comment
 * for why the zone is never hardcoded). Used by the rewards system
 * (features/rewards/domain.ts, DECISION_LOG.md PDL-030) to decide whether
 * a streak continues, breaks, or is already counted for today — same
 * "calendar day" definition the rest of the product already uses, not a
 * second one based on the visitor's browser timezone.
 *
 * Deliberately fails loudly (P-1.1) rather than silently falling back to
 * UTC — a wrong streak day boundary is a real, if minor, correctness bug
 * (a user's streak could break a day early or late), not something to
 * guess past.
 */
export class OperationsTimezoneNotConfiguredError extends Error {
  constructor() {
    super("OPERATIONS_TIMEZONE is not configured");
    this.name = "OperationsTimezoneNotConfiguredError";
  }
}

export function getOperationsLocalDateString(now: Date = new Date()): string {
  const timezone = process.env.OPERATIONS_TIMEZONE;
  if (!timezone) {
    throw new OperationsTimezoneNotConfiguredError();
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const getPart = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
}
