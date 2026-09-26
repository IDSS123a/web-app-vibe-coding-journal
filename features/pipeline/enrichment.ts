/**
 * Enrichment: everything an article goes through between "collected" and "ready for a
 * report" (relevance gate, confidence, category, editorial summary).
 *
 * Moved out of the daily-digest route on 2026-09-19 (knowledge-growth work) because
 * the old in-route version was the reason the daily run kept timing out and the
 * reason 94 percent of stored articles were never scored:
 *   - it judged relevance one article per Gemini call, then made up to three more
 *     sequential calls per article, all inside one request;
 *   - it had no time budget, so a slow phase could only end in a 300 s kill.
 * Now:
 *   - a free keyword triage (triage.ts) drops text with no AI or software vocabulary
 *     without spending an AI call;
 *   - relevance is judged in batches (ASSESS_RELEVANCE_BATCH_SIZE articles per call);
 *   - only articles that pass the P-0 gate reach the per-article summary calls, a few
 *     at a time;
 *   - every stage checks a wall-clock deadline and stops cleanly, leaving the rest of
 *     the queue for the next hourly run. The queue is simply "not duplicate and no
 *     confidence score yet", newest first, so nothing is ever lost by stopping early.
 * Used by the daily-digest route (target hour and every other hour) and by the
 * one-off backfill script.
 */

import { supabaseAdmin } from "@/lib/db/client";
import { getAIProvider, ASSESS_RELEVANCE_BATCH_SIZE } from "@/lib/ai/ai-provider";
import { GeminiKeysExhaustedError } from "@/lib/ai/gemini-provider";
import {
  getArticlesNeedingRelevance,
  getRelevantUnfinishedArticles,
  updateArticleConfidence,
  updateArticleRelevance,
  updateArticleCategory,
  updateArticleSummary,
} from "@/features/pipeline/repository";
import { scoreArticleConfidence, classifyArticle, ARTICLE_CATEGORIES, RELEVANCE_THRESHOLD } from "@/features/pipeline/quality-engine";
import { triageArticle } from "@/features/pipeline/triage";
import type { Article } from "@/lib/validation/schemas";

export interface EnrichmentResult {
  success: boolean;
  articlesScored: number;
  articlesClassified: number;
  articlesSummarized: number;
  triageSkipped: number;
  batchCalls: number;
  /** Every AI request this run made: batches, category fallbacks and summaries. */
  aiCalls: number;
  aiUnavailableCount: number;
  aiSuspectedSuspension: boolean;
  aiModelDeprecated: boolean;
  /** True when the deadline, not the queue, ended the run. */
  stoppedForBudget: boolean;
  errors: string[];
}

export interface EnrichmentOptions {
  /** How many queued articles to take on in this run. */
  limit: number;
  /** Absolute Date.now() value after which no new AI call is started. */
  deadlineAt: number;
  /** Per-article summary calls in flight at once. Free tier allows little; keep it low. */
  summaryConcurrency?: number;
  /**
   * Ceiling on AI requests for this run. The free tier allows roughly 20 requests per day
   * per key per model, shared by the daily report, the University and the Assistant, so
   * background backlog work is given a daily budget and must stop when it is spent.
   * Undefined means no ceiling (the report run itself).
   */
  maxAiCalls?: number;
  /**
   * How many relevant articles may get the per-article summary calls in this run. A report
   * holds at most MAX_ARTICLES_PER_REPORT, so summarising every relevant article of thirty
   * sources would spend most of the day's AI budget on text nobody reads. The best (highest
   * relevance, then newest) go first; the rest wait, unsummarised, for a later run.
   */
  maxSummaries?: number;
}

const BATCH_SAFETY_MS = 15_000;
const SUMMARY_SAFETY_MS = 25_000;

async function loadSourceClasses(): Promise<Map<string, string | null>> {
  if (!supabaseAdmin) throw new Error("Admin client not available");
  const { data, error } = await supabaseAdmin.from("sources").select("id, source_class");
  if (error) throw new Error(`Failed to load source classes: ${error.message}`);
  return new Map((data ?? []).map((s) => [s.id as string, (s.source_class as string | null) ?? null]));
}

