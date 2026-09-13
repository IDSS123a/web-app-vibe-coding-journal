import { supabaseAdmin } from "@/lib/db/client";
import type { Article } from "@/lib/validation/schemas";

/**
 * Get article by hash (fast lookup for exact duplicate detection)
 * O(1) via database index on articles.hash
 */
export async function getArticleByHash(
  hash: string,
  excludeId?: string,
): Promise<Article | null> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  // Ingestion upserts on `hash`, so a hash is unique in the table. Without
  // excluding the caller's own id, this would always find the article itself
  // and every article would be marked a duplicate of itself. excludeId makes
  // this return only a *different* article sharing the hash (a true duplicate).
  let query = supabaseAdmin.from("articles").select("*").eq("hash", hash);
  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.maybeSingle();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = not found
    throw new Error(`Failed to find article by hash: ${error.message}`);
  }

  return (data as Article) || null;
}

/**
 * Phase 4 (specs/vibe-coding-intelligence-engine/ROADMAP.md, Event
 * Deduplication/Clustering): for a set of canonical (non-duplicate)
 * article ids, returns the sources of any OTHER articles clustered as
 * the same event (duplicate_of pointing to that canonical id) — what
 * the report actually needs to render "Also covered by: X, Y" instead
 * of silently hiding that other sources ran the same story. The
 * duplicate articles' own rows are otherwise never shown.
 */
export async function getRelatedSourcesForArticles(
  canonicalIds: string[],
): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  if (canonicalIds.length === 0 || !supabaseAdmin) {
    return result;
  }

  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("duplicate_of, source")
    .in("duplicate_of", canonicalIds);

  if (error) {
    throw new Error(`Failed to fetch related sources: ${error.message}`);
  }

  for (const row of data ?? []) {
    const canonicalId = row.duplicate_of as string;
    const list = result.get(canonicalId) ?? [];
    if (row.source && !list.includes(row.source)) {
      list.push(row.source);
    }
    result.set(canonicalId, list);
  }

  return result;
}

/**
 * Mark article as duplicate of another article
 * Sets duplicate_of field and marks for later filtering
 */
export async function markArticleAsDuplicate(
  articleId: string,
  duplicateOfId: string,
): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { error } = await supabaseAdmin
    .from("articles")
    .update({
      duplicate_of: duplicateOfId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", articleId);

  if (error) {
    throw new Error(`Failed to mark duplicate: ${error.message}`);
  }
}

/**
 * Get all articles that are not marked as duplicates
 * Used by downstream pipeline stages (Quality Engine, etc.)
 */
export async function getNonDuplicateArticles(): Promise<Article[]> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("*")
    .is("duplicate_of", null)
    .is("confidence_score", null) // Articles not yet processed by Quality Engine
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch non-duplicate articles: ${error.message}`);
  }

  return data as Article[];
}

/**
 * Update article confidence score (Quality Engine output)
 */
export async function updateArticleConfidence(
  articleId: string,
  confidenceScore: number,
): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { error } = await supabaseAdmin
    .from("articles")
    .update({
      confidence_score: confidenceScore,
      updated_at: new Date().toISOString(),
    })
    .eq("id", articleId);

  if (error) {
    throw new Error(`Failed to update confidence: ${error.message}`);
  }
}

/**
 * Update article relevance score (P-0 gate, Phase 2 --
 * specs/vibe-coding-intelligence-engine/ROADMAP.md). Distinct from
 * confidence_score (a content-quality heuristic, unrelated to topical
 * relevance) -- kept as its own column/function rather than folded in,
 * matching this file's existing one-field-per-function style.
 */
export async function updateArticleRelevance(
  articleId: string,
  relevanceScore: number,
): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { error } = await supabaseAdmin
    .from("articles")
    .update({
      relevance_score: relevanceScore,
      updated_at: new Date().toISOString(),
    })
    .eq("id", articleId);

  if (error) {
    throw new Error(`Failed to update relevance score: ${error.message}`);
  }
}

/**
 * Update article with AI-generated summary fields (Sprint 05: GeminiProvider.summarize())
 * P-3: why_it_matters / who_it_affects / worth_trying are the required
 * actionable-judgment fields; summary is the editorial-voice text.
 */
export async function updateArticleSummary(
  articleId: string,
  fields: {
    summary: string;
    why_it_matters: string;
    who_it_affects: string;
    worth_trying: "yes" | "no" | "maybe";
  },
): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { error } = await supabaseAdmin
    .from("articles")
    .update({
      ...fields,
      updated_at: new Date().toISOString(),
    })
    .eq("id", articleId);

  if (error) {
    throw new Error(`Failed to update article summary: ${error.message}`);
  }
}

/**
 * Update article category (Classifier output)
 */
export async function updateArticleCategory(
  articleId: string,
  category: string | null,
): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { error } = await supabaseAdmin
    .from("articles")
    .update({
      category,
      updated_at: new Date().toISOString(),
    })
    .eq("id", articleId);

  if (error) {
    throw new Error(`Failed to update category: ${error.message}`);
  }
}

/**
 * Get articles ready for Daily Report (not duplicates, have confidence score, below/above threshold).
 *
 * Scoped to articles collected since the most recent prior report -- without
 * this window, every run re-pulled the ENTIRE all-time article history (a
 * real production bug found 2026-09-10: reports had grown to 900+ articles /
 * 31+ hours reading time each, guaranteeing the P-3 hype-word hold gate
 * tripped every single day since it's near-certain *some* article somewhere
 * in an ever-growing all-time pile contains a hype word). The cron's own
 * schedule-gate already guarantees this only runs once a report doesn't yet
 * exist for today (see app/api/cron/daily-digest/route.ts's
 * `already_generated_today` check), so "the latest existing report" is
 * always the correct prior boundary, never today's own row.
 */
export async function getArticlesForDailyReport(): Promise<Article[]> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { data: latestReport, error: latestReportError } = await supabaseAdmin
    .from("daily_reports")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestReportError) {
    throw new Error(`Failed to fetch latest report boundary: ${latestReportError.message}`);
  }

  // No prior report at all (fresh environment): fall back to a bounded
  // 48h window rather than an unbounded all-time pull.
  const sinceIso =
    latestReport?.created_at ?? new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("*")
    .is("duplicate_of", null)
    .not("confidence_score", "is", null) // Only scored articles
    .gte("created_at", sinceIso) // Only articles collected since the last report
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch articles for daily report: ${error.message}`);
  }

  return data as Article[];
}
