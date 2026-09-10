/**
 * Hold-gate calibration learning — pure domain logic (A-1: no I/O, no
 * AI calls here; those live in repository.ts / the AIProvider interface
 * respectively).
 */

import { HYPE_WORDS } from "@/features/pipeline/quality-engine";
import type { DailyReport, HoldGateCalibrationFinding } from "@/lib/validation/schemas";

/** How much surrounding text to include as AI-judgment context. */
const EXCERPT_RADIUS_CHARS = 150;

/**
 * A hold reason needs at least this many judged occurrences before its
 * false-positive rate is considered meaningful enough to suggest a
 * change — avoids overreacting to a single judged case.
 */
export const MIN_OCCURRENCES_FOR_SUGGESTION = 2;

/**
 * A hold reason whose false-positive rate meets or exceeds this is
 * flagged as a candidate for removal/adjustment.
 */
export const FALSE_POSITIVE_RATE_THRESHOLD = 0.5;

export interface DetectedHypeWord {
  reportId: string;
  reportDate: string;
  hypeWord: string;
  excerpt: string;
}

/**
 * The pipeline's own `containsHypeWords()` (features/pipeline/quality-
 * engine.ts) only returns a boolean — "does this text contain any hype
 * word" — which is enough to decide whether to hold a report, but not
 * enough to ever suggest "remove word X specifically." This recovers
 * that granularity by re-scanning a report's full markdown (already
 * stored on the `daily_reports` row) against the same `HYPE_WORDS` list
 * (imported, not duplicated — M-7), returning every specific word that
 * actually matched plus surrounding context for the AI judgment call.
 *
 * Deliberately scans against the CURRENT `HYPE_WORDS` list, not
 * whatever list existed when the report was originally generated — if
 * the list has already changed since, this reflects calibration against
 * today's rules, which is the point of re-examining history.
 */
export function detectHypeWordsInReport(
  report: Pick<DailyReport, "id" | "date" | "markdown">,
): DetectedHypeWord[] {
  const lowerMarkdown = report.markdown.toLowerCase();
  const detected: DetectedHypeWord[] = [];

  for (const word of HYPE_WORDS) {
    const index = lowerMarkdown.indexOf(word.toLowerCase());
    if (index === -1) continue;

    const start = Math.max(0, index - EXCERPT_RADIUS_CHARS);
    const end = Math.min(report.markdown.length, index + word.length + EXCERPT_RADIUS_CHARS);
    const excerpt = report.markdown.slice(start, end).trim();

    detected.push({
      reportId: report.id,
      reportDate: report.date,
      hypeWord: word,
      excerpt,
    });
  }

  return detected;
}

export interface HoldReasonStats {
  holdReason: string;
  totalOccurrences: number;
  genuineHypeCount: number;
  falsePositiveCount: number;
  uncertainCount: number;
  falsePositiveRate: number;
}

/**
 * Group every finding to date (across all runs, not just the current
 * one — PLAN.md: the free-only constraint limits new AI calls, not the
 * evidence base a suggestion draws from) by hold reason, computing the
 * false-positive rate for each.
 */
export function groupFindingsByHoldReason(
  findings: HoldGateCalibrationFinding[],
): HoldReasonStats[] {
  const byReason = new Map<string, HoldGateCalibrationFinding[]>();
  for (const finding of findings) {
    const list = byReason.get(finding.hold_reason) ?? [];
    list.push(finding);
    byReason.set(finding.hold_reason, list);
  }

  const stats: HoldReasonStats[] = [];
  for (const [holdReason, group] of byReason) {
    const genuineHypeCount = group.filter((f) => f.verdict === "genuine_hype").length;
    const falsePositiveCount = group.filter((f) => f.verdict === "false_positive").length;
    const uncertainCount = group.filter((f) => f.verdict === "uncertain").length;
    const totalOccurrences = group.length;

    stats.push({
      holdReason,
      totalOccurrences,
      genuineHypeCount,
      falsePositiveCount,
      uncertainCount,
      falsePositiveRate: totalOccurrences > 0 ? falsePositiveCount / totalOccurrences : 0,
    });
  }

  return stats.sort((a, b) => b.falsePositiveRate - a.falsePositiveRate);
}

export interface SuggestionDraft {
  suggestionText: string;
  rationale: string;
}

/**
 * Derive candidate changes from aggregated evidence. Deliberately
 * conservative: a hold reason needs both enough occurrences
 * (MIN_OCCURRENCES_FOR_SUGGESTION) and a high enough false-positive
 * rate (FALSE_POSITIVE_RATE_THRESHOLD) before it's surfaced — a single
 * "uncertain" or "false_positive" verdict never triggers a suggestion
 * on its own. This never applies anything itself (SPEC.md); it only
 * drafts what a Director could choose to apply.
 */
export function deriveSuggestions(stats: HoldReasonStats[]): SuggestionDraft[] {
  const drafts: SuggestionDraft[] = [];

  for (const stat of stats) {
    if (stat.totalOccurrences < MIN_OCCURRENCES_FOR_SUGGESTION) continue;
    if (stat.falsePositiveRate < FALSE_POSITIVE_RATE_THRESHOLD) continue;

    drafts.push({
      suggestionText: `Consider removing "${stat.holdReason}" from the P-3 hype-word list`,
      rationale: `Judged ${stat.totalOccurrences} time(s) across report history: ${stat.falsePositiveCount} false positive(s), ${stat.genuineHypeCount} genuine hype, ${stat.uncertainCount} uncertain — ${Math.round(stat.falsePositiveRate * 100)}% false-positive rate.`,
    });
  }

  return drafts;
}

/**
 * Human-readable rollup for the run's `summary_markdown` column — what
 * the admin page actually displays for a completed run.
 */
export function buildSummaryMarkdown(stats: HoldReasonStats[], reportsAnalyzedCount: number): string {
  if (stats.length === 0) {
    return `Analyzed ${reportsAnalyzedCount} report(s); no hold-reason occurrences found to judge.`;
  }

  const lines = [`Analyzed ${reportsAnalyzedCount} new report(s) this run.`, ""];
  for (const stat of stats) {
    lines.push(
      `- **${stat.holdReason}**: ${stat.totalOccurrences} occurrence(s) — ` +
        `${stat.genuineHypeCount} genuine, ${stat.falsePositiveCount} false positive, ` +
        `${stat.uncertainCount} uncertain (${Math.round(stat.falsePositiveRate * 100)}% false-positive rate)`,
    );
  }

  return lines.join("\n");
}
