/**
 * Tool discovery, pure logic (Director-approved, 2026-10-02 six-step feasibility
 * study) -- the exact same discipline as features/dictionary/discovery.ts, applied to
 * tools instead of vocabulary:
 *   1. candidates: a tool the AI notices mentioned in recent relevant articles;
 *   2. promotion: a candidate becomes a published tool only once it is established,
 *      meaning it appeared in several articles from independent sources inside a
 *      window. One blog post mentioning a tool once is not yet a "top tool to try" --
 *      the whole point of this rubric is tools worth noticing, not every tool named
 *      anywhere.
 * Nothing here touches the network or the database.
 */

import { normalizeKey, slugify, type ToolPricing } from "./domain";

export const PROMOTION_MIN_MENTIONS = 3;
export const PROMOTION_MIN_SOURCES = 2;
export const PROMOTION_WINDOW_DAYS = 14;
export const MAX_CANDIDATE_NAME_LENGTH = 60;

export interface CandidateState {
  name: string;
  slug: string;
  description: string;
  url: string | null;
  pricing: ToolPricing;
  mention_count: number;
  source_names: string[];
  article_ids: string[];
  first_seen_at: string;
  last_seen_at: string;
  status?: "candidate" | "promoted" | "rejected";
}

export interface Observation {
  name: string;
  description: string;
  url: string | null;
  pricing: ToolPricing;
  articleIds: string[];
  sources: string[];
  seenAt: string;
}

/** Cleans a proposed tool name; returns null when it should not be considered at all. */
export function cleanCandidateName(raw: string): string | null {
  const name = raw.replace(/["“”]/g, "").replace(/\s+/g, " ").trim();
  if (name.length < 2 || name.length > MAX_CANDIDATE_NAME_LENGTH) return null;
  if (name.split(" ").length > 6) return null;
  if (!/[a-zA-Z]/.test(name)) return null;
  return name;
}

/** True when the name (or its normalised form) is already a known tool. */
export function isKnownTool(name: string, knownKeys: Set<string>): boolean {
  return knownKeys.has(normalizeKey(name));
}

/**
 * Folds one observation into an existing candidate. Counting is by DISTINCT articles: the
 * same article seen again on a later run must not inflate the count. The description, url
 * and pricing keep their FIRST recorded value (same convention as the Dictionary's
 * definition) -- a later article's slightly different phrasing should not keep rewriting
 * an already-seen candidate.
 */
export function mergeObservation(existing: CandidateState | null, obs: Observation): CandidateState {
  if (!existing) {
    return {
      name: obs.name,
      slug: slugify(obs.name),
      description: obs.description,
      url: obs.url,
      pricing: obs.pricing,
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
