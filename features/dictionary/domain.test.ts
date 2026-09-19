import { describe, expect, it } from "vitest";
import {
  computeRelatedTerms,
  DICTIONARY_GROUPS,
  groupFromSectionTitle,
  isNewTerm,
  isTrendingTerm,
  letterOf,
  mergeImportedTerms,
  normalizeKey,
  scoreTerm,
  searchTerms,
  slugify,
  splitTermAndAlias,
  type RawImportedTerm,
} from "./domain";
import { parseBookA, parseBookB } from "./import";

const raw = (term: string, definition: string, origin: "book_a" | "book_b", aliases: string[] = []): RawImportedTerm => ({
  term,
  aliases,
  definition,
  section: "S",
  origin,
});

describe("term naming helpers", () => {
  it("splits a trailing bracket into an alias, either way round", () => {
    expect(splitTermAndAlias("Human-in-the-loop (HITL)")).toEqual({ term: "Human-in-the-loop", aliases: ["HITL"] });
    expect(splitTermAndAlias("AFK (Away From Keyboard)")).toEqual({ term: "AFK", aliases: ["Away From Keyboard"] });
    expect(splitTermAndAlias("Prompt")).toEqual({ term: "Prompt", aliases: [] });
  });

  it("normalises names so spelling variants merge", () => {
    expect(normalizeKey("Human-in-the-loop (HITL)")).toBe(normalizeKey("human in the loop"));
    expect(normalizeKey("N+1 query problem")).toBe("n+1 query problem");
  });

  it("makes stable URL slugs", () => {
    expect(slugify("Retrieval-Augmented Generation (RAG)")).toBe("retrieval-augmented-generation");
    expect(slugify("C++")).toBe("c-plus-plus");
    expect(slugify("Q&A")).toBe("q-and-a");
  });

  it("files a term under a letter, symbols under #", () => {
    expect(letterOf("agent")).toBe("A");
    expect(letterOf("2FA")).toBe("#");
  });
});

describe("search ranking", () => {
  const terms = [
    { term: "Prompt injection", aliases: [], definition: "Malicious instructions." },
    { term: "Prompt", aliases: [], definition: "The instruction given to a model." },
    { term: "Context window", aliases: ["CW"], definition: "How much a model can read at once, in tokens." },
    { term: "Token", aliases: [], definition: "A unit of text. Prompt length is measured in tokens." },
  ];

  it("ranks an exact name above a prefix above a definition mention", () => {
    expect(searchTerms(terms, "prompt").map((t) => t.term)).toEqual(["Prompt", "Prompt injection", "Token"]);
  });

  it("finds a term by its alias", () => {
    expect(searchTerms(terms, "cw").map((t) => t.term)).toEqual(["Context window"]);
    expect(scoreTerm(terms[2]!, "CW")).toBe(95);
  });

  it("returns everything for an empty query and nothing for no match", () => {
    expect(searchTerms(terms, "  ")).toHaveLength(4);
    expect(searchTerms(terms, "zzzz")).toEqual([]);
  });

  it("does not choke on regex characters in the query", () => {
    expect(() => searchTerms(terms, "c++ (")).not.toThrow();
  });
});

describe("market markers", () => {
  const now = new Date("2026-09-19T12:00:00Z");
  it("marks only recently discovered terms as new", () => {
    expect(isNewTerm({ origin: "discovered", first_seen_at: "2026-09-10T00:00:00Z" }, now)).toBe(true);
    expect(isNewTerm({ origin: "discovered", first_seen_at: "2026-08-01T00:00:00Z" }, now)).toBe(false);
    expect(isNewTerm({ origin: "book_a", first_seen_at: "2026-09-18T00:00:00Z" }, now)).toBe(false);
  });

  it("marks a term trending when it was mentioned inside the last week", () => {
    expect(isTrendingTerm({ mention_count: 4, last_seen_at: "2026-09-17T00:00:00Z" }, now)).toBe(true);
    expect(isTrendingTerm({ mention_count: 4, last_seen_at: "2026-09-01T00:00:00Z" }, now)).toBe(false);
    expect(isTrendingTerm({ mention_count: 0, last_seen_at: "2026-09-18T00:00:00Z" }, now)).toBe(false);
  });
});

