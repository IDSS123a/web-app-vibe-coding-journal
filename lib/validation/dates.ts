import { z } from "zod";

/**
 * A real calendar date in YYYY-MM-DD form. The plain pattern /^\d{4}-\d{2}-\d{2}$/ also accepts
 * 2026-13-45, which then reached the database and came back as a 500 (found by the security probe,
 * 2026-09-19). A bad date is the caller's mistake, so it must be a 400 or 404, never a server error.
 */
export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export const calendarDateSchema = z.string().refine(isCalendarDate, "Invalid calendar date");
