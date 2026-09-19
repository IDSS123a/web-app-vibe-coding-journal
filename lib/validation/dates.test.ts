import { describe, expect, it } from "vitest";
import { calendarDateSchema, isCalendarDate } from "./dates";

describe("isCalendarDate", () => {
  it("accepts real dates including a leap day", () => {
    expect(isCalendarDate("2026-09-19")).toBe(true);
    expect(isCalendarDate("2028-02-29")).toBe(true);
  });

  it("rejects impossible dates that only look right", () => {
    for (const bad of ["2026-13-45", "2026-02-30", "2027-02-29", "2026-00-10", "2026-09-31", "0000-00-00"]) expect(isCalendarDate(bad)).toBe(false);
  });

  it("rejects other shapes and injection attempts", () => {
    for (const bad of ["", "2026-9-19", "20260919", "2026-09-19T00:00:00Z", "' OR 1=1--", "../../etc/passwd", "2026-09-19 "]) expect(isCalendarDate(bad)).toBe(false);
    expect(calendarDateSchema.safeParse("2026-13-45").success).toBe(false);
    expect(calendarDateSchema.safeParse("2026-09-19").success).toBe(true);
  });
});
