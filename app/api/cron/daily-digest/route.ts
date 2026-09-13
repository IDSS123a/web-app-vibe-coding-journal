/**
 * Cron endpoint: /api/cron/daily-digest
 * Orchestrates: Source Collector → Duplicate Engine → Quality Engine →
 *               Classifier → Daily Report Generation
 * Security: Requires CRON_SECRET header (environment variable)
 * Usage: curl -X POST http://localhost:3000/api/cron/daily-digest -H "Authorization: Bearer $CRON_SECRET"
 * Triggered hourly by two independent external schedulers,
 * .github/workflows/hourly-digest-trigger.yml and cron-job.org (Vercel
 * Hobby plan cannot schedule its own cron more than once a day); the
 * target-hour + catch-up + idempotency checks below decide which
 * invocation actually runs the pipeline. See lib/cron/schedule-gate.ts.
 */

import { NextRequest, NextResponse } from "next/server";
import { collectArticlesFromAllSources } from "@/features/sources/actions";
import {
  getArticleByHash,
  markArticleAsDuplicate,
  getNonDuplicateArticles,
  updateArticleConfidence,
  updateArticleRelevance,
  updateArticleCategory,
  updateArticleSummary,
  getArticlesForDailyReport,
} from "@/features/pipeline/repository";
import { upsertDailyReport, getDailyReportByDate, linkArticlesToReport } from "@/features/daily-report/repository";
import { isTargetOperationsHour, isPastCatchUpDeadline } from "@/lib/cron/schedule-gate";
import {
  scoreArticleConfidence,
  classifyArticle,
  evaluateReportHold,
  ARTICLE_CATEGORIES,
  RELEVANCE_THRESHOLD,
} from "@/features/pipeline/quality-engine";
import { clusterDuplicateEvents } from "@/features/pipeline/domain";
import { sendReviewQueueAlert } from "@/lib/email/resend";
import { ensureAIProviderInitialized } from "@/lib/ai/init";
import { getAIProvider } from "@/lib/ai/ai-provider";
import { GeminiKeysExhaustedError } from "@/lib/ai/gemini-provider";
import { assessRelevanceOutputSchema } from "@/lib/validation/schemas";

const CRON_SECRET = process.env.CRON_SECRET || "dev-secret-change-in-production";

/**
 * Authenticate cron request via Bearer token
 * E-6: Five-step sequence (auth → authorize → validate → execute → return)
 */
function validateCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;

  const [scheme, token] = authHeader.split(" ");
  return scheme === "Bearer" && token === CRON_SECRET;
}

