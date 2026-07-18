"use server";

/**
 * Source Collector — Fetch and parse RSS/API feeds
 * P-7: Health monitoring (reachability checks, staleness, auto-disable)
 * P-1.1: Fail loudly — errors are logged and visible, not silently degraded
 */

import { createHash } from "crypto";
import { getEnabledSources, updateSource } from "./repository";
import { shouldAutoDisableSource, SOURCE_HEALTH_CONFIG } from "./domain";
import { supabaseAdmin } from "@/lib/db/client";

interface ParsedArticle {
  title: string;
  url: string;
  published_at: string;
  summary: string;
}

/**
 * Poll all enabled sources and collect articles
 * Called by /api/cron/daily-digest
 * P-1.1: Returns error details, not a silent failure
 */
export async function collectArticlesFromAllSources(): Promise<{
  success: boolean;
  articlesAdded: number;
  sourcesProcessed: number;
  errors: Array<{ sourceId: string; error: string }>;
}> {
  const errors: Array<{ sourceId: string; error: string }> = [];
  let articlesAdded = 0;
  let sourcesProcessed = 0;

  try {
    const sources = await getEnabledSources();

    for (const source of sources) {
      sourcesProcessed++;

      try {
        // Step 1: Health check (P-7: reachability)
        const isReachable = await checkSourceReachability(source.url);

        if (!isReachable) {
          // Source is down — increment failure count
          const newFailureCount = source.failure_count + 1;
          const shouldDisable = shouldAutoDisableSource(newFailureCount);

          await updateSource(source.id, {
            failure_count: newFailureCount,
            enabled: !shouldDisable,
          });

          if (shouldDisable) {
            errors.push({
              sourceId: source.id,
              error: `Source auto-disabled after ${newFailureCount} consecutive failures`,
            });
          } else {
            errors.push({
              sourceId: source.id,
              error: `Source unreachable (failure ${newFailureCount}/${SOURCE_HEALTH_CONFIG.MAX_FAILURES})`,
            });
          }

          continue;
        }

        // Step 2: Parse feed
        const articles = await parseFeed(source.url, source.type);

        if (articles.length === 0) {
          errors.push({
            sourceId: source.id,
            error: "Source parsed but returned zero articles",
          });
          // Reset failure count — source is healthy, just no new articles
          await updateSource(source.id, {
            last_polled: new Date().toISOString(),
            failure_count: 0,
          });
          continue;
        }

        // Step 3: Store articles with source_id
        for (const article of articles) {
          const hash = generateArticleHash(article.title, article.url);

          if (!supabaseAdmin) {
            throw new Error("Admin client not available");
          }

          const { error } = await supabaseAdmin
            .from("articles")
            .upsert(
              {
                title: article.title,
                url: article.url,
                source_id: source.id,
                source: source.name,
                published_at: article.published_at,
                raw_summary: article.summary,
                hash,
              },
              { onConflict: "hash" }, // Don't re-insert if hash already exists (duplicate)
            );

          if (error) {
            throw new Error(`Failed to store article: ${error.message}`);
          }

          articlesAdded++;
        }

        // Step 4: Update source metadata (success)
        await updateSource(source.id, {
          last_polled: new Date().toISOString(),
          last_success: new Date().toISOString(),
          failure_count: 0, // Reset on success
        });
      } catch (sourceError) {
        // Source-level error — log and continue with next source
        const errorMsg =
          sourceError instanceof Error ? sourceError.message : String(sourceError);

        const newFailureCount = source.failure_count + 1;
        const shouldDisable = shouldAutoDisableSource(newFailureCount);

        await updateSource(source.id, {
          failure_count: newFailureCount,
          enabled: !shouldDisable,
        });

        errors.push({
          sourceId: source.id,
          error: `Parse error: ${errorMsg}`,
        });
      }
    }

    return {
      success: errors.length === 0,
      articlesAdded,
      sourcesProcessed,
      errors,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      articlesAdded,
      sourcesProcessed,
      errors: [{ sourceId: "system", error: errorMsg }],
    };
  }
}

/**
 * Check if source URL is reachable (HTTP HEAD)
 * P-7: Reachability test before full fetch
 */
async function checkSourceReachability(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SOURCE_HEALTH_CONFIG.HTTP_TIMEOUT_MS);

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Parse RSS or API feed and extract articles
 * Stub implementation — real parsing depends on feed format
 */
async function parseFeed(
  url: string,
  type: "rss" | "api",
): Promise<ParsedArticle[]> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    if (type === "rss") {
      return await parseRSSFeed(response);
    } else {
      return await parseAPIFeed(response);
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to fetch feed: ${errorMsg}`);
  }
}

/**
 * Parse RSS/Atom feed
 * Simplified: extracts title, link, description, pubDate
 */
async function parseRSSFeed(response: Response): Promise<ParsedArticle[]> {
  const text = await response.text();
  const articles: ParsedArticle[] = [];

  // Simple regex-based extraction (production would use xml parser)
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(text)) !== null) {
    const item = match[1]!;

    const titleMatch = /<title>([^<]+)<\/title>/.exec(item);
    const linkMatch = /<link>([^<]+)<\/link>/.exec(item);
    const descMatch = /<description>([^<]+)<\/description>/.exec(item);
    const pubDateMatch = /<pubDate>([^<]+)<\/pubDate>/.exec(item);

    if (titleMatch?.[1] && linkMatch?.[1]) {
      articles.push({
        title: titleMatch[1].trim(),
        url: linkMatch[1].trim(),
        summary: descMatch?.[1]?.trim() ?? "",
        published_at: pubDateMatch?.[1] ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString(),
      });
    }
  }

  return articles;
}

/**
 * Parse JSON API feed
 * Expects: { items: [{ title, url, summary, published_at }] }
 */
async function parseAPIFeed(response: Response): Promise<ParsedArticle[]> {
  const data = await response.json();

  if (!Array.isArray(data.items)) {
    throw new Error("API response missing 'items' array");
  }

  return data.items.map((item: Record<string, unknown>) => ({
    title: (item.title as string | undefined) || "Untitled",
    url: ((item.url as string | undefined) || (item.link as string | undefined) || ""),
    summary: ((item.summary as string | undefined) || (item.description as string | undefined) || ""),
    published_at: (item.published_at as string | undefined) || new Date().toISOString(),
  }));
}

/**
 * Generate hash for article (used for duplicate detection)
 * Hash = SHA256(title + url)
 */
function generateArticleHash(title: string, url: string): string {
  const combined = `${title}${url}`;
  return createHash("sha256").update(combined).digest("hex");
}
