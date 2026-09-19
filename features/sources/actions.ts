"use server";

/**
 * Source Collector — Fetch and parse RSS/API feeds
 * P-7: Health monitoring (reachability checks, staleness, auto-disable)
 * P-1.1: Fail loudly — errors are logged and visible, not silently degraded
 */

import { createHash } from "crypto";
import Parser from "rss-parser";
import { getEnabledSources, updateSource } from "./repository";
import { computeSourceFailure, SOURCE_HEALTH_CONFIG, SOURCE_RECOVERED } from "./domain";
import { supabaseAdmin } from "@/lib/db/client";
import { stripAiTells } from "@/lib/text/no-ai-tells";

// Sprint 06 (PDL logged in DECISION_LOG.md, M-12 pattern): rss-parser
// replaces the hand-rolled regex parser. Uses a real XML parser under the
// hood (CDATA-wrapped titles/descriptions unwrap correctly — the regex
// version silently dropped every hnrss.org item because of this) and
// normalizes both RSS 2.0 (<item>, <link>text</link>) and Atom
// (<entry>, <link href="...">) to the same shape, so no separate
// hand-written Atom code path is needed.
const rssParser = new Parser();

// Found live 2026-09-13 while adding Reddit as a source: plain `fetch(url)`
// with no headers gets rate-limited (HTTP 429) by Reddit noticeably more
// aggressively than a request carrying a real, identifying User-Agent --
// several feed hosts (Reddit included) treat an empty/generic UA as a
// signal to throttle harder. A descriptive UA naming the project and its
// URL is also just correct etiquette for an automated feed reader, not
// merely a workaround.
const FEED_FETCH_USER_AGENT =
  "VibeCodingJournalBot/1.0 (+https://web-app-vibe-coding-journal.vercel.app)";

// Same finding as above: several sources (Reddit confirmed directly) rate-
// limit a burst of back-to-back requests from the same IP even with a good
// User-Agent -- the collection loop below processes sources strictly one
// at a time already, but with no gap between them at all. A short pause
// between sources costs nothing against the hourly cron's real time
// budget and avoids re-creating the exact failure pattern already found
// and fixed once this session (a source silently auto-disabling after a
// few failed runs, unnoticed for months).
const INTER_SOURCE_DELAY_MS = 1000;

// Collection limits (2026-09-19): see collectArticlesFromAllSources.
const MAX_ITEMS_PER_FEED = 40;
const MAX_ITEM_AGE_DAYS = 30;
const POLL_CONCURRENCY = 4;

// Found live 2026-09-14: a REAL production outage, not just a slow test
// route -- the actual hourly cron started hitting Vercel's own
// FUNCTION_INVOCATION_TIMEOUT (killed after 300s) with the very last
// log line being "Phase 1: Source Collector", for three consecutive
// hourly runs, after the per-request fetch timeouts (checkSourceReachability,
// parseFeed) had already shipped and should have bounded every external
// HTTP call to 5s each. Those fetch-level timeouts do NOT cover every
// operation in a single source's processing -- specifically the
// Supabase calls (updateSource, the per-article upsert loop in the
// caller below), which have no timeout anywhere in this codebase. Any
// one of those hanging (a transient Supabase slowdown, a connection
// pool issue, anything) would stall the per-source loop indefinitely
// with no per-request timeout to catch it, exactly matching the
// observed symptom (stuck in Phase 1, no further progress, no error).
//
// Rather than hunt down and individually time-bind every Supabase call
// (a bigger, slower change under active-outage time pressure), this
// puts a hard ceiling on the ENTIRE per-source operation (reachability
// + fetch + parse + every DB write) via Promise.race — whatever is
// actually stuck, the loop moves on after this budget instead of
// taking the whole cron run down with it. This does not cancel the
// underlying stuck operation (Promise.race has no way to do that for
// an already-in-flight Supabase call) -- it only prevents it from
// blocking further progress. A future, more surgical fix would thread
// real cancellation through every Supabase call individually; this is
// the fast, safe stopgap for an active outage.
const SOURCE_PROCESSING_BUDGET_MS = 20000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

