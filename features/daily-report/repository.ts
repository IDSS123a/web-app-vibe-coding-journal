import { supabaseAdmin } from "@/lib/db/client";
import type { DailyReport } from "@/lib/validation/schemas";

/**
 * Sprint 10 / migration 009: records which article rows were actually
 * rendered into a report, at generation time -- see that migration's
 * comment for why this is needed (per-article Archive/Bookmarks UI).
 * Called once per report generation, right after the report itself is
 * upserted (app/api/cron/daily-digest/route.ts generateDailyReport()).
 * Best-effort: a failure here must never fail report generation itself
 * (the report and its markdown are already saved and correct without
 * this) -- logged and swallowed, not thrown, by the caller.
 */
export async function linkArticlesToReport(reportId: string, articleIds: string[]): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }
  if (articleIds.length === 0) {
    return;
  }

  const rows = articleIds.map((articleId) => ({ report_id: reportId, article_id: articleId }));

  const { error } = await supabaseAdmin
    .from("daily_report_articles")
    .upsert(rows, { onConflict: "report_id,article_id", ignoreDuplicates: true });

  if (error) {
    throw new Error(`Failed to link articles to report ${reportId}: ${error.message}`);
  }
}

/**
 * Create or update Daily Report for today
 */
export async function upsertDailyReport(
  date: string,
  report: Partial<DailyReport>,
): Promise<DailyReport> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { data, error } = await supabaseAdmin
    .from("daily_reports")
    .upsert(
      {
        date,
        markdown: report.markdown ?? "",
        reading_time_minutes: report.reading_time_minutes ?? 0,
        article_count: report.article_count ?? 0,
        sections: report.sections ?? [],
        review_status: report.review_status ?? "auto_published",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "date" },
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upsert daily report: ${error.message}`);
  }

  return data as DailyReport;
}

/**
 * Get today's Daily Report
 */
export async function getTodaysDailyReport(): Promise<DailyReport | null> {
  const today = new Date().toISOString().split("T")[0]!;
  return getDailyReportByDate(today);
}

/**
 * Get Daily Report by date
 */
export async function getDailyReportByDate(date: string): Promise<DailyReport | null> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { data, error } = await supabaseAdmin
    .from("daily_reports")
    .select("*")
    .eq("date", date)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = not found
    throw new Error(`Failed to fetch daily report: ${error.message}`);
  }

  return (data as DailyReport) || null;
}

/**
 * Get the most recent Daily Report that is actually safe to show the
 * public (auto_published or manually_approved) -- never held_for_review
 * or rejected, which is the entire point of the P-6 review gate. Used as
 * a fallback when today's report either doesn't exist yet or hasn't
 * cleared review, so a visitor still sees the last genuinely good report
 * instead of nothing.
 */
export async function getMostRecentPublishedDailyReport(): Promise<DailyReport | null> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { data, error } = await supabaseAdmin
    .from("daily_reports")
    .select("*")
    .in("review_status", ["auto_published", "manually_approved"])
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch most recent published daily report: ${error.message}`);
  }

  return (data as DailyReport) || null;
}

/**
 * Update Daily Report review status
 */
export async function updateDailyReportStatus(
  reportId: string,
  status: "auto_published" | "held_for_review" | "manually_approved" | "rejected",
): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { error } = await supabaseAdmin
    .from("daily_reports")
    .update({
      review_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (error) {
    throw new Error(`Failed to update report status: ${error.message}`);
  }
}