/**
 * POST /api/cron/daily-digest
 * Returns: { success, stats, errors }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. AUTHENTICATE (E-6 five-step)
    if (!validateCronAuth(request)) {
      console.error("[CRON] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. AUTHORIZE (already authenticated)

    // 3. VALIDATE — this endpoint is triggered hourly by two independent
    // external schedulers (Vercel Hobby plan cannot run its own cron more
    // than once a day, see .github/workflows and the cron-job.org config).
    // Normally only the invocation landing in the configured target local
    // hour runs the pipeline. isPastCatchUpDeadline is a safety net: if
    // every trigger has missed the target hour outright by this point in
    // the day (measured to happen — see corrections/SPRINT_06_LESSONS.md),
    // the next invocation runs anyway rather than silently waiting for
    // tomorrow. See lib/cron/schedule-gate.ts.
    const now = new Date();
    const isTargetHour = isTargetOperationsHour(now);
    if (!isTargetHour && !isPastCatchUpDeadline(now)) {
      console.log("[CRON] Not the configured target hour — skipping this invocation");
      return NextResponse.json(
        { success: true, skipped: true, reason: "not_target_hour" },
        { status: 200 },
      );
    }

    // Idempotency: at-least-once delivery from either scheduler, plus the
    // catch-up path above, means more than one invocation could reach this
    // point on the same day. If today's report already exists, the
    // pipeline already ran today — skip rather than re-run the full
    // (costly) pipeline a second time.
    const todayDate = new Date().toISOString().split("T")[0]!;
    const existingReport = await getDailyReportByDate(todayDate);
    if (existingReport) {
      console.log(
        `[CRON] Report for ${todayDate} already exists (status: ${existingReport.review_status}) — skipping duplicate run`,
      );
      return NextResponse.json(
        { success: true, skipped: true, reason: "already_generated_today" },
        { status: 200 },
      );
    }

    if (!isTargetHour) {
      console.log("[CRON] Target hour was missed today — catch-up safety net triggering the pipeline now");
    }
    console.log("[CRON] Starting daily digest pipeline");
    ensureAIProviderInitialized();

    // 4. EXECUTE
    console.log("[CRON] Phase 1: Source Collector (fetch + parse)");
    const collectResult = await collectArticlesFromAllSources();

    console.log(`[CRON]   ✓ Collected ${collectResult.articlesAdded} articles from ${collectResult.sourcesProcessed} sources`);
    if (collectResult.errors.length > 0) {
      console.warn(`[CRON]   ⚠ ${collectResult.errors.length} source errors (see details below)`);
    }

    // P-1.1 (fail loudly, no unattended incorrectness): a total collection
    // failure -- collectArticlesFromAllSources() couldn't even list the
    // enabled sources at all (tagged sourceId: "system", distinct from a
    // per-source fetch/parse error) -- must never fall through to
    // publishing an empty "0 articles" report. Found live 2026-09-13: a
    // transient Supabase Gateway Timeout on getEnabledSources() cascaded
    // through every downstream phase (0 to dedupe, 0 to score, 0 to
    // report) and generateDailyReport() happily auto-published a
    // genuinely empty report anyway, because an empty article list
    // trivially passes evaluateReportHold (nothing to hold on). The
    // existing "fail loudly" pattern already used for AI-unavailable
    // (aiUnavailableCount -> held + urgent alert, below) was never
    // extended to cover this case. Deliberately does NOT write a
    // daily_reports row here (unlike the AI-unavailable case, there is no
    // partial report worth holding for manual review -- zero articles is
    // nothing to review) -- the idempotency check earlier in this
    // function only skips a day once a report row exists, so the next
    // hourly invocation retries automatically, which is the correct
    // response to a transient infrastructure blip.
    const sourceCollectionTotallyFailed = collectResult.errors.some((e) => e.sourceId === "system");
    if (sourceCollectionTotallyFailed) {
      const message = collectResult.errors.map((e) => e.error).join("; ");
      console.error(`[CRON]   ✗ Source collection failed entirely, not publishing an empty report: ${message}`);
      return NextResponse.json(
        {
          success: false,
          skipped: true,
          reason: "source_collection_failed",
          detail: message,
          timestamp: new Date().toISOString(),
          durationMs: Date.now() - startTime,
        },
        { status: 200 },
      );
    }

    // Phase 2: Duplicate Engine
    console.log("[CRON] Phase 2: Duplicate Engine (deduplication)");
    const dedupeResult = await deduplicateArticles();
    console.log(`[CRON]   ✓ Deduplicated: ${dedupeResult.duplicatesFound} duplicates marked`);

    // Phase 3: Quality Engine + Classifier + AI Summary
    console.log("[CRON] Phase 3: Quality Engine & Classifier");
    const qualityResult = await runQualityEngine();
    console.log(
      `[CRON]   ✓ Quality scored: ${qualityResult.articlesScored}, Classified: ${qualityResult.articlesClassified}, AI-summarized: ${qualityResult.articlesSummarized}`,
    );
    if (qualityResult.aiUnavailableCount > 0) {
      const label = qualityResult.aiSuspectedSuspension
        ? "possible account suspension, not just quota"
        : qualityResult.aiModelDeprecated
          ? "configured Gemini model deprecated on at least one key's project"
          : "rate-limited/quota";
      console.warn(
        `[CRON]   ⚠ AI summary unavailable for ${qualityResult.aiUnavailableCount} article(s) (${label})`,
      );
    }

    // Phase 4: Daily Report Generation
    console.log("[CRON] Phase 4: Daily Report Generation");
    const reportResult = await generateDailyReport(
      qualityResult.aiUnavailableCount,
      qualityResult.aiSuspectedSuspension,
      qualityResult.aiModelDeprecated,
    );
    console.log(
      `[CRON]   ✓ Report generated: ${reportResult.articleCount} articles, status: ${reportResult.reviewStatus}`,
    );

    if (reportResult.reviewStatus === "held_for_review" && reportResult.holdReasons) {
      console.log(`[CRON]   ⚠ Review queue: ${reportResult.holdReasons.join(", ")}`);
      await sendReviewQueueAlert({
        date: reportResult.date,
        articleCount: reportResult.articleCount,
        reasons: reportResult.holdReasons,
        urgent: reportResult.urgent,
      });
    }

    // 5. RETURN
    const duration = Date.now() - startTime;
    const response = {
      success:
        collectResult.success &&
        dedupeResult.success &&
        qualityResult.success &&
        reportResult.success,
      timestamp: new Date().toISOString(),
      durationMs: duration,
      phases: {
        sourceCollector: {
          articlesAdded: collectResult.articlesAdded,
          sourcesProcessed: collectResult.sourcesProcessed,
          errors: collectResult.errors,
        },
        duplicateEngine: {
          articlesProcessed: dedupeResult.articlesProcessed,
          duplicatesFound: dedupeResult.duplicatesFound,
        },
        qualityEngine: {
          articlesScored: qualityResult.articlesScored,
          articlesClassified: qualityResult.articlesClassified,
          articlesSummarized: qualityResult.articlesSummarized,
          aiUnavailableCount: qualityResult.aiUnavailableCount,
          aiSuspectedSuspension: qualityResult.aiSuspectedSuspension,
          aiModelDeprecated: qualityResult.aiModelDeprecated,
          errors: qualityResult.errors,
        },
        dailyReport: {
          articleCount: reportResult.articleCount,
          reviewStatus: reportResult.reviewStatus,
          holdReasons: reportResult.holdReasons,
          errors: reportResult.errors,
        },
      },
    };

    console.log(`[CRON] Pipeline completed in ${duration}ms`);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[CRON] Pipeline failed: ${errorMsg}`);

    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

/**
 * Phase 2: Deduplicate articles
 *
 * Two passes:
 * 1. Exact-hash duplicates (unchanged — a perfect republish/re-poll of
 *    the same URL+title).
 * 2. Phase 4 (specs/vibe-coding-intelligence-engine/ROADMAP.md, Event
 *    Deduplication/Clustering): among the articles that survive pass
 *    1, cluster the ones covering the same underlying event (different
 *    source, similar title/summary — see clusterDuplicateEvents(),
 *    features/pipeline/domain.ts) so the report shows one entry per
 *    event, not one per source. Bounded to THIS run's newly-collected
 *    batch only (getNonDuplicateArticles(), typically tens of items) —
 *    never an all-time comparison, per the unbounded-growth lesson
 *    already learned once this project (getArticlesForDailyReport,
 *    fixed 2026-09-10).
 */
