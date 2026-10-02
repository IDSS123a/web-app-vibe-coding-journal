/**
 * The Tools learning step (Director-approved, 2026-10-02 six-step feasibility study).
 * Called by the hourly backlog cycle in app/api/cron/daily-digest/route.ts, the same
 * place the Dictionary's own learning step runs. Two stages:
 *
 *   1. Discovery (at most `maxAiCalls` AI requests): read a batch of relevant articles
 *      that tool-discovery has not read yet, and record tools the list lacks as
 *      candidates.
 *   2. Promotion (no AI): a candidate that is established (see discovery.ts) becomes a
 *      published tool.
 *
 * Deliberately does NOT track "mentions of already-published tools" the way the
 * Dictionary's own learning step does for trending terms -- not asked for, and a
 * tool that is already published does not need a freshness signal the way Dictionary
 * vocabulary's "trending" marker does.
 *
 * Every step degrades on its own: a failed AI call leaves candidates as they were,
 * and the articles stay unread so the next run tries them again.
 */
import { supabaseAdmin } from "@/lib/db/client";
import { getAIProvider } from "@/lib/ai/ai-provider";
import { GeminiKeysExhaustedError } from "@/lib/ai/gemini-provider";
import { RELEVANCE_THRESHOLD } from "@/features/pipeline/quality-engine";
import { normalizeKey, slugify } from "./domain";
import { cleanCandidateName, isKnownTool, mergeObservation, shouldPromote, type CandidateState } from "./discovery";

const EXTRACTION_BATCH = 15;
const ARTICLE_LOOKBACK_DAYS = 14;

export interface ToolLearningResult {
  aiCalls: number;
  articlesRead: number;
  candidatesSeen: number;
  promoted: number;
  quotaExhausted: boolean;
  errors: string[];
}

export async function runToolLearning(options: { maxAiCalls: number; deadlineAt: number }): Promise<ToolLearningResult> {
  const result: ToolLearningResult = { aiCalls: 0, articlesRead: 0, candidatesSeen: 0, promoted: 0, quotaExhausted: false, errors: [] };
  if (!supabaseAdmin) return result;
  const now = new Date();

  try {
    const { data: knownRows, error: knownErr } = await supabaseAdmin.from("tools").select("name").eq("status", "published");
    if (knownErr) throw new Error(`Failed to load known tools: ${knownErr.message}`);
    const knownNames = (knownRows ?? []).map((r) => r.name as string);
    const knownKeys = new Set(knownNames.map((n) => normalizeKey(n)));

    // Discovery of new tools.
    if (options.maxAiCalls > 0 && Date.now() < options.deadlineAt - 30_000) {
      const since = new Date(now.getTime() - ARTICLE_LOOKBACK_DAYS * 86_400_000).toISOString();
      const { data: unread, error } = await supabaseAdmin
        .from("articles")
        .select("id, source, title, summary, raw_summary")
        .is("duplicate_of", null)
        .is("tools_extracted_at", null)
        .gte("relevance_score", RELEVANCE_THRESHOLD)
        .gte("published_at", since)
        .order("published_at", { ascending: false })
        .limit(EXTRACTION_BATCH);
      if (error) throw new Error(`Failed to load unread articles: ${error.message}`);

      if (unread && unread.length > 0) {
        try {
          result.aiCalls++;
          const out = await getAIProvider().extractTools({
            articles: unread.map((a, i) => ({ n: i + 1, title: a.title as string, summary: ((a.summary as string | null) ?? (a.raw_summary as string | null) ?? "") })),
            knownTools: knownNames.slice(0, 400),
          });

          for (const proposed of out.tools) {
            const name = cleanCandidateName(proposed.name);
            if (!name || isKnownTool(name, knownKeys)) continue;
            const articleRows = proposed.articleNumbers.map((n) => unread[n - 1]).filter((r): r is NonNullable<typeof r> => !!r);
            if (articleRows.length === 0) continue;
            const slug = slugify(name);

            const { data: existingRow } = await supabaseAdmin.from("tool_candidates").select("*").eq("slug", slug).maybeSingle();
            if (existingRow && existingRow.status !== "candidate") continue;
            const merged = mergeObservation(
              existingRow
                ? ({
                    name: existingRow.name,
                    slug,
                    description: existingRow.description,
                    url: existingRow.url,
                    pricing: existingRow.pricing,
                    mention_count: existingRow.mention_count,
                    source_names: existingRow.source_names ?? [],
                    article_ids: existingRow.article_ids ?? [],
                    first_seen_at: existingRow.first_seen_at,
                    last_seen_at: existingRow.last_seen_at,
                  } as CandidateState)
                : null,
              {
                name,
                description: proposed.description,
                url: proposed.url,
                pricing: proposed.pricing,
                articleIds: articleRows.map((r) => r.id as string),
                sources: articleRows.map((r) => r.source as string),
                seenAt: now.toISOString(),
              },
            );
            const { error: upErr } = await supabaseAdmin.from("tool_candidates").upsert(
              {
                name: merged.name,
                slug,
                description: existingRow?.description ?? proposed.description,
                url: existingRow?.url ?? proposed.url,
                pricing: existingRow?.pricing ?? proposed.pricing,
                mention_count: merged.mention_count,
                source_names: merged.source_names,
                article_ids: merged.article_ids,
                first_seen_at: merged.first_seen_at,
                last_seen_at: merged.last_seen_at,
                status: "candidate",
              },
              { onConflict: "slug" },
            );
            if (upErr) result.errors.push(`candidate ${name}: ${upErr.message}`);
            else result.candidatesSeen++;
          }

          // Only after a successful call: these articles have now been read.
          await supabaseAdmin.from("articles").update({ tools_extracted_at: now.toISOString() }).in("id", unread.map((a) => a.id as string));
          result.articlesRead = unread.length;
        } catch (err) {
          if (err instanceof GeminiKeysExhaustedError) result.quotaExhausted = true;
          result.errors.push(`extraction: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    // Promotion of established candidates.
    const { data: candidates, error: candErr } = await supabaseAdmin.from("tool_candidates").select("*").eq("status", "candidate");
    if (candErr) throw new Error(`Failed to load candidates: ${candErr.message}`);
    for (const c of candidates ?? []) {
      const state: CandidateState = {
        name: c.name,
        slug: c.slug,
        description: c.description,
        url: c.url,
        pricing: c.pricing,
        mention_count: c.mention_count,
        source_names: c.source_names ?? [],
        article_ids: c.article_ids ?? [],
        first_seen_at: c.first_seen_at,
        last_seen_at: c.last_seen_at,
        status: c.status,
      };
      if (!shouldPromote(state, now)) continue;

      const { error: insErr } = await supabaseAdmin.from("tools").insert({
        name: c.name,
        slug: c.slug,
        description: c.description,
        url: c.url,
        pricing: c.pricing,
        origin: "discovered",
        status: "published",
        mention_count: c.mention_count,
        last_seen_at: c.last_seen_at,
        first_seen_at: now.toISOString(),
      });
      if (insErr) {
        // A unique clash means the name or slug exists by now: retire the candidate.
        await supabaseAdmin.from("tool_candidates").update({ status: "rejected" }).eq("id", c.id);
        result.errors.push(`promotion ${c.name}: ${insErr.message}`);
        continue;
      }
      await supabaseAdmin.from("tool_candidates").update({ status: "promoted", promoted_at: now.toISOString() }).eq("id", c.id);
      result.promoted++;
    }
    return result;
  } catch (err) {
    result.errors.push(err instanceof Error ? err.message : String(err));
    return result;
  }
}
