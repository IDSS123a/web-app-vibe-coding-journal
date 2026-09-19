/**
 * The Dictionary's daily learning step (specs/knowledge-growth-and-dictionary/, 2026-09-19).
 * Called by the hourly backlog cycle in app/api/cron/daily-digest/route.ts. Three stages:
 *
 *   1. Mentions (no AI): count, for every published term, the distinct relevant articles of
 *      the last seven days that mention it. The counts drive the "trending" marker.
 *   2. Discovery (at most `maxAiCalls` AI requests): read a batch of relevant articles that
 *      have not been read yet, and record vocabulary the Dictionary lacks as candidates.
 *   3. Promotion (no AI): a candidate that is established (see discovery.ts) becomes a
 *      published term, marked "new" for two weeks.
 *
 * Every step degrades on its own: a failed AI call leaves candidates and mentions as they
 * were, and the articles stay unread so the next run tries them again.
 */
import { supabaseAdmin } from "@/lib/db/client";
import { getAIProvider } from "@/lib/ai/ai-provider";
import { GeminiKeysExhaustedError } from "@/lib/ai/gemini-provider";
import { RELEVANCE_THRESHOLD } from "@/features/pipeline/quality-engine";
import { DICTIONARY_GROUPS, normalizeKey, slugify, TRENDING_WINDOW_DAYS } from "./domain";
import {
  cleanCandidateName,
  findMentions,
  isKnownTerm,
  mergeObservation,
  shouldPromote,
  type ArticleText,
  type CandidateState,
} from "./discovery";

const EXTRACTION_BATCH = 15;
const ARTICLE_LOOKBACK_DAYS = 14;

export interface LearningResult {
  termsWithMentions: number;
  aiCalls: number;
  articlesRead: number;
  candidatesSeen: number;
  promoted: number;
  quotaExhausted: boolean;
  errors: string[];
}

interface TermRow {
  id: string;
  term: string;
  aliases: string[] | null;
  mention_count: number | null;
  last_seen_at: string | null;
}

