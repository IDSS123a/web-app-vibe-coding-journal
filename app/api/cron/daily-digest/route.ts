/**
 * Cron endpoint: /api/cron/daily-digest
 * Orchestrates Source Collector → Duplicate Engine pipeline
 * Security: Requires CRON_SECRET header (environment variable)
 * Usage: curl -X POST http://localhost:3000/api/cron/daily-digest -H "Authorization: Bearer $CRON_SECRET"
 */

import { NextRequest, NextResponse } from "next/server";
import { collectArticlesFromAllSources } from "@/features/sources/actions";
import { getArticleByHash, markArticleAsDuplicate, getNonDuplicateArticles } from "@/features/pipeline/repository";

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

    // 5. RETURN
    const duration = Date.now() - startTime;
    const response = {
      success: collectResult.success && dedupeResult.success,
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
 * Processes new (non-duplicate) articles:
 * 1. Check hash against existing articles
 * 2. If no hash match, check similarity (if summary exists)
 * 3. Mark duplicates with duplicate_of reference
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
    // Get articles without duplicate_of set (new articles from Source Collector)
    const newArticles = await getNonDuplicateArticles();

    console.log(`[DEDUP] Processing ${newArticles.length} new articles for duplicates`);

    for (const article of newArticles) {
      try {
        // Check hash first (exact match)
        const existingByHash = await getArticleByHash(article.hash);

        if (existingByHash) {
          // Exact duplicate found
          await markArticleAsDuplicate(article.id, existingByHash.id);
          duplicatesFound++;
          continue;
        }

        // No exact match — check similarity (if summaries exist)
        if (article.raw_summary) {
          // In production: query vector DB for similarity
          // For now: skip similarity search (Sprint 3 can add this)
          // This is an explicit out-of-scope placeholder
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
