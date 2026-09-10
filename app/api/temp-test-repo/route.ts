import { NextResponse } from "next/server";
import {
  insertCalibrationRun,
  updateCalibrationRun,
  getReportsNotYetJudged,
  insertFinding,
  getAllFindings,
  insertSuggestion,
  getPendingSuggestions,
  updateSuggestionStatus,
  getLatestCalibrationRun,
  getCalibrationRunHistory,
} from "@/features/hold-gate-calibration/repository";
import { supabaseAdmin } from "@/lib/db/client";

export async function GET() {
  const results: Record<string, unknown> = {};
  try {
    const run = await insertCalibrationRun("manual");
    results.insertedRun = run;

    const reports = await getReportsNotYetJudged();
    results.reportsNotYetJudgedCount = reports.length;
    results.firstReportDate = reports[0]?.date ?? null;

    if (reports[0]) {
      const finding = await insertFinding({
        run_id: run.id,
        report_id: reports[0].id,
        report_date: reports[0].date,
        hold_reason: "temp-test-word",
        verdict: "uncertain",
        ai_reasoning: "temp test reasoning",
      });
      results.insertedFinding = finding;
    }

    const allFindings = await getAllFindings();
    results.allFindingsCount = allFindings.length;

    const suggestion = await insertSuggestion({
      run_id: run.id,
      suggestion_text: "temp test suggestion",
      rationale: "temp test rationale",
    });
    results.insertedSuggestion = suggestion;

    const pending = await getPendingSuggestions();
    results.pendingCount = pending.length;

    await updateSuggestionStatus(suggestion.id, "dismissed", "temp-test-user-id");
    results.suggestionDismissed = true;

    await updateCalibrationRun(run.id, {
      status: "completed",
      reports_analyzed_count: reports.length,
      summary_markdown: "temp test summary",
      completed_at: new Date().toISOString(),
    });

    const latest = await getLatestCalibrationRun();
    results.latestRunStatus = latest?.status;

    const history = await getCalibrationRunHistory();
    results.historyCount = history.length;

    // Cleanup: delete the test run, cascades to finding + suggestion
    if (supabaseAdmin) {
      await supabaseAdmin.from("hold_gate_calibration_runs").delete().eq("id", run.id);
    }
    results.cleanedUp = true;

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err), results },
      { status: 500 },
    );
  }
}