async function deduplicateArticles(): Promise<{
  success: boolean;
  articlesProcessed: number;
  duplicatesFound: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let duplicatesFound = 0;

  try {
    const newArticles = await getNonDuplicateArticles();
    console.log(`[DEDUP] Processing ${newArticles.length} new articles for duplicates`);

    const remaining: typeof newArticles = [];

    for (const article of newArticles) {
      try {
        const existingByHash = await getArticleByHash(article.hash, article.id);
        if (existingByHash) {
          await markArticleAsDuplicate(article.id, existingByHash.id);
          duplicatesFound++;
        } else {
          remaining.push(article);
        }
      } catch (articleError) {
        const errorMsg = articleError instanceof Error ? articleError.message : String(articleError);
        errors.push(`Article ${article.id}: ${errorMsg}`);
      }
    }

    // Phase 4: event clustering over whatever survived exact-hash dedup.
    const clusters = clusterDuplicateEvents(remaining);
    for (const cluster of clusters) {
      for (const duplicateId of cluster.duplicateIds) {
        try {
          await markArticleAsDuplicate(duplicateId, cluster.canonicalId);
          duplicatesFound++;
        } catch (clusterError) {
          const errorMsg = clusterError instanceof Error ? clusterError.message : String(clusterError);
          errors.push(`Article ${duplicateId} (event cluster): ${errorMsg}`);
        }
      }
    }
    if (clusters.some((c) => c.duplicateIds.length > 0)) {
      console.log(
        `[DEDUP]   Event clustering: ${clusters.filter((c) => c.duplicateIds.length > 0).length} event(s) with coverage from multiple sources`,
      );
    }

    return {
      success: errors.length === 0,
      articlesProcessed: newArticles.length,
      duplicatesFound,
      errors,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      articlesProcessed: 0,
      duplicatesFound: 0,
      errors: [errorMsg],
    };
  }
}

