import { supabaseAdmin } from "@/lib/db/client";
import type { DailyReport } from "@/lib/validation/schemas";

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
