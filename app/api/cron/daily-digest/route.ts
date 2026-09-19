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
import { runEnrichment } from "@/features/pipeline/enrichment";
import { acquireCronLock, releaseCronLock } from "@/lib/cron/lock";
import { aiCallsInLast24h, recordAiCalls } from "@/lib/ai/usage";
import { stripAiTells } from "@/lib/text/no-ai-tells";
import { classifyPendingTerms } from "@/features/dictionary/classify-pending";
import { runDictionaryLearning } from "@/features/dictionary/run-learning";
import {
  getArticleByHash,
  markArticleAsDuplicate,
  getNonDuplicateArticles,
  getArticlesForDailyReport,
  getRelatedSourcesForArticles,
} from "@/features/pipeline/repository";
import { upsertDailyReport, getDailyReportByDate, linkArticlesToReport } from "@/features/daily-report/repository";
import { isTargetOperationsHour, isPastCatchUpDeadline } from "@/lib/cron/schedule-gate";
import { evaluateReportHold } from "@/features/pipeline/quality-engine";
import { clusterDuplicateEvents } from "@/features/pipeline/domain";
import { sendReviewQueueAlert } from "@/lib/email/resend";
import { ensureAIProviderInitialized } from "@/lib/ai/init";
import { formatDigestEntry } from "@/features/daily-report/format";
import { isValidCronSecret } from "@/lib/cron/auth";

/**
 * Authenticate cron request via Bearer token
 * E-6: Five-step sequence (auth → authorize → validate → execute → return)
 */
function validateCronAuth(request: NextRequest): boolean {
  return isValidCronSecret(request.headers.get("authorization"));
}

/**
 * POST /api/cron/daily-digest
 * Returns: { success, stats, errors }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let lockHeld = false;

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
      console.log("[CRON] Not the configured target hour, running backlog work only");
      return await backlogResponse("not_target_hour", startTime);
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
        `[CRON] Report for ${todayDate} already exists (status: ${existingReport.review_status}), running backlog work only`,
      );
      return await backlogResponse("already_generated_today", startTime);
    }

    // Two triggers can fire within seconds of each other (GitHub Actions and cron-job.org);
    // only one may run the pipeline. The lease expires by itself if a run is killed.
    if (!(await acquireCronLock(DIGEST_LOCK, DIGEST_LOCK_TTL_MS))) {
      console.log("[CRON] Another digest run holds the lock, standing down");
      return NextResponse.json({ success: true, skipped: true, reason: "another_run_in_progress" }, { status: 200 });
    }
    lockHeld = true;

    if (!isTargetHour) {
      console.log("[CRON] Target hour was missed today, catch-up safety net triggering the pipeline now");
    }
    console.log("[CRON] Starting daily digest pipeline");
    ensureAIProviderInitialized();

    // 4. EXECUTE
    // Per-phase wall-clock timing (2026-09-18, P-21 diagnosis): real runs
    // were measured at ~290s of the 300s Vercel budget with no way to
    // tell which phase consumed it -- recorded in `phaseDurationsMs` in
    // the response so the next run's own log answers that. Diagnostic
    // only; pipeline behavior is unchanged.
    const phaseDurationsMs: Record<string, number> = {};
    let phaseStart = Date.now();
    const endPhase = (name: string): void => {
      phaseDurationsMs[name] = Date.now() - phaseStart;
      console.log(`[CRON]   ⏱ ${name} took ${phaseDurationsMs[name]}ms (total so far ${Date.now() - startTime}ms)`);
      phaseStart = Date.now();
    };

    console.log("[CRON] Phase 1: Source Collector (fetch + parse)");
    const collectResult = await collectArticlesFromAllSources();
    endPhase("sourceCollector");

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
    endPhase("duplicateEngine");
    console.log(`[CRON]   ✓ Deduplicated: ${dedupeResult.duplicatesFound} duplicates marked`);

    // Phase 3: Quality Engine + Classifier + AI Summary
    console.log("[CRON] Phase 3: Enrichment (triage, batched relevance, summaries)");
    const qualityResult = await runEnrichment({
      limit: MAX_ARTICLES_PER_ENRICHMENT_RUN,
      deadlineAt: startTime + ENRICHMENT_DEADLINE_MS,
      maxSummaries: MAX_SUMMARIES_REPORT_RUN,
    });
    endPhase("qualityEngine");
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
    endPhase("dailyReport");
    if (reportResult.noEligibleArticles) {
      // Nothing finished and relevant yet. Writing an empty report would block the whole day
      // (the idempotency check above would then skip every later run), so write nothing: the
      // next hourly run continues the enrichment and tries again.
      console.log("[CRON]   No eligible articles yet, no report written; the next run will retry");
      return NextResponse.json(
        { success: true, skipped: true, reason: "no_eligible_articles_yet", phaseDurationsMs, durationMs: Date.now() - startTime },
        { status: 200 },
      );
    }
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
      phaseDurationsMs,
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
          triageSkipped: qualityResult.triageSkipped,
          batchCalls: qualityResult.batchCalls,
          stoppedForBudget: qualityResult.stoppedForBudget,
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
  } finally {
    if (lockHeld) await releaseCronLock(DIGEST_LOCK);
  }
}

/**
 * Response for invocations that are not the report run: do the hourly backlog work
 * under the same lease, so two simultaneous triggers do not both spend AI quota.
 */