/**
 * Phase 3: Quality Engine & Classifier & AI Summary
 * Scores all articles, assigns categories, and generates P-3-compliant
 * summaries via the configured AIProvider (Sprint 05: GeminiProvider).
 *
 * classify() integration (confirmed with Director, sprints/SPRINT_05.md):
 * the heuristic classifyArticle() runs first; AI classify() is called ONLY
 * as a fallback when the heuristic returns null (M-4: don't guess when the
 * cheap/free heuristic already couldn't).
 */
async function runQualityEngine(): Promise<{
  success: boolean;
  articlesScored: number;
  articlesClassified: number;
  articlesSummarized: number;
  aiUnavailableCount: number;
  aiSuspectedSuspension: boolean;
  aiModelDeprecated: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  let articlesScored = 0;
  let articlesClassified = 0;
  let articlesSummarized = 0;
  let aiUnavailableCount = 0;
  // PDL-012: worse-case wins across the whole run — one suspected-suspension
  // article is enough to escalate the report-level alert, not averaged away.
  let aiSuspectedSuspension = false;
  // Found live 2026-09-11 (P-0 fix verification): distinct from both of the
  // above -- a rate limit self-resolves and a suspension is an account
  // problem, but a deprecated model needs a code/config change and will
  // not fix itself no matter how many times the run retries.
  let aiModelDeprecated = false;

  try {
    const articles = await getNonDuplicateArticles();
    console.log(`[QUALITY] Processing ${articles.length} articles`);
    const aiProvider = getAIProvider();

    for (const article of articles) {
      try {
        // P-0 (CRITICAL) relevance gate — must run before scoring/
        // classification/summarization so an off-topic article never
        // reaches an AI-costed step. Found live 2026-09-11: aviation,
        // math, music-theory, NASA-imaging, and cables content had been
        // publishing alongside real vibe-coding content because nothing
        // upstream checked topic at all. Fails OPEN (treated as
        // relevant, score 100) on any assessment failure — a bad-AI-day
        // must never behave worse than today's status quo (M-4); a real
        // Gemini outage still surfaces via the existing
        // GeminiKeysExhaustedError handling below, once classify/
        // summarize hit the same exhausted keys.
        //
        // Phase 2 (specs/vibe-coding-intelligence-engine/ROADMAP.md,
        // 2026-09-13): graded 0-100 relevanceScore, not a boolean — see
        // RELEVANCE_THRESHOLD (features/pipeline/quality-engine.ts) for
        // the cutoff and its rationale. The score itself is persisted
        // (migration 011) for every article, not just excluded ones,
        // supporting future calibration.
        let relevanceScore = 100;
        try {
          const relevanceRaw = await aiProvider.assessRelevance({
            title: article.title,
            summary: article.raw_summary ?? "",
          });
          const parsedRelevance = assessRelevanceOutputSchema.safeParse(relevanceRaw);
          if (parsedRelevance.success) {
            relevanceScore = parsedRelevance.data.relevanceScore;
            await updateArticleRelevance(article.id, relevanceScore);
            if (relevanceScore < RELEVANCE_THRESHOLD) {
              console.log(
                `[QUALITY]   Off-topic (P-0, score ${relevanceScore}/100), excluding ${article.id}: ${parsedRelevance.data.reasoning}`,
              );
            }
          } else {
            // E-5/AUDIT-003: a successful call is not a successful result --
            // log and count, but fail open rather than trust a malformed
            // payload as a reason to hide real content.
            console.error(
              `[QUALITY]   Unparseable relevance assessment for ${article.id}: ${parsedRelevance.error.message}`,
            );
          }
        } catch (relevanceError) {
          const msg = relevanceError instanceof Error ? relevanceError.message : String(relevanceError);
          console.warn(`[QUALITY]   Relevance assessment failed for ${article.id}, failing open: ${msg}`);
        }

        if (relevanceScore < RELEVANCE_THRESHOLD) {
          // Sub-CONFIDENCE_THRESHOLD score excludes it via the existing
          // getArticlesForDailyReport() filter -- deliberately reusing an
          // existing gate instead of a schema migration, given the
          // Director's "fix this NOW" urgency (2026-09-11). Skips
          // classify/summarize entirely below, saving Gemini quota
          // (free-only constraint, PDL-012/PDL-021, same principle as
          // hold-gate-calibration's never-re-judge rule).
          await updateArticleConfidence(article.id, 0);
          articlesScored++;
          continue;
        }

        // Score confidence (heuristic, unchanged)
        const confidence = scoreArticleConfidence(article);
        await updateArticleConfidence(article.id, confidence);
        articlesScored++;

        // Classify category: heuristic first, AI only as a fallback (M-4)
        let category = classifyArticle(article);
        if (!category) {
          try {
            const aiClassification = await aiProvider.classify({
              text: `${article.title} ${article.raw_summary ?? ""}`,
              categories: [...ARTICLE_CATEGORIES],
            });
            if (aiClassification.category) {
              category = aiClassification.category as (typeof ARTICLE_CATEGORIES)[number];
            }
          } catch (classifyError) {
            // Classification fallback failing is not fatal — leave category
            // null (M-4) and continue; logged, not swallowed.
            const msg = classifyError instanceof Error ? classifyError.message : String(classifyError);
            console.warn(`[QUALITY]   AI classify fallback failed for ${article.id}: ${msg}`);
          }
        }
        if (category) {
          await updateArticleCategory(article.id, category);
          articlesClassified++;
        }

        // AI Summary (P-3 editorial voice) — required field population
        try {
          const summary = await aiProvider.summarize({
            text: `${article.title}\n\n${article.raw_summary ?? ""}`,
          });
          await updateArticleSummary(article.id, {
            summary: summary.summary,
            why_it_matters: summary.why_it_matters,
            who_it_affects: summary.who_it_affects,
            worth_trying: summary.worth_trying,
          });
          articlesSummarized++;
        } catch (summarizeError) {
          if (summarizeError instanceof GeminiKeysExhaustedError) {
            // P-1.1: fail loudly via the report-level hold, not a crash.
            aiUnavailableCount++;
            if (summarizeError.reason === "suspected_suspension") {
              aiSuspectedSuspension = true;
            } else if (summarizeError.reason === "model_deprecated") {
              aiModelDeprecated = true;
            }
            const reasonLabel =
              summarizeError.reason === "suspected_suspension"
                ? "possible account suspension"
                : summarizeError.reason === "model_deprecated"
                  ? "configured Gemini model deprecated on at least one key's project"
                  : "all keys rate-limited";
            console.warn(`[QUALITY]   AI summary unavailable for ${article.id}: ${reasonLabel}`);
          } else {
            const msg = summarizeError instanceof Error ? summarizeError.message : String(summarizeError);
            errors.push(`Article ${article.id} summarize: ${msg}`);
          }
        }
      } catch (articleError) {
        const errorMsg = articleError instanceof Error ? articleError.message : String(articleError);
        errors.push(`Article ${article.id}: ${errorMsg}`);
      }
    }

    return {
      success: errors.length === 0,
      articlesScored,
      articlesClassified,
      articlesSummarized,
      aiUnavailableCount,
      aiSuspectedSuspension,
      aiModelDeprecated,
      errors,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      articlesScored: 0,
      articlesClassified: 0,
      articlesSummarized: 0,
      aiUnavailableCount: 0,
      aiSuspectedSuspension: false,
      aiModelDeprecated: false,
      errors: [errorMsg],
    };
  }
}