async function loadTerms(): Promise<TermRow[]> {
  if (!supabaseAdmin) throw new Error("Admin client not available");
  const out: TermRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabaseAdmin
      .from("dictionary_terms")
      .select("id, term, aliases, mention_count, last_seen_at")
      .eq("status", "published")
      .range(from, from + 999);
    if (error) throw new Error(`Failed to load terms: ${error.message}`);
    out.push(...(data as TermRow[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

async function loadRecentArticles(sinceDays: number, limit: number): Promise<ArticleText[]> {
  if (!supabaseAdmin) throw new Error("Admin client not available");
  const since = new Date(Date.now() - sinceDays * 86_400_000).toISOString();
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("id, source, title, summary, raw_summary, published_at")
    .is("duplicate_of", null)
    .gte("relevance_score", RELEVANCE_THRESHOLD)
    .gte("published_at", since)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Failed to load recent articles: ${error.message}`);
  return (data ?? []).map((a) => ({
    id: a.id as string,
    source: a.source as string,
    title: a.title as string,
    summary: ((a.summary as string | null) ?? (a.raw_summary as string | null)) ?? null,
    published_at: a.published_at as string,
  }));
}

export async function runDictionaryLearning(options: { maxAiCalls: number; deadlineAt: number }): Promise<LearningResult> {
  const result: LearningResult = { termsWithMentions: 0, aiCalls: 0, articlesRead: 0, candidatesSeen: 0, promoted: 0, quotaExhausted: false, errors: [] };
  if (!supabaseAdmin) return result;
  const now = new Date();

  try {
    const terms = await loadTerms();

    // 1. Mentions over the trending window.
    const weekAgo = new Date(now.getTime() - TRENDING_WINDOW_DAYS * 86_400_000).toISOString();
    const recent = (await loadRecentArticles(ARTICLE_LOOKBACK_DAYS, 800)).filter((a) => a.published_at >= weekAgo);
    const mentions = findMentions(
      terms.map((t) => ({ id: t.id, term: t.term, aliases: t.aliases ?? [] })),
      recent,
    );
    result.termsWithMentions = mentions.size;
    for (const t of terms) {
      const m = mentions.get(t.id);
      const count = m?.articleIds.length ?? 0;
      if ((t.mention_count ?? 0) === count && (count === 0 || t.last_seen_at === m?.lastSeenAt)) continue;
      const { error } = await supabaseAdmin
        .from("dictionary_terms")
        .update({ mention_count: count, ...(m ? { last_seen_at: m.lastSeenAt } : {}) })
        .eq("id", t.id);
      if (error) result.errors.push(`mentions ${t.term}: ${error.message}`);
    }

    // 2. Discovery of new vocabulary.
    if (options.maxAiCalls > 0 && Date.now() < options.deadlineAt - 30_000) {
      const since = new Date(now.getTime() - ARTICLE_LOOKBACK_DAYS * 86_400_000).toISOString();
      const { data: unread, error } = await supabaseAdmin
        .from("articles")
        .select("id, source, title, summary, raw_summary")
        .is("duplicate_of", null)
        .is("terms_extracted_at", null)
        .gte("relevance_score", RELEVANCE_THRESHOLD)
        .gte("published_at", since)
        .order("published_at", { ascending: false })
        .limit(EXTRACTION_BATCH);
      if (error) throw new Error(`Failed to load unread articles: ${error.message}`);

      if (unread && unread.length > 0) {
        const knownKeys = new Set<string>();
        for (const t of terms) {
          knownKeys.add(normalizeKey(t.term));
          for (const a of t.aliases ?? []) knownKeys.add(normalizeKey(a));
        }

        try {
          result.aiCalls++;
          const out = await getAIProvider().extractTerms({
            articles: unread.map((a, i) => ({ n: i + 1, title: a.title as string, summary: ((a.summary as string | null) ?? (a.raw_summary as string | null) ?? "") })),
            knownTerms: terms.map((t) => t.term).slice(0, 400),
            groups: DICTIONARY_GROUPS.map((g) => ({ id: g.id, label: g.label })),
          });

          for (const proposed of out.terms) {
            const name = cleanCandidateName(proposed.term);
            if (!name || isKnownTerm(name, knownKeys)) continue;
            const articleRows = proposed.articleNumbers.map((n) => unread[n - 1]).filter((r): r is NonNullable<typeof r> => !!r);
            if (articleRows.length === 0) continue;
            const slug = slugify(name);

            const { data: existingRow } = await supabaseAdmin.from("term_candidates").select("*").eq("slug", slug).maybeSingle();
            if (existingRow && existingRow.status !== "candidate") continue;
            const merged = mergeObservation(
              existingRow
                ? ({
                    term: existingRow.term,
                    slug,
                    mention_count: existingRow.mention_count,
                    source_names: existingRow.source_names ?? [],
                    article_ids: existingRow.article_ids ?? [],
                    first_seen_at: existingRow.first_seen_at,
                    last_seen_at: existingRow.last_seen_at,
                  } as CandidateState)
                : null,
              { term: name, definition: proposed.definition, articleIds: articleRows.map((r) => r.id as string), sources: articleRows.map((r) => r.source as string), seenAt: now.toISOString() },
            );
            const { error: upErr } = await supabaseAdmin.from("term_candidates").upsert(
              {
                term: merged.term,
                slug,
                definition: existingRow?.definition ?? proposed.definition,
                category_group: existingRow?.category_group ?? proposed.group,
                level: existingRow?.level ?? proposed.level,
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
          await supabaseAdmin.from("articles").update({ terms_extracted_at: now.toISOString() }).in("id", unread.map((a) => a.id as string));
          result.articlesRead = unread.length;
        } catch (err) {
          if (err instanceof GeminiKeysExhaustedError) result.quotaExhausted = true;
          result.errors.push(`extraction: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    // 3. Promotion of established candidates.
    const { data: candidates, error: candErr } = await supabaseAdmin.from("term_candidates").select("*").eq("status", "candidate");
    if (candErr) throw new Error(`Failed to load candidates: ${candErr.message}`);
    for (const c of candidates ?? []) {
      const state: CandidateState = {
        term: c.term,
        slug: c.slug,
        mention_count: c.mention_count,
        source_names: c.source_names ?? [],
        article_ids: c.article_ids ?? [],
        first_seen_at: c.first_seen_at,
        last_seen_at: c.last_seen_at,
        status: c.status,
      };
      if (!shouldPromote(state, now)) continue;

      const { error: insErr } = await supabaseAdmin.from("dictionary_terms").insert({
        term: c.term,
        definition: c.definition,
        slug: c.slug,
        category_group: c.category_group,
        level: c.level ?? "intermediate",
        // Seen repeatedly in relevant vibe-coding articles, so it belongs with the core vocabulary.
        tier: "core",
        aliases: [],
        related_terms: [],
        origin: "discovered",
        status: "published",
        classified: true,
        mention_count: c.mention_count,
        last_seen_at: c.last_seen_at,
        first_seen_at: now.toISOString(),
      });
      if (insErr) {
        // A unique clash means the term or slug exists by now: retire the candidate.
        await supabaseAdmin.from("term_candidates").update({ status: "rejected" }).eq("id", c.id);
        result.errors.push(`promotion ${c.term}: ${insErr.message}`);
        continue;
      }
      await supabaseAdmin.from("term_candidates").update({ status: "promoted", promoted_at: now.toISOString() }).eq("id", c.id);
      result.promoted++;
    }
    return result;
  } catch (err) {
    result.errors.push(err instanceof Error ? err.message : String(err));
    return result;
  }
}
