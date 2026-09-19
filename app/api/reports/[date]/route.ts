/**
 * GET /api/reports/[date] — one published Daily Report (YYYY-MM-DD) with its
 * articles. P-6: a held or rejected report is indistinguishable from a
 * missing one (404).
 * Role required: authenticated with currently-active paid access (Basic or
 * Premium, or trial) — admin exempt.
 * Response: { success: true, data: { report, articles, relatedSources } }
 * Errors: 401, 403 (no active subscription), 404, 500
 * Server-side paywall: see features/daily-report/access.ts.
 * E-6 five-step: authenticate → authorise → validate → execute → return.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePaidContentAccess } from "@/features/daily-report/access";
import { getPublishedReportByDate, getArticlesForReport } from "@/features/archive/repository";
import { getRelatedSourcesForArticles } from "@/features/pipeline/repository";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export async function GET(request: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  try {
    const access = await requirePaidContentAccess(request);
    if (!access.ok) return access.response;

    const { date } = await params;
    const parsed = dateSchema.safeParse(date);
    if (!parsed.success) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const report = await getPublishedReportByDate(parsed.data);
    if (!report) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const articles = await getArticlesForReport(report.id);
    const relatedSources =
      articles.length > 0 ? Object.fromEntries(await getRelatedSourcesForArticles(articles.map((a) => a.id))) : {};

    return NextResponse.json({ success: true, data: { report, articles, relatedSources } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[REPORTS] report by date failed: ${message}`);
    return NextResponse.json({ error: "Failed to load the report" }, { status: 500 });
  }
}
