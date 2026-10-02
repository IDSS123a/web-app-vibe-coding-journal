import { describe, expect, it } from "vitest";
import { getIsoWeekString } from "./domain";

describe("getIsoWeekString", () => {
  it("formats a known date correctly", () => {
    // 2026-09-14 is a Monday in ISO week 38 of 2026.
    expect(getIsoWeekString(new Date("2026-09-14T12:00:00Z"))).toBe("2026-W38");
  });

  it("handles a year boundary correctly", () => {
    // 2026-01-01 is a Thursday, ISO week 1.
    expect(getIsoWeekString(new Date("2026-01-01T12:00:00Z"))).toBe("2026-W01");
  });
});
