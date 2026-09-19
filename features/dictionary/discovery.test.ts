import { describe, expect, it } from "vitest";
import {
  cleanCandidateName,
  findMentions,
  isKnownTerm,
  isMatchableName,
  mergeObservation,
  shouldPromote,
  type CandidateState,
} from "./discovery";
import { normalizeKey } from "./domain";

const article = (id: string, source: string, title: string, summary = "", published_at = "2026-09-18T00:00:00Z") => ({ id, source, title, summary, published_at });

describe("mentions of known terms, no AI", () => {
  const terms = [
    { id: "t1", term: "Model Context Protocol", aliases: ["MCP"] },
    { id: "t2", term: "Human-in-the-loop", aliases: ["HITL"] },
    { id: "t3", term: "Prompt", aliases: [] },
    { id: "t4", term: "Context window", aliases: [] },
  ];

  it("finds a term by its name or alias, counting each article once", () => {
    const out = findMentions(terms, [
      article("a1", "Vercel Blog", "WebMCP support now in mcp-handler", "MCP servers, MCP clients"),
      article("a2", "GitHub Blog", "Skills and the Model Context Protocol"),
    ]);
    expect(out.get("t1")?.articleIds).toEqual(["a1", "a2"]);
    expect(out.get("t1")?.sources).toEqual(["Vercel Blog", "GitHub Blog"]);
  });

  it("matches multi word terms across punctuation and case", () => {
    const out = findMentions(terms, [article("a1", "HN", "Bigger CONTEXT WINDOW, same price", "Human in the loop review helps")]);
    expect([...out.keys()].sort()).toEqual(["t2", "t4"]);
  });

  it("never matches a plain single word such as prompt, performance or security", () => {
    expect(isMatchableName("Prompt")).toBe(false);
    expect(isMatchableName("Performance")).toBe(false);
    expect(findMentions(terms, [article("a1", "HN", "A better prompt for agents")]).has("t3")).toBe(false);
  });

  it("does match acronyms, product-like names, hyphenated and multi word terms and allow-listed words", () => {
    for (const name of ["MCP", "LLM", "AGENTS.md", "Vibe-coding", "Context window", "Hallucination", "Copilot"]) expect(isMatchableName(name)).toBe(true);
  });

  it("records the newest article date as last seen", () => {
    const out = findMentions(terms, [article("a1", "HN", "MCP news", "", "2026-09-10T00:00:00Z"), article("a2", "HN", "More MCP", "", "2026-09-17T00:00:00Z")]);
    expect(out.get("t1")?.lastSeenAt).toBe("2026-09-17T00:00:00Z");
  });
});

describe("candidate names", () => {
  it("cleans quotes and spacing, and rejects names that are too long or empty", () => {
    expect(cleanCandidateName('  "Spec  drift" ')).toBe("Spec drift");
    expect(cleanCandidateName("ab")).toBeNull();
    expect(cleanCandidateName("x".repeat(80))).toBeNull();
    expect(cleanCandidateName("one two three four five six seven")).toBeNull();
    expect(cleanCandidateName("12345")).toBeNull();
  });

  it("recognises a term that is already known by name or alias", () => {
    const known = new Set([normalizeKey("Human-in-the-loop"), normalizeKey("HITL")]);
    expect(isKnownTerm("human in the loop", known)).toBe(true);
    expect(isKnownTerm("hitl", known)).toBe(true);
    expect(isKnownTerm("spec drift", known)).toBe(false);
  });
});

describe("promotion rule", () => {
  const now = new Date("2026-09-19T12:00:00Z");
  const base = (over: Partial<CandidateState>): CandidateState => ({
    term: "Spec drift",
    slug: "spec-drift",
    mention_count: 3,
    source_names: ["Vercel Blog", "Hacker News"],
    article_ids: ["a", "b", "c"],
    first_seen_at: "2026-09-10T00:00:00Z",
    last_seen_at: "2026-09-18T00:00:00Z",
    ...over,
  });

  it("promotes a term seen in three articles from two sources inside the window", () => {
    expect(shouldPromote(base({}), now)).toBe(true);
  });

  it("does not promote one source repeating itself, too few mentions, or a stale term", () => {
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
    const first = mergeObservation(null, { term: "Spec drift", definition: "d", articleIds: ["a", "b"], sources: ["X"], seenAt: "2026-09-15T00:00:00Z" });
    expect(first.mention_count).toBe(2);
    const again = mergeObservation(first, { term: "Spec drift", definition: "d", articleIds: ["b", "c"], sources: ["Y"], seenAt: "2026-09-18T00:00:00Z" });
    expect(again.mention_count).toBe(3);
    expect(again.source_names).toEqual(["X", "Y"]);
    expect(again.last_seen_at).toBe("2026-09-18T00:00:00Z");
    expect(again.first_seen_at).toBe("2026-09-15T00:00:00Z");
  });
});
