/**
 * Formatting of one Daily Report entry, shared by the daily pipeline
 * (app/api/cron/daily-digest/route.ts) and the Archive rebuild script
 * (scripts/rebuild-archive.ts) so a rebuilt historical report reads exactly like a live one.
 */
import type { Article } from "@/lib/validation/schemas";

/**
 * Phase 5 (specs/vibe-coding-intelligence-engine/ROADMAP.md, Daily/
 * Weekly Intelligence Format): restructures each digest entry into the
 * mandate's WHAT HAPPENED / WHY IT MATTERS / EVIDENCE / CONFIDENCE /
 * WHAT TO WATCH shape, replacing the original "simple aggregation for
 * MVP" markdown (which only ever rendered summary/Source/Category/Why
 * it matters -- who_it_affects and worth_trying were collected by
 * summarize() this whole time but never actually shown to a reader).
 * Every field here already existed except what_to_watch (migration
 * 012, folded into the existing summarize() call, no new AI cost).
 * `alsoCoveredBy` comes from getRelatedSourcesForArticles() (Phase 4,
 * Sprint 17) -- multi-source coverage is real corroborating evidence,
 * not just a UI nicety, so it belongs in the EVIDENCE line here too,
 * not only in the dashboard/archive components that already show it.
 */
export function formatDigestEntry(article: Article, alsoCoveredBy: string[]): string {
  const confidencePct =
    article.confidence_score != null ? `${Math.round(article.confidence_score * 100)}%` : "n/a";
  const relevance = article.relevance_score != null ? `${article.relevance_score}/100` : "n/a";
  const evidence = [
    `Reported by ${article.source || "Unknown"}`,
    alsoCoveredBy.length > 0 ? `also covered by ${alsoCoveredBy.join(", ")}` : null,
    `relevance ${relevance}`,
  ]
    .filter((part): part is string => part !== null)
    .join(", ");
  const worthTrying =
    article.worth_trying === "yes" ? "Yes" : article.worth_trying === "no" ? "No" : "Maybe";

  return `## ${article.title}

**What happened:** ${article.summary || article.raw_summary || "TBD"}

**Why it matters:** ${article.why_it_matters || "TBD"}${article.who_it_affects ? ` (${article.who_it_affects})` : ""}

**Evidence:** ${evidence}

**Confidence:** ${confidencePct}, **Worth trying:** ${worthTrying}

**What to watch:** ${article.what_to_watch || "n/a"}`;
}
