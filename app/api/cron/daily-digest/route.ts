/**
 * Cron endpoint: /api/cron/daily-digest
 * Orchestrates: Source Collector → Duplicate Engine → Quality Engine →
 *               Classifier → Daily Report Generation
 * Security: Requires CRON_SECRET header (environment variable)
 * Usage: curl -X POST http://localhost:3000/api/cron/daily-digest -H "Authorization: Bearer $CRON_SECRET"
 */

import { NextRequest, NextResponse } from "next/server";
import { collectArticlesFromAllSources } from "@/features/sources/actions";
import {
  getArticleByHash,
  markArticleAsDuplicate,
  getNonDuplicateArticles,
  updateArticleConfidence,
  updateArticleCategory,
  getArticlesForDailyReport,
} from "@/features/pipeline/repository";
import { upsertDailyReport } from "@/features/daily-report/repository";
import {
  scoreArticleConfidence,
  classifyArticle,
  evaluateReportHold,
} from "@/features/pipeline/quality-engine";
import { sendReviewQueueAlert } from "@/lib/email/resend";

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

    console.log("[CRON] Starting daily digest pipeline");

    // 2. AUTHORIZE (already authenticated)

    // 3. VALIDATE (N/A — no request body)

    // 4. EXECUTE
    console.log("[CRON] Phase 1: Source Collector (fetch + parse)");
    const collectResult = await collectArticlesFromAllSources();

    console.log(`[CRON]   ✓ Collected ${collectResult.articlesAdded} articles from ${collectResult.sourcesProcessed} sources`);
    if (collectResult.errors.length > 0) {
      console.warn(`[CRON]   ⚠ ${collectResult.errors.length} source errors (see details below)`);
    }

    // Phase 2: Duplicate Engine
    console.log("[CRON] Phase 2: Duplicate Engine (deduplication)");
    const dedupeResult = await deduplicateArticles();
    console.log(`[CRON]   ✓ Deduplicated: ${dedupeResult.duplicatesFound} duplicates marked`);

    // Phase 3: Quality Engine + Classifier
    console.log("[CRON] Phase 3: Quality Engine & Classifier");
    const qualityResult = await runQualityEngine();
    console.log(
      `[CRON]   ✓ Quality scored: ${qualityResult.articlesScored}, Classified: ${qualityResult.articlesClassified}`,
    );

    // Phase 4: Daily Report Generation
    console.log("[CRON] Phase 4: Daily Report Generation");
    const reportResult = await generateDailyReport();
    console.log(
      `[CRON]   ✓ Report generated: ${reportResult.articleCount} articles, status: ${reportResult.reviewStatus}`,
    );

    if (reportResult.reviewStatus === "held_for_review" && reportResult.holdReasons) {
      console.log(`[CRON]   ⚠ Review queue: ${reportResult.holdReasons.join(", ")}`);
      await sendReviewQueueAlert({
        date: reportResult.date,
        articleCount: reportResult.articleCount,
        reasons: reportResult.holdReasons,
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

    for (const article of newArticles) {
      try {
        const existingByHash = await getArticleByHash(article.hash, article.id);
        if (existingByHash) {
          await markArticleAsDuplicate(article.id, existingByHash.id);
          duplicatesFound++;
        }
      } catch (articleError) {
        const errorMsg = articleError instanceof Error ? articleError.message : String(articleError);
        errors.push(`Article ${article.id}: ${errorMsg}`);
      }
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
 * Phase 3: Quality Engine & Classifier
 * Scores all articles and assigns categories
 */
async function runQualityEngine(): Promise<{
  success: boolean;
  articlesScored: number;
  articlesClassified: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let articlesScored = 0;
  let articlesClassified = 0;

  try {
    const articles = await getNonDuplicateArticles();
    console.log(`[QUALITY] Processing ${articles.length} articles`);

    for (const article of articles) {
      try {
        // Score confidence
        const confidence = scoreArticleConfidence(article);
        await updateArticleConfidence(article.id, confidence);
        articlesScored++;

        // Classify category
        const category = classifyArticle(article);
        if (category) {
          await updateArticleCategory(article.id, category);
          articlesClassified++;
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
      errors,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      articlesScored: 0,
      articlesClassified: 0,
      errors: [errorMsg],
    };
  }
}

/**
 * Phase 4: Daily Report Generation
 * Aggregates articles into markdown, checks review conditions
 */
async function generateDailyReport(): Promise<{
  success: boolean;
  date: string;
  articleCount: number;
  reviewStatus: "auto_published" | "held_for_review";
  holdReasons: string[];
  errors: string[];
}> {
  const errors: string[] = [];
  const holdReasons: string[] = [];
  const date = new Date().toISOString().split("T")[0]!;

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
    await upsertDailyReport(date, {
      markdown: markdown ?? "",
      article_count: articles.length,
      reading_time_minutes: Math.ceil(articles.length * 2),
      sections: ["Summary", "Articles"],
      review_status: reviewStatus,
    });

    return {
      success: errors.length === 0,
      date,
      articleCount: articles.length,
      reviewStatus,
      holdReasons,
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
      errors: [errorMsg],
    };
  }
}
