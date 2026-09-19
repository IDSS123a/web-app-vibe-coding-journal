/**
 * Finishes the classification of imported dictionary terms in small, budgeted steps
 * (2026-09-19). The import stores every term at once; filing each under a topic group, a
 * level and a tier costs one AI call per 40 terms, and the free tier allows only about
 * 100 to 240 calls per day for the whole product. So the hourly backlog cycle calls this
 * with a few calls at a time until nothing is left, and the Dictionary improves in place.
 */
import { supabaseAdmin } from "@/lib/db/client";
import { getAIProvider } from "@/lib/ai/ai-provider";
import { GeminiKeysExhaustedError } from "@/lib/ai/gemini-provider";
import { DICTIONARY_GROUPS } from "./domain";

export const CLASSIFY_BATCH_SIZE = 40;

export interface ClassifyPendingResult {
  calls: number;
  classified: number;
  pendingBefore: number;
  quotaExhausted: boolean;
  errors: string[];
}

export async function countPendingTerms(): Promise<number> {
  if (!supabaseAdmin) throw new Error("Admin client not available");
  const { count, error } = await supabaseAdmin.from("dictionary_terms").select("*", { count: "exact", head: true }).eq("classified", false);
  if (error) throw new Error(`Failed to count unclassified terms: ${error.message}`);
  return count ?? 0;
}

export async function classifyPendingTerms(options: { maxCalls: number; deadlineAt: number }): Promise<ClassifyPendingResult> {
  const result: ClassifyPendingResult = { calls: 0, classified: 0, pendingBefore: 0, quotaExhausted: false, errors: [] };
  if (!supabaseAdmin || options.maxCalls <= 0) return result;

  result.pendingBefore = await countPendingTerms();
  const ai = getAIProvider();

  while (result.calls < options.maxCalls && Date.now() < options.deadlineAt - 20_000) {
    const { data, error } = await supabaseAdmin
      .from("dictionary_terms")
      .select("id, term, definition, section_hint")
      .eq("classified", false)
      .order("created_at", { ascending: true })
      .limit(CLASSIFY_BATCH_SIZE);
    if (error) {
      result.errors.push(error.message);
      break;
    }
    if (!data || data.length === 0) break;

    try {
      result.calls++;
      const out = await ai.classifyTerms({
        terms: data.map((t, i) => ({ n: i + 1, term: t.term as string, definition: t.definition as string, hint: (t.section_hint as string | null) ?? undefined })),
        groups: DICTIONARY_GROUPS.map((g) => ({ id: g.id, label: g.label })),
      });
      for (const item of out.items) {
        const row = data[item.n - 1];
        if (!row) continue;
        const { error: upErr } = await supabaseAdmin
          .from("dictionary_terms")
          .update({ category_group: item.group, level: item.level, tier: item.tier, classified: true })
          .eq("id", row.id as string);
        if (upErr) result.errors.push(`${row.term}: ${upErr.message}`);
        else result.classified++;
      }
      // Rows the model skipped stay classified = false. They are moved to the back of the queue
      // (created_at is the queue order) so a term the model keeps skipping cannot block the rest.
      const done = new Set(out.items.map((i) => i.n));
      const skippedIds = data.filter((_, i) => !done.has(i + 1)).map((r) => r.id as string);
      if (skippedIds.length > 0) {
        await supabaseAdmin.from("dictionary_terms").update({ created_at: new Date().toISOString() }).in("id", skippedIds);
      }
      if (out.items.length === 0) break;
    } catch (err) {
      if (err instanceof GeminiKeysExhaustedError) result.quotaExhausted = true;
      result.errors.push(err instanceof Error ? err.message : String(err));
      break;
    }
  }
  return result;
}
