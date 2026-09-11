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

const REPORTS_PAGE_SIZE = 5;

/**
 * Get every daily_reports row (any review_status, per SPEC.md's
 * requirement to cover both held and published history) that has NOT
 * already been SCANNED by a prior run -- the free-only, never-re-judge
 * constraint (PLAN.md, resolved 2026-09-11). Two queries rather than a
 * raw SQL subquery, matching this project's established repository
 * style (no raw SQL in repository functions).
 *
 * Excludes based on `hold_gate_calibration_scanned_reports` (migration
 * 008), NOT on which reports happen to already have a
 * `hold_gate_calibration_findings` row. A real, confirmed bug found live
 * 2026-09-11: excluding by "has a finding" meant a report containing
 * zero hype words NEVER got excluded (it can never produce a finding),
 * so the "not yet judged" set only grew for the product's entire
 * lifetime -- confirmed live, a no-op run (zero new findings) already
 * took 23-28 seconds re-scanning 33 accumulated zero-hype-word reports
 * on every single call. Migration 008's dedicated scan-tracking table
 * records that a report was checked independent of whether checking it
 * found anything, which is what actually bounds this set going forward
 * (only genuinely new reports since the product's last scan, not an
 * ever-growing backlog of reports that will never produce a finding).
 *
 * Selects only id/date/markdown -- the fields detectHypeWordsInReport
 * actually needs, not `*` -- AND paginates in small pages via `.range()`
 * rather than one unbounded query. Found live 2026-09-11: a single query
 * across all 54 reports (several of them old pre-fix bloated rows, up to
 * ~745KB of markdown each -- features/pipeline/repository.ts's
 * getArticlesForDailyReport bug, fixed the same day) intermittently
 * returned an incomplete result set -- real runs repeatedly missed
 * genuine "revolutionary" occurrences that only surfaced on later runs.
 * Narrowing the `select` alone reduced but did not eliminate this
 * (confirmed live across three real runs); paginating closes it properly
 * rather than relying on the free-only design's self-correction (which
 * does work, but shouldn't be the primary defense against a payload-size
 * issue that pagination avoids outright).
 */
export async function getReportsNotYetJudged(): Promise<
  Array<Pick<DailyReport, "id" | "date" | "markdown">>
> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { data: scannedRows, error: scannedError } = await supabaseAdmin
    .from("hold_gate_calibration_scanned_reports")
    .select("report_id");

  if (scannedError) {
    throw new Error(`Failed to fetch already-scanned report ids: ${scannedError.message}`);
  }

  const scannedIds = [...new Set((scannedRows ?? []).map((r) => r.report_id as string))];

  const allReports: Array<Pick<DailyReport, "id" | "date" | "markdown">> = [];
  let from = 0;

  while (true) {
    let query = supabaseAdmin
      .from("daily_reports")
      .select("id, date, markdown")
      .order("date", { ascending: true })
      .range(from, from + REPORTS_PAGE_SIZE - 1);
    if (scannedIds.length > 0) {
      query = query.not("id", "in", `(${scannedIds.join(",")})`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch reports not yet judged: ${error.message}`);
    }

    const page = (data ?? []) as Array<Pick<DailyReport, "id" | "date" | "markdown">>;
    allReports.push(...page);

    if (page.length < REPORTS_PAGE_SIZE) break;
    from += REPORTS_PAGE_SIZE;
  }

  return allReports;
}

/**
 * Record that these reports have been scanned -- independent of whether
 * scanning them found any hype word -- so `getReportsNotYetJudged`
 * excludes them from every future run regardless (migration 008; see
 * that function's doc comment for the bug this fixes). Call this for
 * EVERY report a run actually scanned, not just ones that produced a
 * finding.
 */
export async function markReportsAsScanned(reportIds: string[]): Promise<void> {
  if (reportIds.length === 0) return;
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { error } = await supabaseAdmin
    .from("hold_gate_calibration_scanned_reports")
    .upsert(reportIds.map((id) => ({ report_id: id })));

  if (error) {
    throw new Error(`Failed to mark reports as scanned: ${error.message}`);
  }
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
 * Prefer `upsertSuggestion` below for anything driven by a fresh
 * `deriveSuggestions()` run -- this raw insert is what caused a real bug
 * (5 duplicate "revolutionary" suggestions accumulated, one per run,
 * found live 2026-09-11) when called unconditionally every run.
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
 * Insert a suggestion only if one for this exact suggestion_text doesn't
 * already exist; otherwise refresh the existing PENDING one's rationale
 * with the latest evidence (a `pending` suggestion is expected to stay
 * current as more history is judged), or leave an already-`applied`/
 * `dismissed` one alone entirely (that decision is closed -- a new run
 * re-deriving the same draft must not resurrect it, per SPEC.md's "the
 * system never applies a change on its own authority" -- silently
 * un-dismissing counts as that).
 *
 * `deriveSuggestions()` (features/hold-gate-calibration/domain.ts)
 * builds `suggestion_text` deterministically from the hold reason alone
 * (no randomness, no run-specific wording), so an exact-string match is
 * a reliable identity key without needing a separate column/migration.
 */
export async function upsertSuggestion(
  suggestion: Pick<HoldGateCalibrationSuggestion, "run_id" | "suggestion_text" | "rationale">,
): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("hold_gate_calibration_suggestions")
    .select("id, status")
    .eq("suggestion_text", suggestion.suggestion_text)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Failed to check for existing suggestion: ${existingError.message}`);
  }

  if (!existing) {
    await insertSuggestion(suggestion);
    return;
  }

  if (existing.status !== "pending") {
    // Already applied or dismissed -- a closed Director decision, never
    // silently resurrected by fresh evidence alone.
    return;
  }

  const { error: updateError } = await supabaseAdmin
    .from("hold_gate_calibration_suggestions")
    .update({ rationale: suggestion.rationale, run_id: suggestion.run_id })
    .eq("id", existing.id);

  if (updateError) {
    throw new Error(`Failed to refresh existing suggestion: ${updateError.message}`);
  }
}

/**
 * Thrown by updateSuggestionStatus when no row matched suggestionId.
 * Found live 2026-09-11 (browser test against a real admin session,
 * deliberately-bogus UUID): Supabase's `.update().eq(...)` does not
 * error on zero matching rows, and the route was trusting a bare
 * `{success:true}` as proof the update actually happened -- a PATCH on
 * a nonexistent suggestion silently returned 200 instead of 404.
 */
export class SuggestionNotFoundError extends Error {
  constructor(suggestionId: string) {
    super(`No calibration suggestion found with id ${suggestionId}`);
    this.name = "SuggestionNotFoundError";
  }
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

  // .select().maybeSingle() (not a bare .update()) so an update matching
  // zero rows is actually distinguishable from one that succeeded --
  // Supabase does not error on zero-row matches either way.
  const { data, error } = await supabaseAdmin
    .from("hold_gate_calibration_suggestions")
    .update({
      status,
      applied_by: appliedBy,
      applied_at: new Date().toISOString(),
    })
    .eq("id", suggestionId)
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to update calibration suggestion: ${error.message}`);
  }
  if (!data) {
    throw new SuggestionNotFoundError(suggestionId);
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
