import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/client";

export async function GET() {
  if (!supabaseAdmin) return NextResponse.json({ error: "no admin client" }, { status: 500 });
  const today = new Date().toISOString().split("T")[0]!;
  const { data, error } = await supabaseAdmin
    .from("daily_reports")
    .select("date, review_status, article_count, reading_time_minutes, updated_at, markdown")
    .eq("date", today)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    ...data,
    markdown_length: data?.markdown?.length ?? 0,
    markdown_preview: data?.markdown?.slice(0, 300) ?? null,
    markdown: undefined,
  });
}
