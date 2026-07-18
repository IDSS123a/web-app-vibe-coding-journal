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

export interface DuplicateResult {
  isDuplicate: boolean;
  reason: "hash_match" | "similarity_match" | "not_duplicate";
  duplicateOfId?: string;
  confidence?: number; // Cosine similarity score if similarity_match
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
 * 2. Fall back to similarity (slower, fuzzy match)
 */
export function isDuplicate(
  existingArticle: { hash: string; raw_summary?: string | null },
  newArticle: { hash: string; raw_summary?: string | null },
): DuplicateResult {
  // Hash match (perfect duplicate)
  if (hashMatch(existingArticle.hash, newArticle.hash)) {
    return {
      isDuplicate: true,
      reason: "hash_match",
      confidence: 1.0,
    };
  }

  // Similarity match (fuzzy duplicate)
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

  return {
    isDuplicate: false,
    reason: "not_duplicate",
  };
}
