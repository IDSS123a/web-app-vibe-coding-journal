import { supabaseAdmin } from "@/lib/db/client";
import type { PublicDictionaryTerm } from "@/lib/validation/schemas";
import { slugify } from "./domain";

const PUBLIC_COLUMNS =
  "id, term, slug, definition, category_group, level, tier, aliases, related_terms, origin, mention_count, last_seen_at, first_seen_at";

/**
 * Every published term, in the compact public shape. PostgREST returns at most 1,000 rows
 * per request, and the Dictionary now holds about 2,600, so this pages until it has them
 * all (a single select would silently truncate).
 */
// The list is identical for every reader and changes only when the hourly cycle files or
// discovers terms, so a warm server instance keeps it for a few minutes instead of running
// three paged queries (about 2,600 rows) on every request.
const CACHE_TTL_MS = 5 * 60 * 1000;
let cached: { at: number; terms: PublicDictionaryTerm[] } | null = null;

export async function getAllTerms(): Promise<PublicDictionaryTerm[]> {
  if (!supabaseAdmin) throw new Error("Admin client not available");
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.terms;
  const out: PublicDictionaryTerm[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabaseAdmin
      .from("dictionary_terms")
      .select(PUBLIC_COLUMNS)
      .eq("status", "published")
      .order("term", { ascending: true })
      .range(from, from + 999);
    if (error) throw new Error(`Failed to fetch dictionary terms: ${error.message}`);
    out.push(...(data as unknown as PublicDictionaryTerm[]));
    if (!data || data.length < 1000) break;
  }
  cached = { at: Date.now(), terms: out };
  return out;
}

/**
 * A slug that does not already belong to a different term (`dictionary_terms.slug` carries no database-level unique
 * constraint, unlike `term_candidates.slug`, so this is the only thing stopping two different terms from sharing one).
 */
async function uniqueSlug(term: string): Promise<string> {
  if (!supabaseAdmin) throw new Error("Admin client not available");
  const base = slugify(term);
  for (let suffix = 0; ; suffix++) {
    const candidate = suffix === 0 ? base : `${base}-${suffix + 1}`;
    const { data } = await supabaseAdmin.from("dictionary_terms").select("term").eq("slug", candidate).neq("term", term).maybeSingle();
    if (!data) return candidate;
  }
}

/**
 * Adds a term proposed by a University lesson, at the moment an admin approves that lesson (2026-09-22, PDL-086: found live,
 * two published terms with no slug, no topic, no level -- this function used to insert only `term`, `definition` and
 * `source_lesson_id`, missing everything `dictionary_terms` and the public Dictionary page actually need). The row is
 * inserted complete except for its topic, level and tier, marked `classified: false` exactly like a freshly discovered or
 * imported term, so the existing hourly classification step (`classifyPendingTerms`) fills those in within the hour, the
 * same path every other term takes; nothing new to build.
 * Idempotent on `term` (unique constraint, migration 014): a duplicate term extracted from a later lesson is a no-op.
 */
export async function addTerm(term: string, definition: string, sourceLessonId: string | null): Promise<void> {
  if (!supabaseAdmin) throw new Error("Admin client not available");
  const { data: existing } = await supabaseAdmin.from("dictionary_terms").select("id").eq("term", term).maybeSingle();
  if (existing) return; // Idempotent: the term is already here, whatever state it is in.

  const { error } = await supabaseAdmin.from("dictionary_terms").upsert(
    {
      term,
      definition,
      slug: await uniqueSlug(term),
      source_lesson_id: sourceLessonId,
      aliases: [],
      related_terms: [],
      origin: "lesson",
      status: "published",
      classified: false,
      mention_count: 1,
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "term" },
  );
  if (error) throw new Error(`Failed to add dictionary term: ${error.message}`);
}
