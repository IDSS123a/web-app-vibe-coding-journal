import { supabaseAdmin } from "@/lib/db/client";
import type { Article } from "@/lib/validation/schemas";
import { isReportEligible } from "./quality-engine";

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
 * Get articles that are not marked as duplicates and not yet scored.
 * Used by both the Duplicate Engine (uncapped — cheap, no AI calls) and
 * the Quality Engine (capped via `limit` — see that call site).
 *
 * Found live 2026-09-14, active outage: this query was completely
 * unbounded, the same class of bug already found and fixed once this
 * project (getArticlesForDailyReport, 2026-09-10). A run that fails
 * partway through Quality Engine (real AI calls per article) leaves its
 * articles unscored; the NEXT run's call to this same function picks up
 * ALL historically-unscored articles, not just its own new ones — after
 * three consecutive Phase-1 timeouts the same day, this had grown to
 * 1000 unscored articles, and Quality Engine trying to AI-score all
 * 1000 in one run is itself what then exceeded the 300s function
 * budget (a second, different bottleneck than the one that started the
 * outage). `limit` lets a caller bound how many rows it takes on in one
 * run, capping the whole run's incurred time regardless of backlog size,
 * and letting the backlog drain safely across multiple runs instead of
 * one run trying to consume it entirely.
 */
export async function getNonDuplicateArticles(limit?: number): Promise<Article[]> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  let query = supabaseAdmin
    .from("articles")
    .select("*")
    .is("duplicate_of", null)
    .is("confidence_score", null) // Articles not yet processed by Quality Engine
    .order("published_at", { ascending: false });

  if (limit !== undefined) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch non-duplicate articles: ${error.message}`);
  }

  return data as Article[];
}

/**
 * Queue 1 of the enrichment step: articles that still have no relevance score, newest
 * first. Not duplicates. (2026-09-19; the single "no confidence score" queue this replaces
 * let a pile of relevant articles waiting for a summary block the unscored ones behind them.)
 */
export async function getArticlesNeedingRelevance(limit: number): Promise<Article[]> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("*")
    .is("duplicate_of", null)
    .is("relevance_score", null)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) {
    throw new Error(`Failed to fetch articles needing relevance: ${error.message}`);
  }
  return data as Article[];
}

/**
 * Queue 2: relevant (score at or above the P-0 threshold) but not finished, meaning no
 * confidence score yet, best first. These are the candidates for summaries.
 */
export async function getRelevantUnfinishedArticles(limit: number): Promise<Article[]> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("*")
    .is("duplicate_of", null)
    .is("confidence_score", null)
    .gte("relevance_score", 60)
    .order("relevance_score", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) {
    throw new Error(`Failed to fetch relevant unfinished articles: ${error.message}`);
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
  relevanceSource: "ai" | "ai_batch" | "triage" = "ai",
): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { error } = await supabaseAdmin
    .from("articles")
    .update({
      relevance_score: relevanceScore,
      relevance_source: relevanceSource,
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
 * Phase 5 (specs/vibe-coding-intelligence-engine/ROADMAP.md, migration
 * 012): what_to_watch is the format's forward-looking note.
 */
export async function updateArticleSummary(
  articleId: string,
  fields: {
    summary: string;
    why_it_matters: string;
    who_it_affects: string;
    worth_trying: "yes" | "no" | "maybe";
    what_to_watch: string;
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
 * Maximum articles in one Daily Report. A normal report is 5 to 20 (admin review
 * screen wording); more than that is a pile, not a briefing.
 */
export const MAX_ARTICLES_PER_REPORT = 20;

/** Articles older than this are never pulled into a new report, however unreported. */
const REPORT_FRESHNESS_DAYS = 7;

/**
 * Get articles ready for the Daily Report: relevant (P-0), scored, summarised, not a
 * duplicate, published recently, and NOT already used in an earlier report.
 *
 * Rewritten 2026-09-19. It used to take every article created since the previous
 * report row was created. Two consequences: an article collected before the last report
 * but finished later (a backlog, a slow run) could never appear anywhere, and an article
 * that reached the front of the queue without an editorial summary was printed with
 * "TBD" fields. The report is now built from the queue of finished, unreported articles,
 * best first (relevance, then recency), capped at MAX_ARTICLES_PER_REPORT. The 900+
 * article reports of 2026-09-08 and 09-09 came from the very first version of this
 * function having no bound at all (see features/pipeline/domain.ts).
 *
 * "Already used" is read from daily_report_articles (migration 009), which
 * linkArticlesToReport fills for every report.
 */
export async function getArticlesForDailyReport(): Promise<Article[]> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const sinceIso = new Date(Date.now() - REPORT_FRESHNESS_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("*")
    .is("duplicate_of", null)
    .gt("confidence_score", 0)
    .not("summary", "is", null)
    .gte("published_at", sinceIso)
    .order("relevance_score", { ascending: false, nullsFirst: false })
    .order("published_at", { ascending: false })
    .limit(MAX_ARTICLES_PER_REPORT * 3);

  if (error) {
    throw new Error(`Failed to fetch articles for daily report: ${error.message}`);
  }

  const candidates = (data as Article[]).filter(isReportEligible);
  if (candidates.length === 0) return [];

  const { data: linked, error: linkedError } = await supabaseAdmin
    .from("daily_report_articles")
    .select("article_id")
    .in(
      "article_id",
      candidates.map((a) => a.id),
    );

  if (linkedError) {
    throw new Error(`Failed to read report links: ${linkedError.message}`);
  }

  const used = new Set((linked ?? []).map((l) => l.article_id as string));
  return candidates.filter((a) => !used.has(a.id)).slice(0, MAX_ARTICLES_PER_REPORT);
}
