"use server";

/**
 * Source Collector — Fetch and parse RSS/API feeds
 * P-7: Health monitoring (reachability checks, staleness, auto-disable)
 * P-1.1: Fail loudly — errors are logged and visible, not silently degraded
 */

import { createHash } from "crypto";
import Parser from "rss-parser";
import { getEnabledSources, updateSource } from "./repository";
import { shouldAutoDisableSource, SOURCE_HEALTH_CONFIG } from "./domain";
import { supabaseAdmin } from "@/lib/db/client";

// Sprint 06 (PDL logged in DECISION_LOG.md, M-12 pattern): rss-parser
// replaces the hand-rolled regex parser. Uses a real XML parser under the
// hood (CDATA-wrapped titles/descriptions unwrap correctly — the regex
// version silently dropped every hnrss.org item because of this) and
// normalizes both RSS 2.0 (<item>, <link>text</link>) and Atom
// (<entry>, <link href="...">) to the same shape, so no separate
// hand-written Atom code path is needed.
const rssParser = new Parser();

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

        // P-7: errorMsg is already self-describing (e.g. "Feed fetch error:
        // ..." for a transient reachability-adjacent failure vs "Feed parse
        // error: ..." for a genuine parse failure, or "Failed to store
        // article: ..." for a storage issue) — no blanket "Parse error:"
        // prefix here, that used to conflate all three into one category.
        errors.push({
          sourceId: source.id,
          error: errorMsg,
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
 * Parse RSS/Atom or API feed and extract articles
 * P-7: fetch-level failures and parse-level failures are thrown with
 * distinct message prefixes so downstream error text/monitoring never
 * conflates a transient issue (retry-worthy) with a permanent one
 * (stays broken until code is fixed) — see Sprint 06 scope doc.
 */
async function parseFeed(
  url: string,
  type: "rss" | "api",
): Promise<ParsedArticle[]> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    throw new Error(`Feed fetch error: ${errorMsg}`);
  }

  if (!response.ok) {
    throw new Error(`Feed fetch error: HTTP ${response.status}`);
  }

  if (type === "rss") {
    return await parseRSSFeed(response);
  } else {
    return await parseAPIFeed(response);
  }
}

/**
 * Parse RSS 2.0 or Atom feed via rss-parser (Sprint 06).
 * rss-parser uses a real XML parser (handles CDATA-wrapped title/description
 * correctly, unlike the previous regex) and normalizes both RSS 2.0
 * (<item>, <link>text</link>) and Atom (<entry>, <link href="...">) to the
 * same item shape — no separate Atom code path needed.
 */
async function parseRSSFeed(response: Response): Promise<ParsedArticle[]> {
  const text = await response.text();

  let feed: Parser.Output<Record<string, unknown>>;
  try {
    feed = await rssParser.parseString(text);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    throw new Error(`Feed parse error: ${errorMsg}`);
  }

  return (feed.items ?? [])
    .filter((item) => item.title && item.link)
    .map((item) => ({
      title: item.title!.trim(),
      url: item.link!.trim(),
      summary: (item.contentSnippet ?? item.content ?? "").trim(),
      published_at: item.isoDate
        ? item.isoDate
        : item.pubDate
          ? new Date(item.pubDate).toISOString()
          : new Date().toISOString(),
    }));
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
