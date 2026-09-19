/**
 * GET /api/reports/latest — the report the dashboard shows: the most recent
 * PUBLISHED Daily Report (auto_published / manually_approved only, P-6) with
 * its articles. `report` is null when nothing has ever been published.
 * Role required: authenticated with currently-active paid access (Basic or
 * Premium, or trial) — admin exempt. No payment → no content.
 * Response: { success: true, data: { report, articles, relatedSources } }
 * Errors: 401 (no valid token), 403 (no active subscription), 500
 * Server-side paywall: see features/daily-report/access.ts.
 * E-6 five-step: authenticate → authorise → (no body) → execute → return.
 */

import { NextRequest, NextResponse } from "next/server";
import { requirePaidContentAccess } from "@/features/daily-report/access";
import { getMostRecentPublishedDailyReport } from "@/features/daily-report/repository";
import { getArticlesForReport } from "@/features/archive/repository";
import { getRelatedSourcesForArticles } from "@/features/pipeline/repository";

export async function GET(request: NextRequest) {
  try {
    const access = await requirePaidContentAccess(request);
    if (!access.ok) return access.response;

    const report = await getMostRecentPublishedDailyReport();
    if (!report) {
      return NextResponse.json({ success: true, data: { report: null, articles: [], relatedSources: {} } });
    }

    const articles = await getArticlesForReport(report.id);
    const relatedSources =
      articles.length > 0 ? Object.fromEntries(await getRelatedSourcesForArticles(articles.map((a) => a.id))) : {};

    return NextResponse.json({ success: true, data: { report, articles, relatedSources } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[REPORTS] latest failed: ${message}`);
    return NextResponse.json({ error: "Failed to load the report" }, { status: 500 });
  }
}
