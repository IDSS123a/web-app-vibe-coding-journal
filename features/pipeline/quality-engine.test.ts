import { describe, expect, it } from "vitest";
import {
  ARTICLE_CATEGORIES,
  CONFIDENCE_THRESHOLD,
  classifyArticle,
  containsHypeWords,
  evaluateReportHold,
  scoreArticleConfidence,
  shouldHoldForReview,
} from "./quality-engine";
import type { Article } from "@/lib/validation/schemas";

/**
 * Sprint 12: first automated tests this project has ever had (confirmed
 * live 2026-09-11 -- zero test files existed anywhere before this).
 * Scoped to this file's pure functions, no DB/network involved.
 */

function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    title: "A perfectly ordinary article about AI coding tools",
    url: "https://example.com/article",
    source: "GitHub Blog",
    published_at: new Date().toISOString(),
    raw_summary: "A raw summary long enough to count as substantive content for scoring purposes.",
    summary: null,
    why_it_matters: null,
    who_it_affects: null,
    worth_trying: null,
    what_to_watch: null,
    importance_score: null,
    category: null,
    quality_flag: null,
    confidence_score: null,
    relevance_score: null,
    duplicate_of: null,
    hash: "abc123",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("scoreArticleConfidence", () => {
  it("gives a fresh, well-sourced, well-described article a high score", () => {
    const score = scoreArticleConfidence(
      makeArticle({ source: "Hacker News Front Page" }),
    );
    // baseline 0.5 + source(0.1) + freshness(0.1) + title length(0.1) + summary(0.1)
    expect(score).toBeCloseTo(0.9, 5);
  });

  it("never scores below 0 or above 1", () => {
    const veryBad = scoreArticleConfidence(
      makeArticle({
        source: "",
        title: "",
        raw_summary: "",
        published_at: new Date(0).toISOString(),
        quality_flag: "clickbait",
      }),
    );
    expect(veryBad).toBeGreaterThanOrEqual(0);
    expect(veryBad).toBeLessThanOrEqual(1);
  });

  it("penalizes clickbait more than marketing", () => {
    const base = makeArticle({ source: "", title: "", raw_summary: "" });
    const clickbait = scoreArticleConfidence({ ...base, quality_flag: "clickbait" });
    const marketing = scoreArticleConfidence({ ...base, quality_flag: "marketing" });
    expect(clickbait).toBeLessThan(marketing);
  });

  it("gives an old article no freshness bonus", () => {
    const fresh = scoreArticleConfidence(makeArticle());
    const old = scoreArticleConfidence(
      makeArticle({ published_at: new Date("2020-01-01").toISOString() }),
    );
    expect(old).toBeLessThan(fresh);
  });
});

describe("containsHypeWords", () => {
  it("detects a banned hype word case-insensitively", () => {
    expect(containsHypeWords("This is a REVOLUTIONARY new tool.")).toBe(true);
  });

  it("does not flag ordinary text", () => {
    expect(containsHypeWords("This tool adds a new keyboard shortcut.")).toBe(false);
  });

  it("handles empty/falsy input without throwing", () => {
    expect(containsHypeWords("")).toBe(false);
  });

  it("matches a hype word embedded inside a larger word or phrase", () => {
    // Known real false-positive class this project has hit in production
    // (e.g. "Iran's Revolutionary Guard Corps") -- containsHypeWords()
    // itself is a dumb substring match by design; the AI judgment layer
    // (assessRelevance/judgeHoldReason) is what disambiguates, not this.
    expect(containsHypeWords("Iran's Revolutionary Guard Corps issued a statement.")).toBe(true);
  });
});

describe("shouldHoldForReview", () => {
  it("holds for a hype word in the title", () => {
    const result = shouldHoldForReview(
      makeArticle({ title: "This is a groundbreaking release" }),
    );
    expect(result.should).toBe(true);
    expect(result.reason).toMatch(/hype/i);
  });

  it("holds for confidence below the threshold", () => {
    const result = shouldHoldForReview(makeArticle({ confidence_score: CONFIDENCE_THRESHOLD - 0.01 }));
    expect(result.should).toBe(true);
    expect(result.reason).toMatch(/low confidence/i);
  });

  it("does not hold a clean, high-confidence article", () => {
    const result = shouldHoldForReview(
      makeArticle({ title: "A clean article title", confidence_score: CONFIDENCE_THRESHOLD }),
    );
    expect(result.should).toBe(false);
  });

  it("treats a null/undefined confidence_score as not a hold reason on its own", () => {
    const result = shouldHoldForReview(makeArticle({ confidence_score: null }));
    expect(result.should).toBe(false);
  });
});

describe("evaluateReportHold", () => {
  it("holds when any article is below the confidence threshold", () => {
    const decision = evaluateReportHold([
      { title: "ok", summary: null, raw_summary: null, confidence_score: 0.9 },
      { title: "ok", summary: null, raw_summary: null, confidence_score: 0.1 },
    ]);
    expect(decision.hold).toBe(true);
    expect(decision.belowThreshold).toBe(1);
    expect(decision.hypeCount).toBe(0);
  });

  it("holds when any article contains a hype word, regardless of confidence", () => {
    const decision = evaluateReportHold([
      { title: "This changes everything", summary: null, raw_summary: null, confidence_score: 0.99 },
    ]);
    expect(decision.hold).toBe(true);
    expect(decision.hypeCount).toBe(1);
    expect(decision.reasons.some((r) => /hype/i.test(r))).toBe(true);
  });

  it("does not hold a report with no issues", () => {
    const decision = evaluateReportHold([
      { title: "A clean article", summary: null, raw_summary: null, confidence_score: 0.9 },
    ]);
    expect(decision.hold).toBe(false);
    expect(decision.reasons).toHaveLength(0);
  });

  it("returns hold:false for an empty article list (nothing to hold on)", () => {
    const decision = evaluateReportHold([]);
    expect(decision.hold).toBe(false);
  });
});

describe("classifyArticle", () => {
  it("classifies a tool release", () => {
    expect(
      classifyArticle(makeArticle({ title: "Cursor 2.0 launches new agent mode", raw_summary: "" })),
    ).toBe("Tool Release");
  });

  it("classifies a tutorial", () => {
    expect(
      classifyArticle(makeArticle({ title: "A tutorial on prompt engineering", raw_summary: "" })),
    ).toBe("Tutorial");
  });

  it("returns null rather than guessing when nothing matches (M-4)", () => {
    expect(
      classifyArticle(makeArticle({ title: "xyzzy plugh qwerty", raw_summary: "" })),
    ).toBeNull();
  });

  it("only ever returns a category from the declared list, never an invented one", () => {
    const result = classifyArticle(makeArticle({ title: "A tool release announcement", raw_summary: "" }));
    if (result !== null) {
      expect(ARTICLE_CATEGORIES).toContain(result);
    }
  });
});