/**
 * Phase 4: Daily Report Generation
 * Aggregates articles into markdown, checks review conditions
 */
async function generateDailyReport(
  aiUnavailableCount: number,
  aiSuspectedSuspension: boolean,
  aiModelDeprecated: boolean,
): Promise<{
  success: boolean;
  date: string;
  articleCount: number;
  reviewStatus: "auto_published" | "held_for_review";
  holdReasons: string[];
  urgent: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  const holdReasons: string[] = [];
  const date = new Date().toISOString().split("T")[0]!;
  let urgent = false;

  try {
    const articles = await getArticlesForDailyReport();
    console.log(`[REPORT] Generating report for ${date} (${articles.length} articles)`);

    // P-6 publish gate: confidence threshold AND hype-word filter (P-3).
    // A hype word in any article's text blocks auto-publish.
    const holdDecision = evaluateReportHold(articles);
    holdReasons.push(...holdDecision.reasons);
    if (holdDecision.hypeCount > 0) {
      console.log(`[REPORT]   ⚠ P-3 hype filter: ${holdDecision.hypeCount} article(s) with hype words → hold`);
    }

    // Sprint 05 §5 / P-1.1: AI key exhaustion never silently publishes an
    // incomplete report — hold with an explicit reason instead.
    // PDL-012: the two failure kinds must read unmistakably differently —
    // "wait until tomorrow" vs. "act now" are not the same alert.
    if (aiUnavailableCount > 0) {
      if (aiSuspectedSuspension) {
        urgent = true;
        holdReasons.push(
          `All AI providers unavailable — possible account suspension (not just quota exhaustion). ${aiUnavailableCount} article(s) affected. Verify Gemini account/key status immediately.`,
        );
      } else if (aiModelDeprecated) {
        // Found live 2026-09-11: distinct from both a rate limit (self-
        // resolves) and a suspension (an account problem) -- Google has
        // sunset the configured model on at least one key's project ("no
        // longer available to new users"). No amount of retrying fixes
        // this; GEMINI_MODEL needs to be updated.
        urgent = true;
        holdReasons.push(
          `AI summary unavailable — the configured Gemini model is deprecated on at least one key's project (${aiUnavailableCount} article(s) affected). Update GEMINI_MODEL; retrying will not resolve this on its own.`,
        );
      } else {
        holdReasons.push(
          `AI summary unavailable — all Gemini API keys rate-limited (quota exhausted for today, ${aiUnavailableCount} article(s)). No action needed; retry next scheduled run.`,
        );
      }
    }

    // Generate markdown (simple aggregation for MVP)
    const markdown = articles
      .map(
        (a) => `## ${a.title}
${a.summary || a.raw_summary || ""}
- Source: ${a.source || "Unknown"}
- Category: ${a.category || "Uncategorized"}
- Why it matters: ${a.why_it_matters || "TBD"}`,
      )
      .join("\n\n");

    // Determine review status
    const reviewStatus: "auto_published" | "held_for_review" = holdReasons.length > 0 ? "held_for_review" : "auto_published";

    // Upsert report
    const savedReport = await upsertDailyReport(date, {
      markdown: markdown ?? "",
      article_count: articles.length,
      reading_time_minutes: Math.ceil(articles.length * 2),
      sections: ["Summary", "Articles"],
      review_status: reviewStatus,
    });

    // Sprint 10 / migration 009: record which articles went into this
    // report, for per-article Archive/Bookmarks UI. Best-effort -- the
    // report itself is already saved and correct without this, so a
    // failure here is logged, not allowed to fail report generation.
    try {
      await linkArticlesToReport(
        savedReport.id,
        articles.map((a) => a.id),
      );
    } catch (linkError) {
      // Deliberately NOT pushed to `errors` -- that would flip
      // `success: errors.length === 0` to false for a report that
      // published/held correctly and just lost the per-article Archive/
      // Bookmarks metadata, which is a real but much smaller problem.
      const msg = linkError instanceof Error ? linkError.message : String(linkError);
      console.error(`[REPORT]   Failed to link articles to report ${savedReport.id}: ${msg}`);
    }

    return {
      success: errors.length === 0,
      date,
      articleCount: articles.length,
      reviewStatus,
      holdReasons,
      urgent,
      errors,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      date,
      articleCount: 0,
      reviewStatus: "held_for_review",
      holdReasons: ["Error generating report"],
      urgent: false,
      errors: [errorMsg],
    };
  }
}
