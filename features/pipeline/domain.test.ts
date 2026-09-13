import { describe, expect, it } from "vitest";
import {
  SIMILARITY_THRESHOLD,
  TITLE_SIMILARITY_THRESHOLD,
  clusterDuplicateEvents,
  cosineSimilarity,
  hashMatch,
  isDuplicate,
  type ClusterableArticle,
} from "./domain";

describe("hashMatch", () => {
  it("is true for identical hashes", () => {
    expect(hashMatch("abc123", "abc123")).toBe(true);
  });

  it("is false for different hashes", () => {
    expect(hashMatch("abc123", "def456")).toBe(false);
  });
});

describe("cosineSimilarity", () => {
  it("is 1 for identical text", () => {
    expect(cosineSimilarity("Cursor ships new agent mode", "Cursor ships new agent mode")).toBe(1);
  });

  it("is 0 for completely different text", () => {
    expect(cosineSimilarity("Cursor agent mode release", "banana bread recipe today")).toBe(0);
  });

  it("is 0 when either input is empty", () => {
    expect(cosineSimilarity("", "something")).toBe(0);
    expect(cosineSimilarity("something", "")).toBe(0);
  });

  it("ignores short/common words (length <= 2)", () => {
    // "an", "is", "at" filtered out -- similarity driven by the real content words
    expect(cosineSimilarity("an is at Cursor", "an is at Cursor")).toBe(1);
  });

  it("is case-insensitive", () => {
    expect(cosineSimilarity("CURSOR AGENT MODE", "cursor agent mode")).toBe(1);
  });
});

describe("isDuplicate", () => {
  it("detects a hash match regardless of other fields", () => {
    const result = isDuplicate(
      { hash: "same", title: "Title A", raw_summary: "Summary A" },
      { hash: "same", title: "Completely different title", raw_summary: "Different summary" },
    );
    expect(result.isDuplicate).toBe(true);
    expect(result.reason).toBe("hash_match");
    expect(result.confidence).toBe(1.0);
  });

  it("detects a summary similarity match above SIMILARITY_THRESHOLD", () => {
    const summary = "Cursor 2.0 ships a new autonomous agent mode for multi-file code editing tasks";
    const result = isDuplicate(
      { hash: "a", raw_summary: summary, title: "Cursor news" },
      { hash: "b", raw_summary: summary, title: "Different headline" },
    );
    expect(result.isDuplicate).toBe(true);
    expect(result.reason).toBe("similarity_match");
    expect(result.confidence).toBeGreaterThanOrEqual(SIMILARITY_THRESHOLD);
  });

  it("detects a title match (same event, different source wording) even with unrelated summaries", () => {
    const result = isDuplicate(
      {
        hash: "a",
        title: "Anthropic introduces MCP support for Claude Code agents",
        raw_summary: "Official announcement text describing the new protocol integration in detail.",
      },
      {
        hash: "b",
        title: "Anthropic introduces MCP support for Claude Code agents in latest update",
        raw_summary: "Community discussion thread reacting to the announcement with mixed opinions.",
      },
    );
    expect(result.isDuplicate).toBe(true);
    expect(result.reason).toBe("title_match");
    expect(result.confidence).toBeGreaterThanOrEqual(TITLE_SIMILARITY_THRESHOLD);
  });

  it("does not flag two genuinely different articles as duplicates", () => {
    const result = isDuplicate(
      { hash: "a", title: "Cursor ships new agent mode", raw_summary: "Cursor release notes for agent mode." },
      { hash: "b", title: "Windsurf 2.0 pricing changes announced", raw_summary: "Windsurf updates its pricing tiers." },
    );
    expect(result.isDuplicate).toBe(false);
    expect(result.reason).toBe("not_duplicate");
  });

  it("does not crash or false-match on missing title/summary fields", () => {
    const result = isDuplicate({ hash: "a" }, { hash: "b" });
    expect(result.isDuplicate).toBe(false);
  });
});

describe("clusterDuplicateEvents", () => {
  function makeArticle(overrides: Partial<ClusterableArticle>): ClusterableArticle {
    return {
      id: "id",
      hash: "hash",
      title: "title",
      raw_summary: null,
      published_at: new Date().toISOString(),
      ...overrides,
    };
  }

  it("groups two sources covering the same event, keeping the earliest as canonical", () => {
    const first = makeArticle({
      id: "first",
      hash: "h1",
      title: "Anthropic introduces MCP support for Claude Code agents",
      published_at: "2026-09-13T08:00:00Z",
    });
    const second = makeArticle({
      id: "second",
      hash: "h2",
      title: "Anthropic introduces MCP support for Claude Code agents in latest update",
      published_at: "2026-09-13T12:00:00Z", // later
    });

    const clusters = clusterDuplicateEvents([second, first]); // unsorted input on purpose

    expect(clusters).toHaveLength(1);
    expect(clusters[0]?.canonicalId).toBe("first"); // earliest published wins
    expect(clusters[0]?.duplicateIds).toEqual(["second"]);
  });

  it("keeps genuinely distinct articles as separate clusters", () => {
    const a = makeArticle({ id: "a", hash: "h1", title: "Cursor ships new agent mode" });
    const b = makeArticle({ id: "b", hash: "h2", title: "Windsurf 2.0 pricing changes announced" });

    const clusters = clusterDuplicateEvents([a, b]);

    expect(clusters).toHaveLength(2);
    expect(clusters.map((c) => c.canonicalId).sort()).toEqual(["a", "b"]);
    expect(clusters.every((c) => c.duplicateIds.length === 0)).toBe(true);
  });

  it("returns an empty array for an empty input", () => {
    expect(clusterDuplicateEvents([])).toEqual([]);
  });

  it("handles three-way coverage of the same event as one cluster", () => {
    const articles = [
      makeArticle({ id: "1", hash: "h1", title: "Cursor 2.0 ships new agent mode", published_at: "2026-09-13T06:00:00Z" }),
      makeArticle({ id: "2", hash: "h2", title: "Cursor 2.0 ships new agent mode for multi-file edits", published_at: "2026-09-13T08:00:00Z" }),
      makeArticle({ id: "3", hash: "h3", title: "Cursor 2.0 ships new agent mode, community reacts", published_at: "2026-09-13T10:00:00Z" }),
    ];

    const clusters = clusterDuplicateEvents(articles);

    expect(clusters).toHaveLength(1);
    expect(clusters[0]?.canonicalId).toBe("1");
    expect(clusters[0]?.duplicateIds.sort()).toEqual(["2", "3"]);
  });
});
