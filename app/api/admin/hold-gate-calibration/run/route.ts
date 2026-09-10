/**
 * POST /api/admin/hold-gate-calibration/run
 * Role required: admin (on-demand) OR valid CRON_SECRET (scheduled,
 * same shared-secret pattern as /api/cron/daily-digest)
 * Body: none required
 * Response: { success: true, runId: string, reportsAnalyzed: number }
 * Errors: 401 (neither admin session nor CRON_SECRET valid),
 *         409 (a run is already in progress -- concurrent runs are
 *         rejected rather than allowed to race over the same report
 *         coverage),
 *         500 (analysis failed -- recorded on the run row itself via
 *         status: 'failed' + error_message, not just thrown, so the
 *         admin page shows *why* the last run failed)
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/auth/verify-token";
import { ensureAIProviderInitialized } from "@/lib/ai/init";
import { getAIProvider } from "@/lib/ai/ai-provider";
import { judgeHoldReasonOutputSchema } from "@/lib/validation/schemas";
import {
  insertCalibrationRun,
  updateCalibrationRun,
  getReportsNotYetJudged,
  insertFinding,
  getAllFindings,
  insertSuggestion,
  getLatestCalibrationRun,
} from "@/features/hold-gate-calibration/repository";
import {
  detectHypeWordsInReport,
  groupFindingsByHoldReason,
  deriveSuggestions,
  buildSummaryMarkdown,
} from "@/features/hold-gate-calibration/domain";
import { supabaseAdmin } from "@/lib/db/client";

const CRON_SECRET = process.env.CRON_SECRET || "dev-secret-change-in-production";

function validateCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;
  const [scheme, token] = authHeader.split(" ");
  return scheme === "Bearer" && token === CRON_SECRET;
}

export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATE -- CRON_SECRET first (scheduled path), admin
    // session as fallback (on-demand path). Either succeeding
    // authenticates the request.
    const isCronRequest = validateCronAuth(request);
    let triggeredBy: "manual" | "scheduled";

    if (isCronRequest) {
      triggeredBy = "scheduled";
    } else {
      // 2. AUTHORIZE (admin-token path: role check happens inside verifyAdminToken)
      const verified = await verifyAdminToken(request.headers.get("authorization"));
      if (!verified) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      triggeredBy = "manual";
    }

    // 3. VALIDATE -- no meaningful request body for this endpoint.

    // 4. EXECUTE
    if (!supabaseAdmin) {
      throw new Error("Admin client not available");
    }

    // Reject a concurrent run rather than racing over the same report
    // coverage (TASKS.md: resolved during implementation, not left
    // undefined).
    const latest = await getLatestCalibrationRun();
    if (latest?.status === "running") {
      return NextResponse.json(
        { error: "A calibration run is already in progress", runId: latest.id },
        { status: 409 },
      );
    }

    const run = await insertCalibrationRun(triggeredBy);

    try {
      const reports = await getReportsNotYetJudged();

      // Free-only constraint (PLAN.md, resolved 2026-09-11): only
      // genuinely new content is ever sent to the AI provider. A run
      // with nothing new makes zero AI calls -- a normal outcome, not
      // an error.
      if (reports.length > 0) {
        ensureAIProviderInitialized();
        const aiProvider = getAIProvider();

        for (const report of reports) {
          const detections = detectHypeWordsInReport(report);

          for (const detection of detections) {
            let judgment;
            try {
              const raw = await aiProvider.judgeHoldReason({
                reportExcerpt: detection.excerpt,
                holdReason: detection.hypeWord,
              });
              const parsed = judgeHoldReasonOutputSchema.safeParse(raw);
              if (!parsed.success) {
                // E-5/AUDIT-003: a successful call is not a successful
                // result -- log and count, never silently drop.
                console.error(
                  `[HOLD_GATE_CALIBRATION] Unparseable AI judgment for "${detection.hypeWord}" in report ${detection.reportId}: ${parsed.error.message}`,
                );
                continue;
              }
              judgment = parsed.data;
            } catch (err) {
              console.error(
                `[HOLD_GATE_CALIBRATION] AI judgment call failed for "${detection.hypeWord}" in report ${detection.reportId}: ${err instanceof Error ? err.message : String(err)}`,
              );
              continue;
            }

            await insertFinding({
              run_id: run.id,
              report_id: detection.reportId,
              report_date: detection.reportDate,
              hold_reason: detection.hypeWord,
              verdict: judgment.verdict,
              ai_reasoning: judgment.reasoning,
            });
          }
        }
      }

      // Domain aggregation over ALL findings to date, not just this
      // run's new ones (PLAN.md: the free-only constraint limits new AI
      // calls, not the evidence base a suggestion draws from).
      const allFindings = await getAllFindings();
      const stats = groupFindingsByHoldReason(allFindings);
      const suggestionDrafts = deriveSuggestions(stats);

      for (const draft of suggestionDrafts) {
        await insertSuggestion({
          run_id: run.id,
          suggestion_text: draft.suggestionText,
          rationale: draft.rationale,
        });
      }

      const summaryMarkdown = buildSummaryMarkdown(stats, reports.length);

      await updateCalibrationRun(run.id, {
        status: "completed",
        reports_analyzed_count: reports.length,
        summary_markdown: summaryMarkdown,
        completed_at: new Date().toISOString(),
      });

      // 5. RETURN
      return NextResponse.json({
        success: true,
        runId: run.id,
        reportsAnalyzed: reports.length,
      });
    } catch (executeError) {
      // A run that fails partway must land here with status: 'failed'
      // and a real error_message -- never left stuck at 'running'
      // forever with no signal on the admin page (E-5).
      const message = executeError instanceof Error ? executeError.message : String(executeError);
      await updateCalibrationRun(run.id, {
        status: "failed",
        error_message: message,
        completed_at: new Date().toISOString(),
      });
      throw executeError;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[HOLD_GATE_CALIBRATION] Run failed: ${message}`);
    return NextResponse.json({ error: "Calibration run failed", detail: message }, { status: 500 });
  }
}
