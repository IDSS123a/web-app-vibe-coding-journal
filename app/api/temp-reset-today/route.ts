import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/client";

export async function POST() {
  if (!supabaseAdmin) return NextResponse.json({ error: "no admin client" }, { status: 500 });
  const today = new Date().toISOString().split("T")[0]!;
  const { error, count } = await supabaseAdmin
    .from("daily_reports")
    .delete({ count: "exact" })
    .eq("date", today);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: count, date: today });
}
