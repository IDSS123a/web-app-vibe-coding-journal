/**
 * Duplicate Engine domain logic
 * P-5: Quality thresholds (similarity) configured via DECISION_LOG
 * P-1.1: Explicit handling of edge cases, not silent deduplication
 */

/**
 * PDL-003: Cosine Similarity Threshold for Duplicate Detection
 * Decision: Start with 0.85 (configurable, not hardcoded magic number)
 * Date: 2026-07-18 (Sprint 02)
 * Rationale: 0.85 provides strong confidence in similarity while allowing
 * for minor variations in wording (title rephrasing, summary edits).
 * Tuning: If too many duplicates slip through, increase to 0.90.
 * If over-deduplicate, decrease to 0.80.
 */
export const SIMILARITY_THRESHOLD = 0.85;

/**
 * Phase 4 (specs/vibe-coding-intelligence-engine/ROADMAP.md, Event
 * Deduplication/Clustering), 2026-09-13: SIMILARITY_THRESHOLD above
 * compares raw_summary text, which was designed for near-identical
 * republished content (Sprint 02's own rationale: "title rephrasing,
 * summary edits") -- it does not catch the roadmap's actual target,
 * two DIFFERENT sources independently covering the SAME event in their
 * own words (e.g. Anthropic's own announcement vs. a Hacker News
 * discussion of it), where full-paragraph summaries diverge a lot in
 * phrasing but titles still share the specific proper nouns/terms that
 * identify the event (a tool name, a feature name).
 * Decision: 0.5 -- deliberately more lenient than SIMILARITY_THRESHOLD
 * because titles are short (a handful of significant words), so even a
 * genuine match rarely reaches 0.85 Jaccard overlap; several proper
 * nouns matching (e.g. "Claude Code", "MCP") already carries strong
 * signal at a lower score.
 * Tuning: if two clearly-different stories about the same tool get
 * merged, raise this. If genuinely duplicate coverage isn't being
 * caught, lower it -- but favor under-clustering (a redundant entry)
 * over over-clustering (silently hiding a distinct story), since the
 * latter is a correctness bug, not just noise.
 */
export const TITLE_SIMILARITY_THRESHOLD = 0.5;

export interface DuplicateResult {
  isDuplicate: boolean;
  reason: "hash_match" | "similarity_match" | "title_match" | "not_duplicate";
  duplicateOfId?: string;
  confidence?: number; // Cosine similarity score if similarity_match/title_match
}

/**
 * Hash-based duplicate detection (O(1) lookup)
 * If article with same hash exists, it's a perfect duplicate
 */
export function hashMatch(existingHash: string, newHash: string): boolean {
  return existingHash === newHash;
}

/**
 * Cosine similarity between two text vectors (simple TF-IDF approximation)
 * Range: 0-1 (1 = identical, 0 = completely different)
 *
 * Simplified: Split text into words, compute intersection ratio
 * Production would use proper embedding model or TF-IDF library
 */
export function cosineSimilarity(text1: string, text2: string): number {
  const normalize = (text: string): Set<string> =>
    new Set(
      text
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 2), // Ignore short words
    );

  const set1 = normalize(text1);
  const set2 = normalize(text2);

  if (set1.size === 0 || set2.size === 0) return 0;

  const intersection = new Set([...set1].filter(word => set2.has(word)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size; // Jaccard similarity as proxy for cosine
}

/**
 * Determine if article is a duplicate
 * 1. Check hash first (fast, perfect match)
 * 2. Fall back to summary similarity (near-identical republished content)
 * 3. Fall back to title similarity (Phase 4: the same event, covered
 *    independently by a different source in its own words)
 */
export function isDuplicate(
  existingArticle: { hash: string; raw_summary?: string | null; title?: string },
  newArticle: { hash: string; raw_summary?: string | null; title?: string },
): DuplicateResult {
  // Hash match (perfect duplicate)
  if (hashMatch(existingArticle.hash, newArticle.hash)) {
    return {
      isDuplicate: true,
      reason: "hash_match",
      confidence: 1.0,
    };
  }

  // Similarity match (fuzzy duplicate — near-identical content)
  const summary1 = existingArticle.raw_summary || "";
  const summary2 = newArticle.raw_summary || "";

  if (summary1 && summary2) {
    const similarity = cosineSimilarity(summary1, summary2);

    if (similarity >= SIMILARITY_THRESHOLD) {
      return {
        isDuplicate: true,
        reason: "similarity_match",
        confidence: similarity,
      };
    }
  }

  // Title match (Phase 4 — same underlying event, different source/wording)
  const title1 = existingArticle.title || "";
  const title2 = newArticle.title || "";

  if (title1 && title2) {
    const titleSimilarity = cosineSimilarity(title1, title2);

    if (titleSimilarity >= TITLE_SIMILARITY_THRESHOLD) {
      return {
        isDuplicate: true,
        reason: "title_match",
        confidence: titleSimilarity,
      };
    }
  }

  return {
    isDuplicate: false,
    reason: "not_duplicate",
  };
}

export interface ClusterableArticle {
  id: string;
  hash: string;
  title: string;
  raw_summary: string | null;
  published_at: string;
}

export interface EventCluster {
  /** The article kept visible in the report — the earliest published of the group. */
  canonicalId: string;
  /** Other articles judged to cover the same event — hidden from the report, but their source is still shown ("Also covered by"). */
  duplicateIds: string[];
}

/**
 * Phase 4 (Event Deduplication/Clustering): groups a batch of articles
 * (already past exact-hash dedup — see deduplicateArticles(),
 * app/api/cron/daily-digest/route.ts) into clusters of the same
 * underlying event, using isDuplicate()'s title/summary similarity.
 *
 * Pure and bounded: operates only on the batch passed in (typically one
 * cron run's newly-collected articles, on the order of tens of items,
 * not the whole history) — an O(n²) comparison over that size is cheap
 * and, critically, does not repeat the unbounded-growth mistake found
 * live earlier this project (features/pipeline/repository.ts
 * getArticlesForDailyReport, fixed 2026-09-10): this function is never
 * called against an ever-growing all-time article set.
 *
 * Canonical selection: earliest published_at wins (the original
 * reporter) — a simple, deterministic rule that needs no extra data
 * (e.g. source trust score) to apply consistently.
 */
export function clusterDuplicateEvents(articles: ClusterableArticle[]): EventCluster[] {
  const sorted = [...articles].sort(
    (a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime(),
  );

  const clusters: EventCluster[] = [];

  for (const article of sorted) {
    const match = clusters.find((cluster) => {
      const canonical = sorted.find((a) => a.id === cluster.canonicalId)!;
      return isDuplicate(canonical, article).isDuplicate;
    });

    if (match) {
      match.duplicateIds.push(article.id);
    } else {
      clusters.push({ canonicalId: article.id, duplicateIds: [] });
    }
  }

  return clusters;
}
