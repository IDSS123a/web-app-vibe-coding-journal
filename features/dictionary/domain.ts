/**
 * Dictionary domain logic (specs/knowledge-growth-and-dictionary/). Pure functions only.
 *
 * The Dictionary grows from 13 to about 2,600 terms, so the vocabulary that keeps it
 * usable (topic groups, levels, tiers) lives here and nowhere else (M-7): the importer,
 * the AI classifier prompt, the API and the page all read these constants.
 */

export type DictionaryLevel = "beginner" | "intermediate" | "advanced";
export type DictionaryTier = "core" | "related" | "adjacent";
export type DictionaryOrigin = "book_a" | "book_b" | "lesson" | "discovered";

export const DICTIONARY_LEVELS: readonly { id: DictionaryLevel; label: string }[] = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

/**
 * Tiers keep a very large glossary on topic (CONSTITUTION P-0: the product is not a
 * general AI encyclopedia). Core and related are shown by default; adjacent is behind
 * one toggle so a person who wants Paxos or product quantization can still find it.
 */
export const DICTIONARY_TIERS: readonly { id: DictionaryTier; label: string; description: string; defaultVisible: boolean }[] = [
  { id: "core", label: "Core", description: "Specific to vibe-coding and AI-assisted development", defaultVisible: true },
  { id: "related", label: "Related", description: "Everyday software engineering a vibe-coder meets", defaultVisible: true },
  { id: "adjacent", label: "Advanced and adjacent", description: "Deep machine learning, infrastructure internals, compliance", defaultVisible: false },
];

/** About a dozen top level topics, few enough to browse at a glance. */
export const DICTIONARY_GROUPS: readonly { id: string; label: string; description: string }[] = [
  { id: "vibe-coding", label: "Vibe-Coding & AI-Assisted Development", description: "What vibe-coding is and how people work with AI coding assistants" },
  { id: "agents", label: "Agents & Agentic Workflows", description: "Agents, tools, planning, orchestration, memory" },
  { id: "prompts-context", label: "Prompts, Context & Memory", description: "Prompting, context windows, instructions, grounding" },
  { id: "models", label: "Models & AI Fundamentals", description: "LLMs, tokens, training, inference, embeddings" },
  { id: "tools", label: "Tools, Protocols & Integrations", description: "IDEs, CLIs, MCP, APIs, SDKs, webhooks" },
  { id: "web", label: "Web & App Development", description: "Frontend, backend, frameworks, rendering, browsers" },
  { id: "architecture", label: "Software Architecture & Design", description: "Structure, patterns, principles, state, scaling" },
  { id: "data", label: "Databases, Data & Retrieval", description: "SQL, schemas, auth data, RAG, search, pipelines" },
  { id: "quality", label: "Testing, Quality & Debugging", description: "Tests, QA, bugs, code review, verification" },
  { id: "delivery", label: "Git, Deployment & Operations", description: "Version control, CI/CD, hosting, reliability" },
  { id: "security", label: "Security & Privacy", description: "Vulnerabilities, secrets, access control, attacks" },
  { id: "safety-eval", label: "AI Safety, Evaluation & Reliability", description: "Evals, hallucination, alignment, red teaming" },
  { id: "product", label: "Product, UX & Business", description: "UX, design, cost, pricing, product thinking" },
  { id: "workflow", label: "Workflow, Principles & Failure Modes", description: "Ways of working, rules of thumb, what goes wrong" },
];

export const DICTIONARY_GROUP_IDS: readonly string[] = DICTIONARY_GROUPS.map((g) => g.id);

/**
 * Fallback when the AI classifier is unavailable or returns something unusable: the
 * section titles of the two supplied documents map onto the groups above. Anything
 * unmatched falls to "workflow", the catch-all, and gets `related` and `intermediate`.
 */
const SECTION_HINTS: Array<[RegExp, string]> = [
  [/agent|agentic/i, "agents"],
  [/prompt|context|memory/i, "prompts-context"],
  [/model|llm|inference|training/i, "models"],
  [/tool|protocol|mcp|integration|assistant|interface|harness/i, "tools"],
  [/web development/i, "web"],
  [/architecture/i, "architecture"],
  [/database|data|retrieval|knowledge/i, "data"],
  [/test|qa|verification|quality|evaluation/i, "quality"],
  [/git|deployment|devops|infrastructure|delivery/i, "delivery"],
  [/security/i, "security"],
  [/safety|reliab/i, "safety-eval"],
  [/product|ux|design|business|cost|economic|performance/i, "product"],
  [/vibe|core|slang|culture/i, "vibe-coding"],
];

