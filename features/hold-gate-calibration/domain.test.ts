import { describe, expect, it } from "vitest";
import {
  FALSE_POSITIVE_RATE_THRESHOLD,
  MIN_OCCURRENCES_FOR_SUGGESTION,
  buildSummaryMarkdown,
  deriveSuggestions,
  detectHypeWordsInReport,
  groupFindingsByHoldReason,
} from "./domain";
import type { HoldGateCalibrationFinding } from "@/lib/validation/schemas";

function makeFinding(overrides: Partial<HoldGateCalibrationFinding> = {}): HoldGateCalibrationFinding {
  return {
    id: "f1",
    run_id: "r1",
    report_id: "rep1",
    report_date: "2026-09-01",
    hold_reason: "revolutionary",
    verdict: "false_positive",
    ai_reasoning: "test reasoning",
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("detectHypeWordsInReport", () => {
  it("finds a hype word and returns a surrounding excerpt", () => {
    const results = detectHypeWordsInReport({
      id: "rep1",
      date: "2026-09-01",
      markdown: "This is a REVOLUTIONARY new tool for developers.",
    });
    expect(results).toHaveLength(1);
    expect(results[0]?.hypeWord).toBe("revolutionary");
    expect(results[0]?.excerpt.toLowerCase()).toContain("revolutionary");
    expect(results[0]?.reportId).toBe("rep1");
  });

  it("returns an empty array for markdown with no hype words", () => {
    expect(
      detectHypeWordsInReport({ id: "rep1", date: "2026-09-01", markdown: "A perfectly ordinary report." }),
    ).toEqual([]);
  });

  it("finds multiple distinct hype words in the same report", () => {
    const results = detectHypeWordsInReport({
      id: "rep1",
      date: "2026-09-01",
      markdown: "This is unprecedented and also a total game changer.",
    });
    const words = results.map((r) => r.hypeWord).sort();
    expect(words).toEqual(["game changer", "unprecedented"]);
  });
});

describe("groupFindingsByHoldReason", () => {
  it("computes the false-positive rate per hold reason", () => {
    const stats = groupFindingsByHoldReason([
      makeFinding({ verdict: "false_positive" }),
      makeFinding({ verdict: "false_positive" }),
      makeFinding({ verdict: "genuine_hype" }),
    ]);
    const revolutionary = stats.find((s) => s.holdReason === "revolutionary");
    expect(revolutionary?.totalOccurrences).toBe(3);
    expect(revolutionary?.falsePositiveCount).toBe(2);
    expect(revolutionary?.genuineHypeCount).toBe(1);
    expect(revolutionary?.falsePositiveRate).toBeCloseTo(2 / 3, 5);
  });

  it("sorts hold reasons by false-positive rate, highest first", () => {
    const stats = groupFindingsByHoldReason([
      makeFinding({ hold_reason: "unprecedented", verdict: "genuine_hype" }),
      makeFinding({ hold_reason: "revolutionary", verdict: "false_positive" }),
    ]);
    expect(stats[0]?.holdReason).toBe("revolutionary");
    expect(stats[1]?.holdReason).toBe("unprecedented");
  });

  it("returns an empty array for no findings", () => {
    expect(groupFindingsByHoldReason([])).toEqual([]);
  });
});

describe("deriveSuggestions", () => {
  it("suggests removal when both thresholds are met", () => {
    const drafts = deriveSuggestions([
      {
        holdReason: "revolutionary",
        totalOccurrences: MIN_OCCURRENCES_FOR_SUGGESTION,
        genuineHypeCount: 0,
        falsePositiveCount: MIN_OCCURRENCES_FOR_SUGGESTION,
        uncertainCount: 0,
        falsePositiveRate: FALSE_POSITIVE_RATE_THRESHOLD,
      },
    ]);
    expect(drafts).toHaveLength(1);
    expect(drafts[0]?.suggestionText).toContain("revolutionary");
  });

  it("does not suggest below the minimum occurrence count, even at 100% false-positive rate", () => {
    const drafts = deriveSuggestions([
      {
        holdReason: "revolutionary",
        totalOccurrences: MIN_OCCURRENCES_FOR_SUGGESTION - 1,
        genuineHypeCount: 0,
        falsePositiveCount: MIN_OCCURRENCES_FOR_SUGGESTION - 1,
        uncertainCount: 0,
        falsePositiveRate: 1,
      },
    ]);
    expect(drafts).toHaveLength(0);
  });

  it("does not suggest below the false-positive rate threshold, even with many occurrences", () => {
    const drafts = deriveSuggestions([
      {
        holdReason: "unprecedented",
        totalOccurrences: 10,
        genuineHypeCount: 10,
        falsePositiveCount: 0,
        uncertainCount: 0,
        falsePositiveRate: FALSE_POSITIVE_RATE_THRESHOLD - 0.01,
      },
    ]);
    expect(drafts).toHaveLength(0);
  });

  it("never applies anything itself -- only ever returns text/rationale drafts", () => {
    const drafts = deriveSuggestions([
      {
        holdReason: "revolutionary",
        totalOccurrences: 5,
        genuineHypeCount: 0,
        falsePositiveCount: 5,
        uncertainCount: 0,
        falsePositiveRate: 1,
      },
    ]);
    expect(Object.keys(drafts[0] ?? {}).sort()).toEqual(["rationale", "suggestionText"]);
  });
});

describe("buildSummaryMarkdown", () => {
  it("reports zero occurrences plainly when there are none", () => {
    expect(buildSummaryMarkdown([], 5)).toBe("Analyzed 5 report(s); no hold-reason occurrences found to judge.");
  });

  it("includes every stat's hold reason and rate in the output", () => {
    const md = buildSummaryMarkdown(
      [
        {
          holdReason: "revolutionary",
          totalOccurrences: 4,
          genuineHypeCount: 0,
          falsePositiveCount: 4,
          uncertainCount: 0,
          falsePositiveRate: 1,
        },
      ],
      3,
    );
    expect(md).toContain("Analyzed 3 new report(s) this run.");
    expect(md).toContain("revolutionary");
    expect(md).toContain("100% false-positive rate");
  });
});
