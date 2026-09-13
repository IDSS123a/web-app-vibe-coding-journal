/**
 * Quality Engine domain logic
 * P-5: Confidence thresholds are decisions, not magic numbers
 * P-1.1: Low confidence → held_for_review, not silent drop
 */

import type { Article } from "@/lib/validation/schemas";

/**
 * PDL-004: Confidence Threshold for Auto-Publish
 * Decision: Start with 0.60 (60% confidence minimum for auto-publish)
 * Date: 2026-07-18 (Sprint 03)
 * Rationale:
 *   - Below 0.60: Too uncertain, risk of low-quality content
 *   - Above 0.80: Too strict, might hold too many valid articles
 *   - 0.60: Balances coverage vs. quality
 * Tuning: If review queue overflows, raise to 0.70. If missing good content, lower to 0.50.
 */
export const CONFIDENCE_THRESHOLD = 0.6;

/**
 * P-0 (🔴 CRITICAL) Relevance Threshold — minimum assessRelevance()
 * score (0-100) to be treated as on-topic for vibe-coding.
 * Decision: 60 (Phase 2, specs/vibe-coding-intelligence-engine/ROADMAP.md)
 * Date: 2026-09-13
 * Rationale:
 *   - The Director's own repeated, explicit framing is strict ("bilo
 *     koji tekst koji nije 100% usmjeren... strogo zabranjen") — this
 *     sets the cutoff at the boundary between the AI judge's own
 *     "tangentially related" (41-60) and "clearly relevant" (61-80)
 *     bands, so anything merely tangential is excluded, not just
 *     anything clearly off-topic.
 *   - Below 60: excluded (confidence_score forced to 0, same mechanism
 *     as before this score was graded — see app/api/cron/daily-digest/
 *     route.ts).
 *   - Not set higher (e.g. 80) because that would also exclude
 *     genuinely useful but narrowly-scoped coverage (e.g. a specific
 *     tool update the AI judge scores 65-75 for being real but not
 *     maximally central) — over-filtering has its own cost (P-1.1: a
 *     digest with nothing in it is also a failure).
 * Tuning: If off-topic content still slips through, raise. If clearly
 * relevant content is being excluded, lower — check relevance_score on
 * excluded articles first to see which direction the errors lean.
 */
export const RELEVANCE_THRESHOLD = 60;

/**
 * Hype-word list (P-3: Editorial Voice)
 * These words are banned unless directly quoting a named source
 */
export const HYPE_WORDS = [
  "revolutionary",
  "game changer",
  "groundbreaking",
  "unprecedented",
  "disrupts",
  "changes everything",
];

/**
 * Article quality scoring (0-1)
 * Heuristic-based MVP (production could add ML/embeddings)
 *
 * Factors:
 * - Source reliability: Known sources get higher baseline
 * - Content freshness: Newer > older
 * - Title quality: Length indicates effort
 * - Summary quality: Longer summaries indicate substantive content
 */
export function scoreArticleConfidence(article: Article): number {
  let score = 0.5; // Baseline

  // Factor 1: Source reliability (0.1 bonus for known good sources)
  if (article.source) {
    const goodSources = [
      "github",
      "hacker news",
      "twitter",
      "medium",
      "dev.to",
      "stack overflow",
    ];
    if (goodSources.some((source) => article.source.toLowerCase().includes(source))) {
      score += 0.1;
    }
  }

  // Factor 2: Freshness (articles within last 7 days get bonus)
  if (article.published_at) {
    const daysSincePublish =
      (Date.now() - new Date(article.published_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePublish < 7) {
      score += 0.1;
    }
  }

  // Factor 3: Title quality (longer titles indicate specificity)
  if (article.title && article.title.length > 20 && article.title.length < 200) {
    score += 0.1;
  }

  // Factor 4: Summary quality (substantive content)
  if (article.raw_summary && article.raw_summary.length > 50) {
    score += 0.1;
  }

  // Factor 5: Quality flag (certain types lower confidence)
  if (article.quality_flag) {
    if (article.quality_flag === "clickbait") score -= 0.2;
    if (article.quality_flag === "marketing") score -= 0.15;
    if (article.quality_flag === "rumor") score -= 0.2;
  }

  // Clamp to 0-1
  return Math.max(0, Math.min(1, score));
}

/**
 * Check if text contains hype words
 * P-3: Editorial voice enforcement
 */
export function containsHypeWords(text: string): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return HYPE_WORDS.some((word) => lowerText.includes(word));
}