export function groupFromSectionTitle(section: string): string {
  for (const [pattern, group] of SECTION_HINTS) if (pattern.test(section)) return group;
  return "workflow";
}

export function isValidGroup(id: unknown): id is string {
  return typeof id === "string" && DICTIONARY_GROUP_IDS.includes(id);
}
export function isValidLevel(v: unknown): v is DictionaryLevel {
  return v === "beginner" || v === "intermediate" || v === "advanced";
}
export function isValidTier(v: unknown): v is DictionaryTier {
  return v === "core" || v === "related" || v === "adjacent";
}

/** Lower-case a term, drop a trailing parenthetical, keep letters and digits only. Used to merge duplicates. */
export function normalizeKey(term: string): string {
  return term
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z0-9+#]+/g, " ")
    .trim();
}

export function slugify(term: string): string {
  const base = term
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/&/g, " and ")
    .replace(/\+/g, " plus ")
    .replace(/#/g, " sharp ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "term";
}

/**
 * "Human-in-the-loop (HITL)" becomes the display term "Human-in-the-loop" with the
 * alias "HITL"; "AFK (Away From Keyboard)" becomes "AFK" with the alias "Away From
 * Keyboard". The text in brackets is always kept as an alias so search finds either form.
 */
export function splitTermAndAlias(raw: string): { term: string; aliases: string[] } {
  const m = raw.trim().match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (!m || !m[1]) return { term: raw.trim(), aliases: [] };
  return { term: m[1].trim(), aliases: [m[2]!.trim()] };
}

export function letterOf(term: string): string {
  const c = term.trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(c) ? c : "#";
}

export interface SearchableTerm {
  term: string;
  aliases?: string[] | null;
  definition: string;
}

