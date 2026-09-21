import { describe, expect, it } from "vitest";
import { evaluateHealth, REPORT_STALE_AFTER_HOURS } from "./domain";

const now = new Date("2026-10-01T09:00:00Z");
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000);

describe("evaluateHealth (PDL-081)", () => {
  it("is quiet when everything is fine", () => {
    expect(evaluateHealth({ now, latestReportAt: hoursAgo(10), articlesLast24h: 80, ambiguousPaymentsLast24h: 0 })).toEqual([]);
  });

  it("flags a report older than 36 hours, and not one just under", () => {
    expect(evaluateHealth({ now, latestReportAt: hoursAgo(REPORT_STALE_AFTER_HOURS - 1), articlesLast24h: 5, ambiguousPaymentsLast24h: 0 })).toEqual([]);
    const p = evaluateHealth({ now, latestReportAt: hoursAgo(REPORT_STALE_AFTER_HOURS + 5), articlesLast24h: 5, ambiguousPaymentsLast24h: 0 });
    expect(p.map((x) => x.code)).toEqual(["report_stale"]);
    expect(p[0]!.message).toContain("41 hours");
  });

  it("flags no report at all, no articles, and payments that need a person", () => {
    const p = evaluateHealth({ now, latestReportAt: null, articlesLast24h: 0, ambiguousPaymentsLast24h: 2 });
    expect(p.map((x) => x.code)).toEqual(["no_report", "no_articles", "payments_need_attention"]);
  });

  it("wording uses no dashes", () => {
    const p = evaluateHealth({ now, latestReportAt: null, articlesLast24h: 0, ambiguousPaymentsLast24h: 1 });
    for (const x of p) expect(/—|–| -- /.test(x.message)).toBe(false);
  });
});
