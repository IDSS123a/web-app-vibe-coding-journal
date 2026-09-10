import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/client";

export async function GET() {
  if (!supabaseAdmin) return NextResponse.json({ error: "no admin client" }, { status: 500 });

  const { data: sources, error: sourcesError } = await supabaseAdmin
    .from("sources")
    .select("*");
  if (sourcesError) return NextResponse.json({ error: sourcesError.message }, { status: 500 });

  const { data: reports, error: reportsError } = await supabaseAdmin
    .from("daily_reports")
    .select("date, review_status, article_count")
    .order("date", { ascending: false })
    .limit(10);
  if (reportsError) return NextResponse.json({ error: reportsError.message }, { status: 500 });

  const { count: heldCount } = await supabaseAdmin
    .from("daily_reports")
    .select("*", { count: "exact", head: true })
    .eq("review_status", "held_for_review");

  return NextResponse.json({ sources, reports, heldCount });
}
