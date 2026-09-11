// Archive — Historical reports and search (Sprint 10)
// Repository for accessing historical daily reports

import { supabaseAdmin } from "@/lib/db/client";
import type { Article, DailyReport } from "@/lib/validation/schemas";

const PAGE_SIZE = 20;

export interface ArchivePage {
  reports: DailyReport[];
  hasMore: boolean;
}

/**
 * Paginated list of past reports, newest first. P-6: only ever
 * auto_published/manually_approved -- held_for_review and rejected must
 * never reach a real visitor, same rule the dashboard already applies
 * (app/dashboard/page.tsx).
 */
export async function getPublishedReportsPage(page: number): Promise<ArchivePage> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE; // fetch one extra to detect a next page

  const { data, error } = await supabaseAdmin
    .from("daily_reports")
    .select("*")
    .in("review_status", ["auto_published", "manually_approved"])
    .order("date", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to fetch archive page: ${error.message}`);
  }

  const rows = (data ?? []) as DailyReport[];
  const hasMore = rows.length > PAGE_SIZE;
  return { reports: hasMore ? rows.slice(0, PAGE_SIZE) : rows, hasMore };
}

/**
 * A single published report by date -- same P-6 gate as the page above,
 * applied per-item so a direct /archive/[date] link can never expose a
 * held/rejected report either.
 */
export async function getPublishedReportByDate(date: string): Promise<DailyReport | null> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { data, error } = await supabaseAdmin
    .from("daily_reports")
    .select("*")
    .eq("date", date)
    .in("review_status", ["auto_published", "manually_approved"])
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch report for ${date}: ${error.message}`);
  }

  return (data as DailyReport) || null;
}

/**
 * The individual articles rendered into a given report, via the
 * migration-009 join table -- only populated for reports generated
 * after Sprint 10 shipped. A report from before that (including the
 * ~50 historical reports kept as records) legitimately returns an empty
 * array here; callers must fall back to the report's own `markdown`
 * field for those, not treat an empty array as an error.
 */
export async function getArticlesForReport(reportId: string): Promise<Article[]> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { data, error } = await supabaseAdmin
    .from("daily_report_articles")
    .select("article:articles(*)")
    .eq("report_id", reportId);

  if (error) {
    throw new Error(`Failed to fetch articles for report ${reportId}: ${error.message}`);
  }

  return ((data ?? []) as unknown as Array<{ article: Article }>).map((row) => row.article);
}