async function backlogResponse(reason: string, startTime: number): Promise<NextResponse> {
  if (!(await acquireCronLock(DIGEST_LOCK, DIGEST_LOCK_TTL_MS))) {
    return NextResponse.json({ success: true, skipped: true, reason: "another_run_in_progress" }, { status: 200 });
  }
  try {
    const backlog = await runBacklogCycle(startTime);
    return NextResponse.json({ success: true, skipped: true, reason, backlog }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[CRON] Backlog cycle failed: ${msg}`);
    return NextResponse.json({ success: false, skipped: true, reason, error: msg }, { status: 500 });
  } finally {
    await releaseCronLock(DIGEST_LOCK);
  }
}

// Found live 2026-09-14, active outage (discovered AFTER the Quality Engine
// cap below already shipped and the run STILL timed out at 300s with no
// rate-limiting involved): this phase's comment claimed the batch was
// "typically tens of items" but getNonDuplicateArticles() was called here
// with NO limit at all. That claim was true only as long as the backlog
// stayed small -- once it grew past PostgREST's own default 1000-row cap
// (confirmed live via a direct count query: 2786 real unscored articles,
// not the 1000 the logs seemed to show), clusterDuplicateEvents() started
// receiving up to 1000 articles per run despite its own doc comment
// (features/pipeline/domain.ts) explicitly warning it must never run
// against an all-time set -- an O(n²) similarity comparison over 1000
// items is the exact cost that comment warned about, and matches what was
// observed live: a run with only 5 Quality Engine articles and zero
// rate-limit rotations still burned the full 300s budget. Same fix
// pattern as MAX_ARTICLES_PER_QUALITY_RUN below: cap this phase too, so a
// single run's clustering cost is bounded regardless of backlog size, and
// let the backlog drain across multiple runs. 200 is a conservative first
// value (this phase does no AI calls, so headroom is generous versus the
// Quality Engine's per-article Gemini cost) -- revisit upward with live
// evidence once the backlog is confirmed shrinking.
const MAX_ARTICLES_PER_DEDUP_RUN = 200;

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
 *    event, not one per source. Bounded to THIS run's own batch via
 *    MAX_ARTICLES_PER_DEDUP_RUN — never an all-time comparison, per the
 *    unbounded-growth lesson already learned twice this project
 *    (getArticlesForDailyReport, fixed 2026-09-10; this same function's
 *    Quality Engine caller, fixed earlier the same day as this comment).
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
    const newArticles = await getNonDuplicateArticles(MAX_ARTICLES_PER_DEDUP_RUN);
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

// Time budget (2026-09-19). The function is killed at 300 s, and that kill used to be
// the only thing that ever ended a slow run: no report, no error, a 504 in the trigger
// log (third occurrence, run 35444198913). Every phase now works against a deadline
// and stops cleanly, leaving the rest of the queue for the next hourly run. The
// enrichment deadline leaves about a minute for the report and the response.
const ENRICHMENT_DEADLINE_MS = 215_000;
// Off-target hours do backlog work only. The first live cycle (2026-09-19) took 266 s of the
// 300 s limit and the Dictionary steps never got to run, because article enrichment used the
// whole window: AI calls dominate (about 30 to 40 s each while one model is overloaded and the
// other spent). So enrichment gets the first part of the window, and the Dictionary
// classification and learning steps are guaranteed the rest, all inside 225 s in total.
const BACKLOG_ENRICH_DEADLINE_MS = 130_000;
const BACKLOG_DEADLINE_MS = 225_000;
const MAX_ARTICLES_PER_ENRICHMENT_RUN = 150;
// Per-article summary calls are the expensive part. A report holds at most 20 articles.
const MAX_SUMMARIES_REPORT_RUN = 30;
const MAX_SUMMARIES_BACKLOG_RUN = 8;
// Background enrichment may spend this many AI requests per trailing 24 hours. Measured
// 2026-09-19: the free tier allows about 20 requests per day per key per model, roughly
// 100 to 240 in all across the live keys and the two models, and that pool also has to
// cover the report itself (about 40), the Assistant (cap 30) and the University.
const BACKLOG_DAILY_AI_CALL_BUDGET = 100;
const BACKLOG_PURPOSE = "backlog_enrichment";
const MAX_DICTIONARY_CALLS_PER_RUN = 2;
const MAX_DISCOVERY_CALLS_PER_RUN = 1;
const DIGEST_LOCK = "digest";
const DIGEST_LOCK_TTL_MS = 290_000;

/**
 * Hourly work on every invocation that is not the report run: collect fresh articles,
 * mark duplicates, and drain the enrichment queue (relevance, confidence, category,
 * summary). This is what keeps the system growing between reports and what works off a
 * backlog; before it, every non-target hour returned "skipped" and did nothing.
 */
async function runBacklogCycle(startTime: number) {
  ensureAIProviderInitialized();
  const collect = await collectArticlesFromAllSources();
  const dedupe = await deduplicateArticles();
  const usedToday = await aiCallsInLast24h(BACKLOG_PURPOSE);
  const remaining = Math.max(0, BACKLOG_DAILY_AI_CALL_BUDGET - usedToday);
  const enrichment = await runEnrichment({
    limit: MAX_ARTICLES_PER_ENRICHMENT_RUN,
    deadlineAt: startTime + BACKLOG_ENRICH_DEADLINE_MS,
    maxAiCalls: remaining,
    maxSummaries: MAX_SUMMARIES_BACKLOG_RUN,
  });
  // Whatever budget the articles left goes to filing imported dictionary terms (a few calls
  // an hour until none are pending; features/dictionary/classify-pending.ts).
  const leftForDictionary = Math.max(0, remaining - enrichment.aiCalls);
  const dictionary = await classifyPendingTerms({
    maxCalls: Math.min(MAX_DICTIONARY_CALLS_PER_RUN, leftForDictionary),
    deadlineAt: startTime + BACKLOG_DEADLINE_MS,
  });
  // The Dictionary learns from the day's articles: mention counts (no AI, so always), and one
  // discovery call when budget is left (features/dictionary/run-learning.ts).
  const learning = await runDictionaryLearning({
    maxAiCalls: Math.min(MAX_DISCOVERY_CALLS_PER_RUN, Math.max(0, leftForDictionary - dictionary.calls)),
    deadlineAt: startTime + BACKLOG_DEADLINE_MS,
  });
  const aiCallsThisRun = enrichment.aiCalls + dictionary.calls + learning.aiCalls;
  await recordAiCalls(BACKLOG_PURPOSE, aiCallsThisRun);
  return {
    aiBudget: { dailyBudget: BACKLOG_DAILY_AI_CALL_BUDGET, usedBefore: usedToday, usedThisRun: aiCallsThisRun },
    learning: {
      termsWithMentions: learning.termsWithMentions,
      articlesRead: learning.articlesRead,
      candidatesSeen: learning.candidatesSeen,
      promoted: learning.promoted,
      errors: learning.errors.length,
    },
    dictionary: { classified: dictionary.classified, calls: dictionary.calls, pendingBefore: dictionary.pendingBefore, errors: dictionary.errors.length },
    collected: { articlesAdded: collect.articlesAdded, sourcesProcessed: collect.sourcesProcessed, errors: collect.errors.length },
    duplicates: dedupe.duplicatesFound,
    enrichment: {
      scored: enrichment.articlesScored,
      summarized: enrichment.articlesSummarized,
      triageSkipped: enrichment.triageSkipped,
      batchCalls: enrichment.batchCalls,
      stoppedForBudget: enrichment.stoppedForBudget,
      errors: enrichment.errors.length,
    },
    durationMs: Date.now() - startTime,
  };
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
  noEligibleArticles?: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  const holdReasons: string[] = [];
  const date = new Date().toISOString().split("T")[0]!;
  let urgent = false;

  try {
    const articles = await getArticlesForDailyReport();
    console.log(`[REPORT] Generating report for ${date} (${articles.length} articles)`);
    if (articles.length === 0) {
      return { success: true, date, articleCount: 0, reviewStatus: "held_for_review", holdReasons: [], urgent: false, noEligibleArticles: true, errors };
    }

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
          `All AI providers unavailable, possible account suspension (not just quota exhaustion). ${aiUnavailableCount} article(s) affected. Verify Gemini account/key status immediately.`,
        );
      } else if (aiModelDeprecated) {
        // Found live 2026-09-11: distinct from both a rate limit (self-
        // resolves) and a suspension (an account problem) -- Google has
        // sunset the configured model on at least one key's project ("no
        // longer available to new users"). No amount of retrying fixes
        // this; GEMINI_MODEL needs to be updated.
        urgent = true;
        holdReasons.push(
          `AI summary unavailable, the configured Gemini model is deprecated on at least one key's project (${aiUnavailableCount} article(s) affected). Update GEMINI_MODEL; retrying will not resolve this on its own.`,
        );
      } else {
        holdReasons.push(
          `AI summary unavailable, all Gemini API keys rate-limited (quota exhausted for today, ${aiUnavailableCount} article(s)). No action needed; retry next scheduled run.`,
        );
      }
    }

    // Phase 5: WHAT HAPPENED / WHY IT MATTERS / EVIDENCE / CONFIDENCE /
    // WHAT TO WATCH format — see formatDigestEntry() above.
    const relatedSources = await getRelatedSourcesForArticles(articles.map((a) => a.id));
    const markdown = articles
      .map((a) => formatDigestEntry(a, relatedSources.get(a.id) ?? []))
      .join("\n\n");

    // Determine review status
    const reviewStatus: "auto_published" | "held_for_review" = holdReasons.length > 0 ? "held_for_review" : "auto_published";

    // Upsert report
    const savedReport = await upsertDailyReport(date, {
      // Whole report passes the writing rule once more at the last moment (PDL-057).
      markdown: stripAiTells(markdown ?? ""),
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
