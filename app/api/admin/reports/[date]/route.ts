/**
 * Admin API: GET /api/admin/reports/[date]
 * Get detailed review for a specific date
 * Auth: Admin only
 */

import { isCalendarDate } from "@/lib/validation/dates";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/client";
import { verifyAdminToken } from "@/lib/auth/verify-token";
import type { DailyReport, Article } from "@/lib/validation/schemas";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> },
) {
  const { date } = await params;
  try {
    // E-6 Step 1: Authenticate + E-6 Step 2: Authorize (admin role check)
    const authHeader = request.headers.get("authorization");
    const verified = await verifyAdminToken(authHeader);

    if (!verified) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // E-6 Step 3: Validate date format (YYYY-MM-DD)
    if (!isCalendarDate(date)) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    if (!supabaseAdmin) {
      throw new Error("Admin client not available");
    }

    // E-6 Step 4: Execute
    // Get report
    const { data: reportData, error: reportError } = await supabaseAdmin
      .from("daily_reports")
      .select("*")
      .eq("date", date)
      .single();

    if (reportError && reportError.code !== "PGRST116") {
      throw new Error(`Failed to fetch report: ${reportError.message}`);
    }

    if (!reportData) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Get articles for this report
    // For MVP, parse from markdown or fetch all non-duplicate articles
    // TODO: Link articles to daily_reports via junction table (future)
    const { data: articlesData, error: articlesError } = await supabaseAdmin
      .from("articles")
      .select("*")
      .is("duplicate_of", null)
      .order("published_at", { ascending: false })
      .limit(100);

    if (articlesError) {
      throw new Error(`Failed to fetch articles: ${articlesError.message}`);
    }

    // E-6 Step 5: Return
    return NextResponse.json(
      {
        success: true,
        date,
        report: reportData as DailyReport,
        articles: articlesData as Article[],
        articleCount: articlesData?.length || 0,
      },
      { status: 200 },
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[ADMIN] Error fetching report details: ${errorMsg}`);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
