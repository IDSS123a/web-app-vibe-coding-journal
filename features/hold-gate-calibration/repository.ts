import { supabaseAdmin } from "@/lib/db/client";
import type {
  DailyReport,
  HoldGateCalibrationRun,
  HoldGateCalibrationFinding,
  HoldGateCalibrationSuggestion,
} from "@/lib/validation/schemas";

/**
 * Insert a new calibration run row, status 'running'.
 */
export async function insertCalibrationRun(
  triggeredBy: "manual" | "scheduled",
): Promise<HoldGateCalibrationRun> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { data, error } = await supabaseAdmin
    .from("hold_gate_calibration_runs")
    .insert({ triggered_by: triggeredBy, status: "running" })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to insert calibration run: ${error.message}`);
  }

  return data as HoldGateCalibrationRun;
}

/**
 * Update a calibration run's status/summary/error on completion or
 * failure. A run that fails partway must land here with status 'failed'
 * and a real error_message -- never left stuck at 'running' forever
 * with no signal on the admin page (E-5).
 */
export async function updateCalibrationRun(
  runId: string,
  updates: Partial<
    Pick<
      HoldGateCalibrationRun,
      "status" | "reports_analyzed_count" | "summary_markdown" | "error_message" | "completed_at"
    >
  >,
): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { error } = await supabaseAdmin
    .from("hold_gate_calibration_runs")
    .update(updates)
    .eq("id", runId);

  if (error) {
    throw new Error(`Failed to update calibration run: ${error.message}`);
  }
}

/**
 * Get every daily_reports row (any review_status, per SPEC.md's
 * requirement to cover both held and published history) that has NOT
 * already been covered by a hold_gate_calibration_findings row from a
 * prior run -- the free-only, never-re-judge constraint (PLAN.md,
 * resolved 2026-09-11). Two queries rather than a raw SQL subquery,
 * matching this project's established repository style (no raw SQL in
 * repository functions).
 *
 * Selects only id/date/markdown -- the fields detectHypeWordsInReport
 * actually needs, not `*`. Found live 2026-09-11: fetching every column
 * (including full markdown) across all 54 reports in one query risked a
 * large-payload truncation on the old pre-fix bloated reports (up to
 * ~745KB of markdown each, features/pipeline/repository.ts's
 * getArticlesForDailyReport bug, fixed the same day) -- a real run
 * missed a genuine "revolutionary" occurrence deep in one such report's
 * markdown, only caught on a second run. The free-only design is
 * self-correcting across runs regardless (a missed report just stays
 * "not yet judged" and gets retried), but narrowing the select reduces
 * how often that has to happen.
 */
export async function getReportsNotYetJudged(): Promise<
  Array<Pick<DailyReport, "id" | "date" | "markdown">>
> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { data: coveredRows, error: coveredError } = await supabaseAdmin
    .from("hold_gate_calibration_findings")
    .select("report_id")
    .not("report_id", "is", null);

  if (coveredError) {
    throw new Error(`Failed to fetch already-judged report ids: ${coveredError.message}`);
  }

  const coveredIds = [...new Set((coveredRows ?? []).map((r) => r.report_id as string))];

  let query = supabaseAdmin
    .from("daily_reports")
    .select("id, date, markdown")
    .order("date", { ascending: true });
  if (coveredIds.length > 0) {
    query = query.not("id", "in", `(${coveredIds.join(",")})`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch reports not yet judged: ${error.message}`);
  }

  return data as Array<Pick<DailyReport, "id" | "date" | "markdown">>;
}

/**
 * Insert one finding row -- one hype-word/hold-reason occurrence judged
 * against a specific report.
 */
export async function insertFinding(
  finding: Omit<HoldGateCalibrationFinding, "id" | "created_at">,
): Promise<HoldGateCalibrationFinding> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { data, error } = await supabaseAdmin
    .from("hold_gate_calibration_findings")
    .insert(finding)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to insert calibration finding: ${error.message}`);
  }

  return data as HoldGateCalibrationFinding;
}

/**
 * Every finding ever recorded, across every run -- the domain layer
 * aggregates from the full accumulated evidence, not just the current
 * run's new findings (PLAN.md: the free-only constraint limits new AI
 * calls, not the evidence base a suggestion draws from).
 */
export async function getAllFindings(): Promise<HoldGateCalibrationFinding[]> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { data, error } = await supabaseAdmin
    .from("hold_gate_calibration_findings")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch calibration findings: ${error.message}`);
  }

  return data as HoldGateCalibrationFinding[];
}

/**
 * Insert one candidate-change suggestion, status 'pending' by default.
 */
export async function insertSuggestion(
  suggestion: Pick<HoldGateCalibrationSuggestion, "run_id" | "suggestion_text" | "rationale">,
): Promise<HoldGateCalibrationSuggestion> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { data, error } = await supabaseAdmin
    .from("hold_gate_calibration_suggestions")
    .insert(suggestion)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to insert calibration suggestion: ${error.message}`);
  }

  return data as HoldGateCalibrationSuggestion;
}

/**
 * Apply or dismiss a suggestion -- the only way a suggestion's status
 * ever changes is this explicit Director action (SPEC.md acceptance
 * criterion: the system never applies a change on its own authority).
 */
export async function updateSuggestionStatus(
  suggestionId: string,
  status: "applied" | "dismissed",
  appliedBy: string,
): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { error } = await supabaseAdmin
    .from("hold_gate_calibration_suggestions")
    .update({
      status,
      applied_by: appliedBy,
      applied_at: new Date().toISOString(),
    })
    .eq("id", suggestionId);

  if (error) {
    throw new Error(`Failed to update calibration suggestion: ${error.message}`);
  }
}

/**
 * The most recent run, for the admin page's headline summary.
 */
export async function getLatestCalibrationRun(): Promise<HoldGateCalibrationRun | null> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { data, error } = await supabaseAdmin
    .from("hold_gate_calibration_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch latest calibration run: ${error.message}`);
  }

  return (data as HoldGateCalibrationRun) || null;
}

/**
 * Run history, for the admin page's past-runs list.
 */
export async function getCalibrationRunHistory(): Promise<HoldGateCalibrationRun[]> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { data, error } = await supabaseAdmin
    .from("hold_gate_calibration_runs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch calibration run history: ${error.message}`);
  }

  return data as HoldGateCalibrationRun[];
}

/**
 * Every 'pending' suggestion across all runs, for the admin page's
 * actionable list (suggestions from prior runs stay actionable until
 * explicitly applied or dismissed, not just the latest run's).
 */
export async function getPendingSuggestions(): Promise<HoldGateCalibrationSuggestion[]> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { data, error } = await supabaseAdmin
    .from("hold_gate_calibration_suggestions")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch pending calibration suggestions: ${error.message}`);
  }

  return data as HoldGateCalibrationSuggestion[];
}