/** Relevance of one term to a query; 0 means no match. Exact and prefix matches on the name win. */
export function scoreTerm(t: SearchableTerm, rawQuery: string): number {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return 0;
  const name = t.term.toLowerCase();
  if (name === q) return 100;
  if ((t.aliases ?? []).some((a) => a.toLowerCase() === q)) return 95;
  if (name.startsWith(q)) return 85;
  if ((t.aliases ?? []).some((a) => a.toLowerCase().startsWith(q))) return 75;
  if (new RegExp(`(^|[^a-z0-9])${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(name)) return 65;
  if (name.includes(q)) return 45;
  if ((t.aliases ?? []).some((a) => a.toLowerCase().includes(q))) return 35;
  if (t.definition.toLowerCase().includes(q)) return 10;
  return 0;
}

/** Filters and orders by score, then alphabetically. Stable for equal scores. */
export function searchTerms<T extends SearchableTerm>(terms: T[], query: string): T[] {
  if (!query.trim()) return terms;
  return terms
    .map((t) => ({ t, s: scoreTerm(t, query) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.t.term.localeCompare(b.t.term))
    .map((x) => x.t);
}

const DAY_MS = 86_400_000;
export const NEW_TERM_WINDOW_DAYS = 14;
export const TRENDING_WINDOW_DAYS = 7;
/** A term is trending when it appears in at least this many distinct recent articles. */
export const TRENDING_MIN_MENTIONS = 3;

/** A term learned from the market recently. Only auto-discovered terms count as new. */
export function isNewTerm(t: { origin?: string | null; first_seen_at?: string | null }, now: Date): boolean {
  if (t.origin !== "discovered" || !t.first_seen_at) return false;
  return now.getTime() - new Date(t.first_seen_at).getTime() <= NEW_TERM_WINDOW_DAYS * DAY_MS;
}

/** Mentioned in the articles collected inside the trending window. */
export function isTrendingTerm(t: { mention_count?: number | null; last_seen_at?: string | null }, now: Date): boolean {
  if (!t.mention_count || t.mention_count < TRENDING_MIN_MENTIONS || !t.last_seen_at) return false;
  return now.getTime() - new Date(t.last_seen_at).getTime() <= TRENDING_WINDOW_DAYS * DAY_MS;
}

export interface RawImportedTerm {
  term: string;
  aliases: string[];
  definition: string;
  section: string;
  origin: "book_a" | "book_b";
}

export interface MergedTerm extends RawImportedTerm {
  /** Set when the same term appeared in both documents. */
  inBoth: boolean;
}

/**
 * Merge the two documents by normalised name. On overlap the shorter plain-language
 * definition of document A wins (it was written as one sentence for a UI), the
 * aliases of both are kept, and the term is flagged inBoth. Within one document a
 * repeated term keeps its first occurrence.
 */
export function mergeImportedTerms(a: RawImportedTerm[], b: RawImportedTerm[]): { terms: MergedTerm[]; duplicatesInA: number; duplicatesInB: number; overlap: number } {
  const byKey = new Map<string, MergedTerm>();
  let duplicatesInA = 0;
  let duplicatesInB = 0;
  let overlap = 0;

  for (const t of a) {
    const key = normalizeKey(t.term);
    if (byKey.has(key)) {
      duplicatesInA++;
      continue;
    }
    byKey.set(key, { ...t, inBoth: false });
  }
  for (const t of b) {
    const key = normalizeKey(t.term);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, { ...t, inBoth: false });
      continue;
    }
    if (existing.origin === "book_b") {
      duplicatesInB++;
      continue;
    }
    overlap++;
    existing.inBoth = true;
    existing.aliases = [...new Set([...existing.aliases, ...t.aliases])];
  }
  return { terms: [...byKey.values()], duplicatesInA, duplicatesInB, overlap };
}

/**
 * Related terms without any AI: other terms whose name appears as a whole word or
 * phrase inside this term's definition (longest names first, at most `limit`).
 * Short names (under 4 characters) only count when written in capitals, so "API" links
 * but "it" or "run" never do.
 */
export function computeRelatedTerms(
  terms: Array<{ term: string; definition: string; aliases?: string[] }>,
  limit = 5,
): Map<string, string[]> {
  const names = terms
    .map((t) => ({ term: t.term, key: normalizeKey(t.term) }))
    .filter((n) => n.key.length >= 4 || /^[A-Z0-9+#]{2,}$/.test(n.term))
    .sort((x, y) => y.term.length - x.term.length);

  const out = new Map<string, string[]>();
  for (const t of terms) {
    const text = ` ${t.definition} `;
    const lower = text.toLowerCase();
    const found: string[] = [];
    for (const n of names) {
      if (n.term === t.term || found.length >= limit) continue;
      const short = n.key.length < 4;
      const hay = short ? text : lower;
      const needle = short ? n.term : n.key;
      const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp(`(?<![A-Za-z0-9])${escaped}(?![A-Za-z0-9])`).test(hay)) found.push(n.term);
    }
    out.set(t.term, found);
  }
  return out;
}

export interface FilterableTerm extends SearchableTerm {
  category_group?: string | null;
  level?: string | null;
  tier?: string | null;
  mention_count?: number | null;
  last_seen_at?: string | null;
  first_seen_at?: string | null;
  origin?: string | null;
}

export interface DictionaryFilters {
  query: string;
  group: string | null;
  level: DictionaryLevel | null;
  letter: string | null;
  /** Off by default: adjacent (deep ML, infrastructure, compliance) stays behind a toggle, P-0. */
  includeAdjacent: boolean;
  onlyNew: boolean;
  onlyTrending: boolean;
}

export const EMPTY_FILTERS: DictionaryFilters = {
  query: "",
  group: null,
  level: null,
  letter: null,
  includeAdjacent: false,
  onlyNew: false,
  onlyTrending: false,
};

/**
 * The one place that decides what the Dictionary page shows. Facet filters first, then
 * search ranking (or alphabetical when there is no query), trending first when asked.
 * A term with no tier yet (imported before classification) counts as related, so it is
 * never hidden by the adjacent toggle.
 */
export function applyDictionaryFilters<T extends FilterableTerm>(terms: T[], f: DictionaryFilters, now: Date): T[] {
  let out = terms.filter((t) => {
    if (!f.includeAdjacent && t.tier === "adjacent") return false;
    if (f.group && t.category_group !== f.group) return false;
    if (f.level && t.level !== f.level) return false;
    if (f.letter && letterOf(t.term) !== f.letter) return false;
    if (f.onlyNew && !isNewTerm(t, now)) return false;
    if (f.onlyTrending && !isTrendingTerm(t, now)) return false;
    return true;
  });
  out = f.query.trim() ? searchTerms(out, f.query) : [...out].sort((a, b) => a.term.localeCompare(b.term));
  if (f.onlyTrending) out = [...out].sort((a, b) => (b.mention_count ?? 0) - (a.mention_count ?? 0));
  return out;
}

/** Counts per facet value for the tiles and the A to Z rail, computed on the visible set. */
export function facetCounts<T extends FilterableTerm>(terms: T[]): { groups: Record<string, number>; letters: Record<string, number> } {
  const groups: Record<string, number> = {};
  const letters: Record<string, number> = {};
  for (const t of terms) {
    if (t.category_group) groups[t.category_group] = (groups[t.category_group] ?? 0) + 1;
    const l = letterOf(t.term);
    letters[l] = (letters[l] ?? 0) + 1;
  }
  return { groups, letters };
}