/**
 * Determine if article should be held for review
 * Based on: confidence score, hype words, other factors
 */
export function shouldHoldForReview(article: Article & { confidence_score?: number | null }): {
  should: boolean;
  reason?: string;
} {
  // Check hype words
  const titleHasHype = containsHypeWords(article.title);
  const summaryHasHype = article.raw_summary ? containsHypeWords(article.raw_summary) : false;

  if (titleHasHype || summaryHasHype) {
    return {
      should: true,
      reason: "Hype word detected (P-3 editorial voice)",
    };
  }

  // Check confidence threshold
  if (article.confidence_score !== undefined && article.confidence_score !== null) {
    if (article.confidence_score < CONFIDENCE_THRESHOLD) {
      return {
        should: true,
        reason: `Low confidence: ${(article.confidence_score * 100).toFixed(0)}% < ${(CONFIDENCE_THRESHOLD * 100).toFixed(0)}%`,
      };
    }
  }

  return { should: false };
}

/**
 * Report-level hold decision (P-6 publish gate).
 * Pure function so it is unit-testable without a DB or server.
 *
 * A Daily Report is held for review if ANY of its articles:
 *  - scores below the confidence threshold (PDL-004), or
 *  - contains a hype word (P-3 editorial voice) in title / editorial summary
 *    / raw summary. This enforces P-3 in the unattended pipeline: hype text
 *    blocks auto-publish, it does not silently ship.
 */
export interface ReportHoldDecision {
  hold: boolean;
  reasons: string[];
  belowThreshold: number;
  hypeCount: number;
}

export function evaluateReportHold(
  articles: Array<
    Pick<Article, "title" | "summary" | "raw_summary"> & {
      confidence_score?: number | null;
    }
  >,
): ReportHoldDecision {
  const reasons: string[] = [];
  let belowThreshold = 0;
  let hypeCount = 0;

  for (const article of articles) {
    if (
      article.confidence_score !== undefined &&
      article.confidence_score !== null &&
      article.confidence_score < CONFIDENCE_THRESHOLD
    ) {
      belowThreshold++;
    }

    const text = `${article.title ?? ""} ${article.summary ?? ""} ${article.raw_summary ?? ""}`;
    if (containsHypeWords(text)) {
      hypeCount++;
    }
  }

  if (belowThreshold > 0) {
    reasons.push(
      `${belowThreshold} article(s) below confidence threshold (${(CONFIDENCE_THRESHOLD * 100).toFixed(0)}%)`,
    );
  }
  if (hypeCount > 0) {
    reasons.push(`${hypeCount} article(s) contain hype words (P-3 editorial voice)`);
  }

  return { hold: reasons.length > 0, reasons, belowThreshold, hypeCount };
}

/**
 * Categories for article classification
 * Per project brief §5 (not invented, from spec)
 */
export const ARTICLE_CATEGORIES = [
  "Tool Release",
  "Research",
  "Best Practices",
  "Bug/Security",
  "Community",
  "Event",
  "Tutorial",
  "Opinion",
] as const;

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];

/**
 * Simple rule-based classifier
 * Production: Use ML/embeddings for higher accuracy
 * MVP: Pattern matching on title + summary
 */
export function classifyArticle(article: Article): ArticleCategory | null {
  const text = `${article.title} ${article.raw_summary || ""}`.toLowerCase();

  // Simple pattern matching (production would use ML)
  if (text.includes("release") || text.includes("launch") || text.includes("version")) {
    return "Tool Release";
  }
  if (text.includes("research") || text.includes("study") || text.includes("paper")) {
    return "Research";
  }
  if (
    text.includes("best practice") ||
    text.includes("pattern") ||
    text.includes("guide") ||
    text.includes("how to")
  ) {
    return "Best Practices";
  }
  if (text.includes("bug") || text.includes("security") || text.includes("vulnerability")) {
    return "Bug/Security";
  }
  if (text.includes("community") || text.includes("announcement") || text.includes("news")) {
    return "Community";
  }
  if (text.includes("conference") || text.includes("meetup") || text.includes("event")) {
    return "Event";
  }
  if (text.includes("tutorial") || text.includes("example") || text.includes("code")) {
    return "Tutorial";
  }
  if (
    text.includes("opinion") ||
    text.includes("perspective") ||
    text.includes("thoughts") ||
    text.includes("take")
  ) {
    return "Opinion";
  }

  // M-4: Don't invent categories; return null if uncertain
  return null;
}
