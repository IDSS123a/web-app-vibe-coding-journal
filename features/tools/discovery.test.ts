import { describe, expect, it } from "vitest";
import { cleanCandidateName, isKnownTool, mergeObservation, shouldPromote, type CandidateState } from "./discovery";
import { normalizeKey } from "./domain";

describe("candidate names", () => {
  it("cleans quotes and spacing, and rejects names that are too long, empty, numeric, or six+ words", () => {
    expect(cleanCandidateName('  "Linear  AI" ')).toBe("Linear AI");
    expect(cleanCandidateName("a")).toBeNull();
    expect(cleanCandidateName("x".repeat(80))).toBeNull();
    expect(cleanCandidateName("one two three four five six seven")).toBeNull();
    expect(cleanCandidateName("12345")).toBeNull();
  });

  it("recognises a tool that is already known by its normalised name", () => {
    const known = new Set([normalizeKey("Cursor"), normalizeKey("v0.dev")]);
    expect(isKnownTool("cursor", known)).toBe(true);
    expect(isKnownTool("V0.DEV", known)).toBe(true);
    expect(isKnownTool("Windsurf", known)).toBe(false);
  });
});

describe("promotion rule", () => {
  const now = new Date("2026-09-19T12:00:00Z");
  const base = (over: Partial<CandidateState>): CandidateState => ({
    name: "Cursor",
    slug: "cursor",
    description: "An AI code editor.",
    url: "https://cursor.com",
    pricing: "paid",
    mention_count: 3,
    source_names: ["Vercel Blog", "Hacker News"],
    article_ids: ["a", "b", "c"],
    first_seen_at: "2026-09-10T00:00:00Z",
    last_seen_at: "2026-09-18T00:00:00Z",
    ...over,
  });

  it("promotes a tool seen in three articles from two sources inside the window", () => {
    expect(shouldPromote(base({}), now)).toBe(true);
  });

  it("does not promote one source repeating itself, too few mentions, or a stale tool", () => {
    expect(shouldPromote(base({ source_names: ["Vercel Blog"] }), now)).toBe(false);
    expect(shouldPromote(base({ mention_count: 2 }), now)).toBe(false);
    expect(shouldPromote(base({ last_seen_at: "2026-08-20T00:00:00Z" }), now)).toBe(false);
  });

  it("never promotes a rejected or already promoted candidate", () => {
    expect(shouldPromote(base({ status: "rejected" }), now)).toBe(false);
    expect(shouldPromote(base({ status: "promoted" }), now)).toBe(false);
  });
});

describe("observations", () => {
  it("counts distinct articles only, so a repeat sighting does not inflate the count", () => {
    const first = mergeObservation(null, {
      name: "Cursor",
      description: "An AI code editor.",
      url: "https://cursor.com",
      pricing: "paid",
      articleIds: ["a", "b"],
      sources: ["X"],
      seenAt: "2026-09-15T00:00:00Z",
    });
    expect(first.mention_count).toBe(2);

    const again = mergeObservation(first, {
      name: "Cursor",
      description: "A different phrasing of the same tool.",
      url: "https://cursor.com/pricing",
      pricing: "free",
      articleIds: ["b", "c"],
      sources: ["Y"],
      seenAt: "2026-09-18T00:00:00Z",
    });
    expect(again.mention_count).toBe(3);
    expect(again.source_names).toEqual(["X", "Y"]);
    expect(again.last_seen_at).toBe("2026-09-18T00:00:00Z");
    expect(again.first_seen_at).toBe("2026-09-15T00:00:00Z");
  });

  it("keeps the first recorded description, url and pricing rather than overwriting them", () => {
    const first = mergeObservation(null, {
      name: "Cursor",
      description: "Original description.",
      url: "https://cursor.com",
      pricing: "paid",
      articleIds: ["a"],
      sources: ["X"],
      seenAt: "2026-09-15T00:00:00Z",
    });
    expect(first.description).toBe("Original description.");
    expect(first.url).toBe("https://cursor.com");
    expect(first.pricing).toBe("paid");
  });
});