describe("merging the two documents", () => {
  it("keeps every unique term, prefers document A on overlap and unions aliases", () => {
    const a = [raw("Vibe-coding", "A one sentence definition.", "book_a"), raw("Grounding", "Tie answers to sources.", "book_a")];
    const b = [
      raw("Vibe coding", "A longer definition from the second document, which goes on.", "book_b", ["Vibe coding (Karpathy)"]),
      raw("Zero-shot prompting", "No examples given.", "book_b"),
    ];
    const merged = mergeImportedTerms(a, b);
    expect(merged.terms.map((t) => t.term)).toEqual(["Vibe-coding", "Grounding", "Zero-shot prompting"]);
    expect(merged.overlap).toBe(1);
    const vibe = merged.terms[0]!;
    expect(vibe.definition).toBe("A one sentence definition.");
    expect(vibe.inBoth).toBe(true);
    expect(vibe.aliases).toContain("Vibe coding (Karpathy)");
  });

  it("drops repeats inside one document and counts them", () => {
    const merged = mergeImportedTerms([raw("Index", "x", "book_a"), raw("Index", "y", "book_a")], [raw("Prompt", "p", "book_b"), raw("prompt", "q", "book_b")]);
    expect(merged.terms).toHaveLength(2);
    expect(merged.duplicatesInA).toBe(1);
    expect(merged.duplicatesInB).toBe(1);
  });
});

describe("related terms without AI", () => {
  it("links terms whose name appears in the definition, longest first, never itself", () => {
    const terms = [
      { term: "RAG", definition: "Generating answers using a vector database and semantic search." },
      { term: "Vector database", definition: "Stores embeddings." },
      { term: "Semantic search", definition: "Search by meaning." },
      { term: "Embeddings", definition: "Numbers." },
    ];
    const related = computeRelatedTerms(terms);
    expect(related.get("RAG")).toEqual(["Vector database", "Semantic search"]);
    expect(related.get("Vector database")).toEqual(["Embeddings"]);
  });

  it("does not match short lowercase words such as 'api' inside ordinary text", () => {
    const related = computeRelatedTerms([
      { term: "API", definition: "An interface." },
      { term: "Rapid prototyping", definition: "Building quickly with a rapid api call." },
    ]);
    expect(related.get("Rapid prototyping")).toEqual([]);
  });
});

describe("section fallbacks and taxonomy", () => {
  it("maps document sections onto topic groups", () => {
    expect(groupFromSectionTitle("AI Agents and Agentic Development")).toBe("agents");
    expect(groupFromSectionTitle("Security Terms Relevant to Vibe-Coded Applications")).toBe("security");
    expect(groupFromSectionTitle("Something unrelated")).toBe("workflow");
  });

  it("keeps the topic list small enough to browse", () => {
    expect(DICTIONARY_GROUPS.length).toBeLessThanOrEqual(14);
    expect(new Set(DICTIONARY_GROUPS.map((g) => g.id)).size).toBe(DICTIONARY_GROUPS.length);
  });
});

describe("document parsers", () => {
  it("parses document A headings and drops trailing unnumbered sections", () => {
    const md = ["# Title", "## 1. Core", "### 1. Vibe-coding", "Building software", "with an AI.", "", "### 2. Prompt", "An instruction.", "", "## Alphabetical Index", "**A:** Agent"].join("\n");
    const out = parseBookA(md);
    expect(out.map((t) => t.term)).toEqual(["Vibe-coding", "Prompt"]);
    expect(out[0]!.definition).toBe("Building software with an AI.");
    expect(out[0]!.section).toBe("Core");
  });

  it("parses document B bold terms, strips markup and removes AI tells from definitions", () => {
    const md = ["## 1. Core", "**Human-in-the-loop (HITL)**  ", "A person reviews **each** step — in real time.", "", "**Patch**", "Bundled diffs."].join("\n");
    const out = parseBookB(md);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ term: "Human-in-the-loop", aliases: ["HITL"], definition: "A person reviews each step, in real time." });
  });
});
