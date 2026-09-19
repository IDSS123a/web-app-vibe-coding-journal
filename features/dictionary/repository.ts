import { supabaseAdmin } from "@/lib/db/client";
import type { PublicDictionaryTerm } from "@/lib/validation/schemas";

const PUBLIC_COLUMNS =
  "id, term, slug, definition, category_group, level, tier, aliases, related_terms, origin, mention_count, last_seen_at, first_seen_at";

/**
 * Every published term, in the compact public shape. PostgREST returns at most 1,000 rows
 * per request, and the Dictionary now holds about 2,600, so this pages until it has them
 * all (a single select would silently truncate).
 */
export async function getAllTerms(): Promise<PublicDictionaryTerm[]> {
  if (!supabaseAdmin) throw new Error("Admin client not available");
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
  return out;
}

export async function addTerm(term: string, definition: string, sourceLessonId: string | null): Promise<void> {
  if (!supabaseAdmin) throw new Error("Admin client not available");
  // Idempotent on `term` (unique constraint, migration 014) -- a
  // duplicate term extracted from a later lesson is a no-op, not an
  // error, since onConflict below just re-upserts the same term.
  const { error } = await supabaseAdmin
    .from("dictionary_terms")
    .upsert({ term, definition, source_lesson_id: sourceLessonId }, { onConflict: "term" });
  if (error) throw new Error(`Failed to add dictionary term: ${error.message}`);
}
