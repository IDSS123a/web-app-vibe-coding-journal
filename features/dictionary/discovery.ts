/**
 * Term discovery, pure logic (specs/knowledge-growth-and-dictionary/, 2026-09-19).
 *
 * The Dictionary used to be static: it grew only when an admin approved a weekly
 * University lesson. This module is how it now learns from the market:
 *   1. mentions: which known terms appear in the recent relevant articles, without any AI,
 *      so the page can mark what is trending this week;
 *   2. candidates: vocabulary the AI notices in articles that the Dictionary lacks;
 *   3. promotion: a candidate becomes a real term only once it is established, meaning it
 *      appeared in several articles from independent sources inside a window. One blog post
 *      coining a phrase is not yet vocabulary.
 * Nothing here touches the network or the database.
 */

import { normalizeKey, slugify } from "./domain";

export const PROMOTION_MIN_MENTIONS = 3;
export const PROMOTION_MIN_SOURCES = 2;
export const PROMOTION_WINDOW_DAYS = 14;
export const MAX_CANDIDATE_TERM_LENGTH = 60;

/**
 * Plain single words that ARE dictionary terms but are also everyday English or generic
 * software words ("performance", "integration", "security"). Matching them in article
 * text would make them "trend" all the time, so a single plain word is only matched when
 * it is on this short allow-list of words that are effectively vibe-coding vocabulary.
 * Acronyms (MCP), product-like names (AGENTS.md), hyphenated terms and multi word terms
 * are always matchable.
 */
const SINGLE_WORD_ALLOW = new Set([
  "hallucination", "hallucinations", "guardrail", "guardrails", "grounding", "harness", "embedding", "embeddings",
  "reranking", "chunking", "jailbreak", "scaffolding", "agentic", "vibecoding", "orchestration", "observability",
  "idempotency", "sandboxing", "tokenization", "quantization", "distillation", "copilot", "cursor", "windsurf",
]);

export interface ArticleText {
  id: string;
  source: string;
  title: string;
  summary: string | null;
  published_at: string;
}

export interface MentionTerm {
  id: string;
  term: string;
  aliases: string[];
}

export interface MentionResult {
  termId: string;
  articleIds: string[];
  sources: string[];
  lastSeenAt: string;
}

function keyWords(text: string): string[] {
  return normalizeKey(text).split(" ").filter(Boolean);
}

/** True when a term (or alias) may be matched inside article text at all. */
export function isMatchableName(name: string): boolean {
  const trimmed = name.trim();
  const key = normalizeKey(trimmed);
  if (key.length < 3) return false;
  if (key.includes(" ")) return true; // multi word
  if (/[A-Z].*[A-Z]/.test(trimmed) || /[0-9.+#_-]/.test(trimmed)) return true; // acronym, CamelCase, AGENTS.md, vibe-coding
  return SINGLE_WORD_ALLOW.has(key);
}

/**
 * Which known terms appear in which articles. Article text is normalised and every run of
 * one to five words is looked up in a map of term and alias keys, so a 2,600 term
 * dictionary against a few hundred articles is a few hundred thousand map lookups.
 */
export function findMentions(terms: MentionTerm[], articles: ArticleText[]): Map<string, MentionResult> {
  const byKey = new Map<string, string>(); // normalised key -> term id
  for (const t of terms) {
    for (const name of [t.term, ...t.aliases]) {
      const key = normalizeKey(name);
      if (isMatchableName(name) && !byKey.has(key)) byKey.set(key, t.id);
    }
  }

  const out = new Map<string, MentionResult>();
  for (const article of articles) {
    const words = keyWords(`${article.title} ${article.summary ?? ""}`);
    const seenForArticle = new Set<string>();
    for (let i = 0; i < words.length; i++) {
      let phrase = "";
      for (let n = 0; n < 5 && i + n < words.length; n++) {
        phrase = n === 0 ? words[i]! : `${phrase} ${words[i + n]}`;
        const id = byKey.get(phrase);
        if (id && !seenForArticle.has(id)) {
          seenForArticle.add(id);
          const entry = out.get(id) ?? { termId: id, articleIds: [], sources: [], lastSeenAt: article.published_at };
          entry.articleIds.push(article.id);
          if (!entry.sources.includes(article.source)) entry.sources.push(article.source);
          if (article.published_at > entry.lastSeenAt) entry.lastSeenAt = article.published_at;
          out.set(id, entry);
        }
      }
    }
  }
  return out;
}

export interface CandidateState {
  term: string;
  slug: string;
  mention_count: number;
  source_names: string[];
  article_ids: string[];
  first_seen_at: string;
  last_seen_at: string;
  status?: "candidate" | "promoted" | "rejected";
}

export interface Observation {
  term: string;
  definition: string;
  articleIds: string[];
  sources: string[];
  seenAt: string;
}

/** Cleans a proposed term name; returns null when it should not be considered at all. */
export function cleanCandidateName(raw: string): string | null {
  const name = raw.replace(/["“”]/g, "").replace(/\s+/g, " ").trim();
  if (name.length < 3 || name.length > MAX_CANDIDATE_TERM_LENGTH) return null;
  if (name.split(" ").length > 6) return null;
  if (!/[a-zA-Z]/.test(name)) return null;
  return name;
}

/** True when the name (or its normalised form) is already a term or alias. */
export function isKnownTerm(name: string, knownKeys: Set<string>): boolean {
  return knownKeys.has(normalizeKey(name));
}

/**
 * Folds one observation into an existing candidate. Counting is by DISTINCT articles: the
 * same article seen again on a later run must not inflate the count.
 */
export function mergeObservation(existing: CandidateState | null, obs: Observation): CandidateState {
  if (!existing) {
    return {
      term: obs.term,
      slug: slugify(obs.term),
      mention_count: new Set(obs.articleIds).size,
      source_names: [...new Set(obs.sources)],
      article_ids: [...new Set(obs.articleIds)],
      first_seen_at: obs.seenAt,
      last_seen_at: obs.seenAt,
    };
  }
  const article_ids = [...new Set([...existing.article_ids, ...obs.articleIds])];
  return {
    ...existing,
    article_ids,
    mention_count: article_ids.length,
    source_names: [...new Set([...existing.source_names, ...obs.sources])],
    last_seen_at: obs.seenAt > existing.last_seen_at ? obs.seenAt : existing.last_seen_at,
  };
}

/** Established means: enough articles, from independent sources, still fresh. */
export function shouldPromote(c: CandidateState, now: Date): boolean {
  if (c.status && c.status !== "candidate") return false;
  if (c.mention_count < PROMOTION_MIN_MENTIONS) return false;
  if (c.source_names.length < PROMOTION_MIN_SOURCES) return false;
  const ageDays = (now.getTime() - new Date(c.last_seen_at).getTime()) / 86_400_000;
  return ageDays <= PROMOTION_WINDOW_DAYS;
}

