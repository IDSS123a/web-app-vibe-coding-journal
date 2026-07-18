import { supabase } from "@/lib/db/client";
import type { DailyReport } from "@/lib/validation/schemas";

export async function getDailyReportByDate(date: string): Promise<DailyReport | null> {
  const { data, error } = await supabase
    .from("daily_reports")
    .select("*")
    .eq("date", date)
    .single();

  if (error || !data) {
    return null;
  }

  return data as DailyReport;
}

export async function getLatestDailyReport(): Promise<DailyReport | null> {
  const { data, error } = await supabase
    .from("daily_reports")
    .select("*")
    .order("date", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return data as DailyReport;
}
