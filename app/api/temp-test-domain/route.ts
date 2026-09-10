import { NextResponse } from "next/server";
import {
  detectHypeWordsInReport,
  groupFindingsByHoldReason,
  deriveSuggestions,
  buildSummaryMarkdown,
} from "@/features/hold-gate-calibration/domain";
import type { HoldGateCalibrationFinding } from "@/lib/validation/schemas";
import { supabaseAdmin } from "@/lib/db/client";

export async function GET() {
  if (!supabaseAdmin) return NextResponse.json({ error: "no admin client" }, { status: 500 });

  // Test detectHypeWordsInReport against real report markdown
  const { data: reports } = await supabaseAdmin
    .from("daily_reports")
    .select("id, date, markdown")
    .order("date", { ascending: false })
    .limit(5);

  const detections = (reports ?? []).flatMap((r) => detectHypeWordsInReport(r));

  // Test groupFindingsByHoldReason / deriveSuggestions / buildSummaryMarkdown
  // with synthetic findings covering multiple scenarios
  const now = new Date().toISOString();
  const syntheticFindings: HoldGateCalibrationFinding[] = [
    { id: "1", run_id: "r1", report_id: "a", report_date: "2026-01-01", hold_reason: "revolutionary", verdict: "false_positive", ai_reasoning: "x", created_at: now },
    { id: "2", run_id: "r1", report_id: "b", report_date: "2026-01-02", hold_reason: "revolutionary", verdict: "false_positive", ai_reasoning: "x", created_at: now },
    { id: "3", run_id: "r1", report_id: "c", report_date: "2026-01-03", hold_reason: "revolutionary", verdict: "genuine_hype", ai_reasoning: "x", created_at: now },
    { id: "4", run_id: "r1", report_id: "d", report_date: "2026-01-04", hold_reason: "groundbreaking", verdict: "genuine_hype", ai_reasoning: "x", created_at: now },
    { id: "5", run_id: "r1", report_id: "e", report_date: "2026-01-05", hold_reason: "groundbreaking", verdict: "genuine_hype", ai_reasoning: "x", created_at: now },
    { id: "6", run_id: "r1", report_id: "f", report_date: "2026-01-06", hold_reason: "disrupts", verdict: "uncertain", ai_reasoning: "x", created_at: now },
  ];

  const stats = groupFindingsByHoldReason(syntheticFindings);
  const suggestions = deriveSuggestions(stats);
  const summary = buildSummaryMarkdown(stats, 42);

  return NextResponse.json({
    ok: true,
    reportsChecked: reports?.length ?? 0,
    detectionsFound: detections.length,
    sampleDetections: detections.slice(0, 3),
    stats,
    suggestions,
    summary,
  });
}
