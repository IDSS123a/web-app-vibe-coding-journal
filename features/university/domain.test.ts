import { describe, it, expect } from "vitest";
import { computeCourseStatus, getIsoWeekString } from "./domain";

describe("computeCourseStatus", () => {
  it("is not_started with zero completed lessons", () => {
    expect(computeCourseStatus(0, 5)).toBe("not_started");
  });

  it("is not_started when the course has no published lessons yet", () => {
    expect(computeCourseStatus(0, 0)).toBe("not_started");
  });

  it("is in_progress partway through", () => {
    expect(computeCourseStatus(2, 5)).toBe("in_progress");
  });

  it("is completed once every published lesson is done", () => {
    expect(computeCourseStatus(5, 5)).toBe("completed");
  });

  it("stays completed if completed count exceeds current total (course grew after completion, still counts as caught up)", () => {
    expect(computeCourseStatus(5, 5)).toBe("completed");
  });
});

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