/** Runs `fn` over items with at most `size` in flight; stops taking new items after the deadline. */
async function mapPool<T>(items: T[], size: number, deadlineAt: number, safetyMs: number, fn: (item: T) => Promise<void>): Promise<boolean> {
  let stopped = false;
  const queue = [...items];
  const worker = async () => {
    for (let item = queue.shift(); item !== undefined; item = queue.shift()) {
      if (Date.now() > deadlineAt - safetyMs) {
        stopped = true;
        return;
      }
      await fn(item);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(size, items.length)) }, () => worker()));
  return stopped;
}

export async function runEnrichment(options: EnrichmentOptions): Promise<EnrichmentResult> {
  const result: EnrichmentResult = {
    success: true,
    articlesScored: 0,
    articlesClassified: 0,
    articlesSummarized: 0,
    triageSkipped: 0,
    batchCalls: 0,
    aiCalls: 0,
    aiUnavailableCount: 0,
    aiSuspectedSuspension: false,
    aiModelDeprecated: false,
    stoppedForBudget: false,
    errors: [],
  };

  const noteExhausted = (err: GeminiKeysExhaustedError) => {
    result.aiUnavailableCount++;
    if (err.reason === "suspected_suspension") result.aiSuspectedSuspension = true;
    else if (err.reason === "model_deprecated") result.aiModelDeprecated = true;
  };

  const canSpend = () => options.maxAiCalls === undefined || result.aiCalls < options.maxAiCalls;

  // Stage 1 (relevance scoring) must not be allowed to consume the ENTIRE deadline when
  // its own backlog is large -- found live 2026-09-26: a multi-day outage left hundreds
  // of unscored articles queued, and stage 1 alone filled every single run's whole time
  // budget on its own, leaving stage 2 (summaries -- the only stage that actually
  // produces a reportable article) zero time, run after run, with the report staying
  // empty no matter how many runs went by. Reserve roughly half of whatever time is left
  // when this run starts for stage 2; stage 1 still gets the rest, which in the normal
  // small-backlog case is nearly the whole budget anyway, since stage 1 finishes well
  // before its own half runs out and stage 2 (using the real, unreserved deadlineAt
  // below) picks up whatever stage 1 didn't spend.
  const stage1DeadlineAt = Date.now() + (options.deadlineAt - Date.now()) / 2;

  try {
    // Two queues, so a pile of relevant-but-not-yet-summarised articles can never crowd out
    // the articles that still have no relevance score at all:
    //   1. no relevance score yet (newest first)
    //   2. relevant (P-0) but not finished, best first
    const unscored = await getArticlesNeedingRelevance(options.limit);
    const unfinished = await getRelevantUnfinishedArticles(options.maxSummaries ?? 30);
    const articles: Article[] = [...unscored, ...unfinished.filter((u) => !unscored.some((a) => a.id === u.id))];
    console.log(`[ENRICH] ${unscored.length} awaiting relevance, ${unfinished.length} relevant awaiting summary`);
    const ai = getAIProvider();
    const classBySource = await loadSourceClasses();

    // Stage 1: relevance. Articles that already carry a score (an earlier run got that far
    // and stopped) skip straight to stage 2.
    const relevance = new Map<string, number>();
    for (const a of articles) if (a.relevance_score != null) relevance.set(a.id, a.relevance_score);

    const needScore = articles.filter((a) => a.relevance_score == null);
    const forAi: Article[] = [];
    for (const article of needScore) {
      const triage = triageArticle({
        title: article.title,
        summary: article.raw_summary,
        sourceClass: article.source_id ? classBySource.get(article.source_id) ?? null : null,
      });
      if (triage.decision === "skip") {
        await updateArticleRelevance(article.id, 0, "triage");
        await updateArticleConfidence(article.id, 0);
        relevance.set(article.id, 0);
        result.triageSkipped++;
        result.articlesScored++;
      } else {
        forAi.push(article);
      }
    }

    let consecutiveBatchFailures = 0;
    for (let i = 0; i < forAi.length; i += ASSESS_RELEVANCE_BATCH_SIZE) {
      if (Date.now() > stage1DeadlineAt - BATCH_SAFETY_MS || !canSpend()) {
        result.stoppedForBudget = true;
        break;
      }
      const batch = forAi.slice(i, i + ASSESS_RELEVANCE_BATCH_SIZE);
      try {
        result.batchCalls++;
        result.aiCalls++;
        const out = await ai.assessRelevanceBatch({
          items: batch.map((a) => ({ id: a.id, title: a.title, summary: a.raw_summary ?? "" })),
        });
        consecutiveBatchFailures = 0;
        for (const r of out.results) {
          await updateArticleRelevance(r.id, r.relevanceScore, "ai_batch");
          relevance.set(r.id, r.relevanceScore);
          if (r.relevanceScore < RELEVANCE_THRESHOLD) {
            await updateArticleConfidence(r.id, 0);
            result.articlesScored++;
          }
        }
      } catch (err) {
        if (err instanceof GeminiKeysExhaustedError) {
          noteExhausted(err);
          console.warn(`[ENRICH] Relevance batch stopped: ${err.message}`);
          break;
        }
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push(`relevance batch: ${msg}`);
        if (++consecutiveBatchFailures >= 2) break;
      }
    }

    // Stage 2: only relevant articles get a confidence score, a category and a summary.
    const relevant = articles
      .filter((a) => (relevance.get(a.id) ?? -1) >= RELEVANCE_THRESHOLD)
      .sort((a, b) => (relevance.get(b.id) ?? 0) - (relevance.get(a.id) ?? 0) || (a.published_at < b.published_at ? 1 : -1))
      .slice(0, options.maxSummaries ?? 30);
    const stopped = await mapPool(relevant, options.summaryConcurrency ?? 3, options.deadlineAt, SUMMARY_SAFETY_MS, async (article) => {
      if (!canSpend()) {
        result.stoppedForBudget = true;
        return;
      }
      try {
        const confidence = scoreArticleConfidence(article);
        await updateArticleConfidence(article.id, confidence);
        result.articlesScored++;

        let category = classifyArticle(article);
        if (!category) {
          try {
            result.aiCalls++;
            const c = await ai.classify({ text: `${article.title} ${article.raw_summary ?? ""}`, categories: [...ARTICLE_CATEGORIES] });
            if (c.category) category = c.category as (typeof ARTICLE_CATEGORIES)[number];
          } catch (classifyError) {
            console.warn(`[ENRICH] classify fallback failed for ${article.id}: ${classifyError instanceof Error ? classifyError.message : String(classifyError)}`);
          }
        }
        if (category) {
          await updateArticleCategory(article.id, category);
          result.articlesClassified++;
        }

        try {
          result.aiCalls++;
          const s = await ai.summarize({ text: `${article.title}\n\n${article.raw_summary ?? ""}` });
          await updateArticleSummary(article.id, {
            summary: s.summary,
            why_it_matters: s.why_it_matters,
            who_it_affects: s.who_it_affects,
            worth_trying: s.worth_trying,
            what_to_watch: s.what_to_watch,
          });
          result.articlesSummarized++;
        } catch (summarizeError) {
          if (summarizeError instanceof GeminiKeysExhaustedError) {
            noteExhausted(summarizeError);
          } else {
            const msg = summarizeError instanceof Error ? summarizeError.message : String(summarizeError);
            result.errors.push(`Article ${article.id} summarize: ${msg}`);
          }
        }
      } catch (articleError) {
        result.errors.push(`Article ${article.id}: ${articleError instanceof Error ? articleError.message : String(articleError)}`);
      }
    });
    if (stopped) result.stoppedForBudget = true;

    result.success = result.errors.length === 0;
    return result;
  } catch (err) {
    result.success = false;
    result.errors.push(err instanceof Error ? err.message : String(err));
    return result;
  }
}
