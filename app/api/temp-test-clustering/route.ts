/**
 * TEMP verification route for Phase 4's event clustering (2026-09-13).
 * Directly exercises collectArticlesFromAllSources() +
 * deduplicateArticles()-equivalent logic against real, freshly-
 * collected articles from the now-14-source directory, bypassing the
 * daily-digest endpoint's idempotency gate (today's report already
 * exists, so that endpoint would just skip). Delete immediately after use.
 */
import { NextRequest, NextResponse } from "next/server";
import { collectArticlesFromAllSources } from "@/features/sources/actions";
import {
  getArticleByHash,
  markArticleAsDuplicate,
  getNonDuplicateArticles,
} from "@/features/pipeline/repository";
import { clusterDuplicateEvents } from "@/features/pipeline/domain";
import { verifyAdminToken } from "@/lib/auth/verify-token";
import type { Article } from "@/lib/validation/schemas";

const CRON_SECRET = process.env.CRON_SECRET || "dev-secret-change-in-production";

function validateCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;
  const [scheme, token] = authHeader.split(" ");
  return scheme === "Bearer" && token === CRON_SECRET;
}

export async function POST(request: NextRequest) {
  const isCronRequest = validateCronAuth(request);
  if (!isCronRequest) {
    const verified = await verifyAdminToken(request.headers.get("authorization"));
    if (!verified) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const collectResult = await collectArticlesFromAllSources();

  const newArticles = await getNonDuplicateArticles();
  const remaining: Article[] = [];
  let hashDuplicates = 0;
  for (const article of newArticles) {
    const existingByHash = await getArticleByHash(article.hash, article.id);
    if (existingByHash) {
      hashDuplicates++;
    } else {
      remaining.push(article);
    }
  }

  const clusters = clusterDuplicateEvents(remaining);
  const eventClusters = clusters.filter((c) => c.duplicateIds.length > 0);

  // Report only -- does NOT call markArticleAsDuplicate, so this run is
  // safe to repeat without side effects while diagnosing.
  void markArticleAsDuplicate;

  return NextResponse.json({
    collectResult,
    totalNewArticles: newArticles.length,
    hashDuplicates,
    remainingAfterHashDedup: remaining.length,
    totalClusters: clusters.length,
    eventClustersFound: eventClusters.length,
    eventClusters: eventClusters.map((c) => ({
      canonical: remaining.find((a) => a.id === c.canonicalId)?.title,
      duplicates: c.duplicateIds.map((id) => remaining.find((a) => a.id === id)?.title),
    })),
  });
}