interface ParsedArticle {
  title: string;
  url: string;
  published_at: string;
  summary: string;
}

/**
 * Poll all due sources and collect articles.
 * Called by /api/cron/daily-digest.
 * P-1.1: returns error details, not a silent failure.
 *
 * Rewritten 2026-09-19 (knowledge-growth work, root cause of the third daily
 * timeout). The old loop did, per source: a HEAD probe, a GET, then ONE database
 * round trip PER FEED ITEM, re-upserting every item of every feed every hour.
 * The Vercel atom feed holds about 1,500 entries, so five sources took roughly
 * four minutes and the 300 s function limit killed the run before any report was
 * built. Now:
 *   - no HEAD probe (several feeds answer HEAD with 403/405 and were being counted
 *     as failures, which is how nine healthy sources ended up disabled);
 *   - only the newest MAX_ITEMS_PER_FEED items, none older than MAX_ITEM_AGE_DAYS;
 *   - ONE batched insert per source that ignores rows already stored, so the number
 *     returned is the number of genuinely new articles;
 *   - sources are polled a few at a time, never two at once on the same host;
 *   - failures use a growing cool-down (features/sources/domain.ts), not a
 *     permanent disable.
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

  async function processSource(source: Awaited<ReturnType<typeof getEnabledSources>>[number]): Promise<void> {
    const started = new Date();
    try {
      const parsed = await parseFeed(source.url, source.type);
      const cutoff = started.getTime() - MAX_ITEM_AGE_DAYS * 86_400_000;
      const fresh = parsed
        .filter((a) => Number.isNaN(new Date(a.published_at).getTime()) || new Date(a.published_at).getTime() >= cutoff)
        .sort((x, y) => (x.published_at < y.published_at ? 1 : -1))
        .slice(0, MAX_ITEMS_PER_FEED);

      if (parsed.length === 0) {
        errors.push({ sourceId: source.id, error: `${source.name}: parsed but returned zero articles` });
        // The source itself is healthy, it just had nothing: recover it.
        await updateSource(source.id, { ...SOURCE_RECOVERED, last_polled: started.toISOString() });
        return;
      }

      if (!supabaseAdmin) throw new Error("Admin client not available");

      // One row per hash: two items of the same feed with the same title and URL would
      // otherwise collide inside a single statement.
      const byHash = new Map<string, Record<string, unknown>>();
      for (const article of fresh) {
        const hash = generateArticleHash(article.title, article.url);
        byHash.set(hash, {
          // Stored text follows the writing rule too (2026-09-19): a feed title such as
          // "Tool X - what changed" with an en dash must not reach a report. The hash is
          // computed from the ORIGINAL title so de-duplication of stored rows is unchanged.
          title: stripAiTells(article.title),
          url: article.url,
          source_id: source.id,
          source: source.name,
          published_at: article.published_at,
          raw_summary: stripAiTells(article.summary),
          hash,
        });
      }

      // Items removed earlier as off topic (rejected_articles, migration 029) are not brought
      // back by the next poll of the same feed.
      if (byHash.size > 0) {
        const { data: rejected } = await supabaseAdmin.from("rejected_articles").select("hash").in("hash", [...byHash.keys()]);
        for (const r of rejected ?? []) byHash.delete(r.hash as string);
      }

      let added = 0;
      if (byHash.size > 0) {
        // ignoreDuplicates: rows whose hash already exists are skipped, and only the
        // rows actually inserted come back, so `added` is a true count of new articles.
        const { data, error } = await supabaseAdmin
          .from("articles")
          .upsert([...byHash.values()], { onConflict: "hash", ignoreDuplicates: true })
          .select("id");
        if (error) throw new Error(`Failed to store articles: ${error.message}`);
        added = data?.length ?? 0;
      }
      articlesAdded += added;

      await updateSource(source.id, {
        ...SOURCE_RECOVERED,
        last_polled: started.toISOString(),
        last_success: new Date().toISOString(),
      });
    } catch (sourceError) {
      const errorMsg = sourceError instanceof Error ? sourceError.message : String(sourceError);
      const outcome = computeSourceFailure(source.failure_count, new Date());

      try {
        await updateSource(source.id, { ...outcome, last_polled: started.toISOString() });
      } catch (writeError) {
        console.error(`[COLLECT] Could not record failure for "${source.name}": ${String(writeError)}`);
      }

      errors.push({
        sourceId: source.id,
        error: outcome.enabled
          ? `${source.name}: ${errorMsg} (failure ${outcome.failure_count}/${SOURCE_HEALTH_CONFIG.MAX_FAILURES})`
          : `${source.name}: ${errorMsg} (paused until ${outcome.retry_after})`,
      });
    }
  }

  try {
    const sources = await getEnabledSources();
    sourcesProcessed = sources.length;

    // At most one source per host at a time (five hnrss.org feeds, for example),
    // and a short pause after each, so no host is hit in a burst.
    const hostTail = new Map<string, Promise<void>>();
    const queue = [...sources];

    const worker = async (): Promise<void> => {
      for (let source = queue.shift(); source; source = queue.shift()) {
        const host = new URL(source.url).hostname;
        const previous = hostTail.get(host) ?? Promise.resolve();
        const mine = previous.then(async () => {
          try {
            await withTimeout(processSource(source), SOURCE_PROCESSING_BUDGET_MS, source.name);
          } catch (raceError) {
            const msg = raceError instanceof Error ? raceError.message : String(raceError);
            console.error(`[COLLECT] "${source.name}" did not complete within ${SOURCE_PROCESSING_BUDGET_MS}ms: ${msg}`);
            errors.push({ sourceId: source.id, error: `Processing exceeded time budget: ${msg}` });
          }
          await sleep(INTER_SOURCE_DELAY_MS);
        });
        hostTail.set(host, mine);
        await mine;
      }
    };

    await Promise.all(Array.from({ length: Math.min(POLL_CONCURRENCY, sources.length) }, () => worker()));

    return { success: errors.length === 0, articlesAdded, sourcesProcessed, errors };
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
  // Found live 2026-09-13 while verifying Phase 4 (Event Deduplication):
  // this fetch had no timeout at all, unlike checkSourceReachability()'s
  // HEAD check -- a single slow/hanging source (passing the reachability
  // check, which only proves the server responds to SOME request, not
  // that this specific feed request will complete promptly) could stall
  // collectArticlesFromAllSources() indefinitely, and with it the whole
  // hourly cron run, up to Vercel's own platform-level function timeout.
  //
  // First attempt at this fix (same day) only wrapped the fetch() call
  // itself and cleared the timeout in a `finally` right after it
  // resolved -- WRONG, and confirmed live: fetch() resolves once
  // response HEADERS arrive, not once the body is fully received, so a
  // server that answers promptly but then stalls mid-body-transfer
  // sailed straight through that "fix" and hung indefinitely inside
  // response.text() below, which had no timeout of its own at all. A
  // live re-test after that first fix still hung for 240s+ with zero
  // progress logged, proving the fetch()-only guard did nothing for
  // this failure mode. Reuses SOURCE_HEALTH_CONFIG.HTTP_TIMEOUT_MS for
  // consistency with the reachability check's own budget.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SOURCE_HEALTH_CONFIG.HTTP_TIMEOUT_MS);

  try {
    let response: Response;
    try {
      response = await fetch(url, {
        headers: { "User-Agent": FEED_FETCH_USER_AGENT },
        signal: controller.signal,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      throw new Error(`Feed fetch error: ${errorMsg}`);
    }

    if (!response.ok) {
      throw new Error(`Feed fetch error: HTTP ${response.status}`);
    }

    // The abort signal stays armed through the body read/parse below --
    // clearing it only in the outer `finally`, after this all completes
    // (or fails) -- so a stalled body transfer is caught too, not just
    // a stalled initial connection.
    if (type === "rss") {
      return await parseRSSFeed(response);
    } else {
      return await parseAPIFeed(response);
    }
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error(
        `Feed fetch error: timed out after ${SOURCE_HEALTH_CONFIG.HTTP_TIMEOUT_MS}ms (response body never completed)`,
      );
    }
    throw err;
  } finally {
    clearTimeout(timeout);
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
