import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  OperationsTimezoneNotConfiguredError,
  isPastCatchUpDeadline,
  isTargetOperationsHour,
} from "./schedule-gate";

/**
 * Sprint 12. `OPERATIONS_TIMEZONE` is deliberately never a real value in
 * committed code/tests (see DECISION_LOG.md's business-location-privacy
 * rationale) -- "UTC" here is just a convenient, DST-free IANA zone for
 * testing the hour-boundary math itself, not a stand-in for the real
 * configured value.
 */

const ORIGINAL_TZ = process.env.OPERATIONS_TIMEZONE;

beforeEach(() => {
  process.env.OPERATIONS_TIMEZONE = "UTC";
});

afterEach(() => {
  if (ORIGINAL_TZ === undefined) {
    delete process.env.OPERATIONS_TIMEZONE;
  } else {
    process.env.OPERATIONS_TIMEZONE = ORIGINAL_TZ;
  }
});

describe("isTargetOperationsHour", () => {
  it("is true during the target local hour (07:xx)", () => {
    expect(isTargetOperationsHour(new Date("2026-01-15T07:30:00Z"))).toBe(true);
  });

  it("is false one hour before the target", () => {
    expect(isTargetOperationsHour(new Date("2026-01-15T06:59:00Z"))).toBe(false);
  });

  it("is false one hour after the target", () => {
    expect(isTargetOperationsHour(new Date("2026-01-15T08:00:00Z"))).toBe(false);
  });

  it("throws OperationsTimezoneNotConfiguredError when unset -- fails loudly (P-1.1), no hardcoded fallback", () => {
    delete process.env.OPERATIONS_TIMEZONE;
    expect(() => isTargetOperationsHour(new Date())).toThrow(OperationsTimezoneNotConfiguredError);
  });
});

describe("isPastCatchUpDeadline", () => {
  it("is false right at the target hour (nothing to catch up on yet)", () => {
    expect(isPastCatchUpDeadline(new Date("2026-01-15T07:00:00Z"))).toBe(false);
  });

  it("is false just before the catch-up deadline (target + 5h)", () => {
    expect(isPastCatchUpDeadline(new Date("2026-01-15T11:59:00Z"))).toBe(false);
  });

  it("is true exactly at the catch-up deadline", () => {
    expect(isPastCatchUpDeadline(new Date("2026-01-15T12:00:00Z"))).toBe(true);
  });

  it("is true well past the catch-up deadline", () => {
    expect(isPastCatchUpDeadline(new Date("2026-01-15T23:00:00Z"))).toBe(true);
  });

  it("does not wrap around at local midnight (regression for finding #14, corrections/SPRINT_06_LESSONS.md)", () => {
    // Just before local midnight the same UTC calendar day -- must still
    // correctly read as "past today's deadline", not reset.
    expect(isPastCatchUpDeadline(new Date("2026-01-15T23:59:00Z"))).toBe(true);
  });

  it("throws OperationsTimezoneNotConfiguredError when unset", () => {
    delete process.env.OPERATIONS_TIMEZONE;
    expect(() => isPastCatchUpDeadline(new Date())).toThrow(OperationsTimezoneNotConfiguredError);
  });
});
