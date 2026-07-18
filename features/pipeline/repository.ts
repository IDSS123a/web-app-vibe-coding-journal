import { supabaseAdmin } from "@/lib/db/client";
import type { Article } from "@/lib/validation/schemas";

/**
 * Get article by hash (fast lookup for exact duplicate detection)
 * O(1) via database index on articles.hash
 */
export async function getArticleByHash(
  hash: string,
  excludeId?: string,
): Promise<Article | null> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  // Ingestion upserts on `hash`, so a hash is unique in the table. Without
  // excluding the caller's own id, this would always find the article itself
  // and every article would be marked a duplicate of itself. excludeId makes
  // this return only a *different* article sharing the hash (a true duplicate).
  let query = supabaseAdmin.from("articles").select("*").eq("hash", hash);
  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.maybeSingle();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = not found
    throw new Error(`Failed to find article by hash: ${error.message}`);
  }

  return (data as Article) || null;
}

/**
 * Find all articles with summary similar to given text
 * Returns candidates for fuzzy duplicate detection
 * Production: Use embedding search (pgvector) for better performance
 */
export async function findArticlesByTextSimilarity(
  _text: string,
  limit: number = 10,
): Promise<Article[]> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  // Simple approach: get recent articles with some summary text
  // Production would use pgvector or similar vector DB
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("*")
    .not("raw_summary", "is", null)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to find similar articles: ${error.message}`);
  }

  return data as Article[];
}

/**
 * Mark article as duplicate of another article
 * Sets duplicate_of field and marks for later filtering
 */
export async function markArticleAsDuplicate(
  articleId: string,
  duplicateOfId: string,
): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { error } = await supabaseAdmin
    .from("articles")
    .update({
      duplicate_of: duplicateOfId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", articleId);

  if (error) {
    throw new Error(`Failed to mark duplicate: ${error.message}`);
  }
}

/**
 * Get all articles that are not marked as duplicates
 * Used by downstream pipeline stages (Quality Engine, etc.)
 */
export async function getNonDuplicateArticles(): Promise<Article[]> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("*")
    .is("duplicate_of", null)
    .is("confidence_score", null) // Articles not yet processed by Quality Engine
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch non-duplicate articles: ${error.message}`);
  }

  return data as Article[];
}

/**
 * Update article confidence score (Quality Engine output)
 */
export async function updateArticleConfidence(
  articleId: string,
  confidenceScore: number,
): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { error } = await supabaseAdmin
    .from("articles")
    .update({
      confidence_score: confidenceScore,
      updated_at: new Date().toISOString(),
    })
    .eq("id", articleId);

  if (error) {
    throw new Error(`Failed to update confidence: ${error.message}`);
  }
}

/**
 * Update article category (Classifier output)
 */
export async function updateArticleCategory(
  articleId: string,
  category: string | null,
): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { error } = await supabaseAdmin
    .from("articles")
    .update({
      category,
      updated_at: new Date().toISOString(),
    })
    .eq("id", articleId);

  if (error) {
    throw new Error(`Failed to update category: ${error.message}`);
  }
}

/**
 * Get articles ready for Daily Report (not duplicates, have confidence score, below/above threshold)
 */
export async function getArticlesForDailyReport(): Promise<Article[]> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("*")
    .is("duplicate_of", null)
    .not("confidence_score", "is", null) // Only scored articles
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch articles for daily report: ${error.message}`);
  }

  return data as Article[];
}
