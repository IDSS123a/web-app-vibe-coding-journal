import { supabaseAdmin } from "@/lib/db/client";
import type { DictionaryTerm } from "@/lib/validation/schemas";

export async function getAllTerms(): Promise<DictionaryTerm[]> {
  if (!supabaseAdmin) throw new Error("Admin client not available");
  const { data, error } = await supabaseAdmin
    .from("dictionary_terms")
    .select("*")
    .order("term", { ascending: true });
  if (error) throw new Error(`Failed to fetch dictionary terms: ${error.message}`);
  return data as DictionaryTerm[];
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
