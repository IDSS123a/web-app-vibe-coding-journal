/**
 * Source Collector domain logic — RSS/API feed management
 * P-7: Source Health Monitoring (reachability, staleness, auto-disable on failures)
 */

import { z } from "zod";

export type SourceType = "rss" | "api";

/**
 * Source Directory & Trust Score (Phase 1,
 * specs/vibe-coding-intelligence-engine/ROADMAP.md) — six categories
 * from that document's mandate, kept as single letters rather than a
 * lookup table (only ever six values, no metadata of their own needed):
 *   A = Primary/official (vendor blogs, official docs)
 *   B = Research/academic
 *   C = Independent technical analysis (curated community: HN, Lobsters)
 *   D = Security/quality/reliability
 *   E = Developer reality/empirical evidence (Reddit, surveys, telemetry)
 *   F = Serious industry/business press
 */
export type SourceClass = "A" | "B" | "C" | "D" | "E" | "F";
export const SOURCE_CLASSES: readonly SourceClass[] = ["A", "B", "C", "D", "E", "F"] as const;

export interface Source {
  id: string;
  name: string;
  url: string;
  type: SourceType;
  enabled: boolean;
  last_polled: string | null;
  last_success: string | null;
  failure_count: number;
  // Nullable: migration 010 added these to an existing table without
  // backfilling every conceivable future row by default -- a source
  // created before this classification work, or through a future flow
  // that doesn't set them, legitimately has none yet.
  source_class: SourceClass | null;
  trust_score: number | null;
  topics: string[];
  created_at: string;
  updated_at: string;
}

export const sourceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  url: z.string().url(),
  type: z.enum(["rss", "api"] as const),
  enabled: z.boolean(),
  last_polled: z.string().datetime().nullable(),
  last_success: z.string().datetime().nullable(),
  failure_count: z.number().int().min(0),
  source_class: z.enum(SOURCE_CLASSES as [SourceClass, ...SourceClass[]]).nullable(),
  trust_score: z.number().int().min(0).max(100).nullable(),
  topics: z.array(z.string()),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const createSourceSchema = z.object({
  name: z.string().min(1).max(255),
  url: z.string().url(),
  type: z.enum(["rss", "api"] as const),
  // Optional at creation (existing rows predate this, and not every
  // caller is expected to have judged a trust score yet) -- but per
  // ROADMAP.md's "every source must earn its place," a new source
  // SHOULD get these filled in as part of actually adding it, not left
  // null indefinitely.
  source_class: z.enum(SOURCE_CLASSES as [SourceClass, ...SourceClass[]]).optional(),
  trust_score: z.number().int().min(0).max(100).optional(),
  topics: z.array(z.string()).optional(),
});

export type CreateSourceInput = z.infer<typeof createSourceSchema>;

/**
 * P-7: Source Health Monitoring
 * - Reachability: HTTP HEAD check before full fetch
 * - Staleness: Compare last_polled vs. expected cadence
 * - Auto-disable: On 3× consecutive failures
 */

export const SOURCE_HEALTH_CONFIG = {
  MAX_FAILURES: 3, // Auto-disable after 3 consecutive failures
  EXPECTED_CADENCE_HOURS: 24, // Warn if last_polled > 24 hours ago
  // Used TWICE per source now (checkSourceReachability's HEAD check, and
  // -- since 2026-09-13 -- parseFeed's actual GET, see
  // features/sources/actions.ts) plus a 1.5s inter-source delay
  // (INTER_SOURCE_DELAY_MS, same file). With 14 sources as of this
  // date, the worst case (every source timing out on both checks) is
  // 14 * (2*HTTP_TIMEOUT_MS + 1.5s) -- at the previous 10s this was
  // ~301s, uncomfortably at/over Vercel's function duration budget for
  // a single cron invocation. Lowered to keep that worst case
  // comfortably under it (14 * 11.5s = 161s) -- 5s is still generous
  // for a real feed host; the sources actually configured today all
  // respond in well under 1s in normal operation.
  HTTP_TIMEOUT_MS: 5000,
};

export interface SourceHealthStatus {
  sourceId: string;
  reachable: boolean;
  stale: boolean;
  failureCount: number;
  shouldAutoDisable: boolean; // true if failureCount >= MAX_FAILURES
  lastError?: string;
}

/**
 * Check if source should be auto-disabled
 * (P-7: fail loudly, not silently)
 */
export function shouldAutoDisableSource(failureCount: number): boolean {
  return failureCount >= SOURCE_HEALTH_CONFIG.MAX_FAILURES;
}

/**
 * Check if source data is stale
 * @param lastPolled ISO timestamp or null
 * @returns true if not polled in last 24 hours (or never polled)
 */
export function isSourceStale(lastPolled: string | null): boolean {
  if (!lastPolled) return true; // Never polled = stale

  const lastPollTime = new Date(lastPolled).getTime();
  const now = Date.now();
  const hoursAgo = (now - lastPollTime) / (1000 * 60 * 60);

  return hoursAgo > SOURCE_HEALTH_CONFIG.EXPECTED_CADENCE_HOURS;
}
