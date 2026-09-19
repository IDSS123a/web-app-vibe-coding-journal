/**
 * Imports the two supplied dictionary documents into dictionary_terms
 * (specs/knowledge-growth-and-dictionary/, 2026-09-19).
 *
 *   npx tsx --env-file=.env.local scripts/import-dictionary.ts <docA.md> <docB.md> [--max-calls=N] [--dry-run]
 *
 * Steps: parse both documents, merge duplicates, compute related terms without AI, then
 * upsert EVERY term. Safe to run repeatedly:
 *   - a term already classified (the local cache .dictionary-import-cache.json, or an
 *     earlier --max-calls run) is stored filed under its topic group, level and tier;
 *   - every other term is stored with classified = false and its section as a hint, and the
 *     hourly backlog cycle files it later (features/dictionary/classify-pending.ts), a few
 *     calls at a time, because the free AI tier allows only about 100 to 240 requests a day
 *     for the whole product (PDL-058);
 *   - --max-calls=N classifies up to N batches of 80 from here first (the hourly classifier uses 40) (default 0);
 *   - existing terms keep their approved definition, they only gain facets and aliases.
 */
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { ensureAIProviderInitialized } from "../lib/ai/init";
import { getAIProvider } from "../lib/ai/ai-provider";
import { stripAiTells } from "../lib/text/no-ai-tells";
import {
  DICTIONARY_GROUPS,
  computeRelatedTerms,
  mergeImportedTerms,
  normalizeKey,
  slugify,
  type DictionaryLevel,
  type DictionaryTier,
} from "../features/dictionary/domain";
import { parseBookA, parseBookB } from "../features/dictionary/import";

const [docA, docB] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const maxCalls = Number((process.argv.find((a) => a.startsWith("--max-calls=")) ?? "--max-calls=0").split("=")[1]);
const dryRun = process.argv.includes("--dry-run");
const CACHE_FILE = ".dictionary-import-cache.json";
const BATCH = 80;

type Facets = { group: string; level: DictionaryLevel; tier: DictionaryTier };

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

async function main() {
  if (!docA || !docB) throw new Error("usage: import-dictionary.ts <docA.md> <docB.md> [--max-calls=N] [--dry-run]");
  const a = parseBookA(fs.readFileSync(docA, "utf8"));
  const b = parseBookB(fs.readFileSync(docB, "utf8"));
  const merged = mergeImportedTerms(a, b);
  console.log(`parsed A ${a.length}, B ${b.length}; unique ${merged.terms.length}; overlap ${merged.overlap}; repeats inside A ${merged.duplicatesInA}, inside B ${merged.duplicatesInB}`);

  const cache: Record<string, Facets> = fs.existsSync(CACHE_FILE) ? JSON.parse(fs.readFileSync(CACHE_FILE, "utf8")) : {};
  const todo = merged.terms.filter((t) => !cache[normalizeKey(t.term)]);
  console.log(`already classified ${merged.terms.length - todo.length}, to classify ${todo.length} (${Math.ceil(todo.length / BATCH)} call(s), cap ${maxCalls})`);

  ensureAIProviderInitialized();
  const ai = getAIProvider();
  let calls = 0;
  for (let i = 0; i < todo.length && calls < maxCalls; i += BATCH) {
    const slice = todo.slice(i, i + BATCH);
    try {
      calls++;
      const out = await ai.classifyTerms({
        terms: slice.map((t, idx) => ({ n: idx + 1, term: t.term, definition: t.definition, hint: t.section })),
        groups: DICTIONARY_GROUPS.map((g) => ({ id: g.id, label: g.label })),
      });
      for (const item of out.items) {
        const t = slice[item.n - 1];
        if (t) cache[normalizeKey(t.term)] = { group: item.group, level: item.level, tier: item.tier };
      }
      fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
      console.log(`  call ${calls}: ${out.items.length}/${slice.length} classified (cache ${Object.keys(cache).length})`);
    } catch (e) {
      console.log(`  call ${calls} failed: ${e instanceof Error ? e.message : String(e)}`);
      if (String(e).includes("keys") && String(e).includes("failed")) break; // quota gone everywhere
    }
  }

  const ready = merged.terms; // everything is imported; unclassified terms are finished by the hourly cycle
  const classifiedCount = ready.filter((t) => cache[normalizeKey(t.term)]).length;
  console.log(`importing ${ready.length} terms: ${classifiedCount} already classified, ${ready.length - classifiedCount} left for the hourly classifier`);

  // Related terms, no AI: computed over everything ready.
  const related = computeRelatedTerms(ready.map((t) => ({ term: t.term, definition: t.definition })));

  // Existing rows (the 13 from lessons): keep their definition, add facets.
  const { data: existing, error } = await sb.from("dictionary_terms").select("id, term, definition, slug, origin, aliases");
  if (error) throw error;
  const existingByKey = new Map((existing ?? []).map((r) => [normalizeKey(r.term as string), r]));
  const usedSlugs = new Set((existing ?? []).map((r) => r.slug).filter(Boolean) as string[]);

  const rows = ready.map((t) => {
    const f = cache[normalizeKey(t.term)];
    const prior = existingByKey.get(normalizeKey(t.term));
    let slug = (prior?.slug as string | null) ?? slugify(t.term);
    if (!prior?.slug) {
      let n = 2;
      const base = slug;
      while (usedSlugs.has(slug)) slug = `${base}-${n++}`;
      usedSlugs.add(slug);
    }
    return {
      term: (prior?.term as string) ?? t.term,
      // An approved definition already in the database wins; new terms get the imported one.
      definition: (prior?.definition as string) ?? t.definition,
      slug,
      category_group: f?.group ?? null,
      level: f?.level ?? null,
      tier: f?.tier ?? null,
      classified: !!f,
      section_hint: stripAiTells(t.section),
      aliases: [...new Set([...((prior?.aliases as string[]) ?? []), ...t.aliases.map((x) => stripAiTells(x))])],
      related_terms: related.get(t.term) ?? [],
      origin: (prior?.origin as string) ?? t.origin,
      status: "published",
    };
  });

  const byTier: Record<string, number> = {};
  const byGroup: Record<string, number> = {};
  const byLevel: Record<string, number> = {};
  for (const r of rows.filter((x) => x.classified)) {
    byTier[r.tier!] = (byTier[r.tier!] ?? 0) + 1;
    byGroup[r.category_group!] = (byGroup[r.category_group!] ?? 0) + 1;
    byLevel[r.level!] = (byLevel[r.level!] ?? 0) + 1;
  }
  console.log("by tier", JSON.stringify(byTier), "\nby level", JSON.stringify(byLevel), "\nby group", JSON.stringify(byGroup));

  if (dryRun) {
    console.log("dry run, nothing written");
    return;
  }
  for (let i = 0; i < rows.length; i += 200) {
    const { error: upErr } = await sb.from("dictionary_terms").upsert(rows.slice(i, i + 200), { onConflict: "term" });
    if (upErr) throw new Error(`upsert failed at ${i}: ${upErr.message}`);
  }
  const { count } = await sb.from("dictionary_terms").select("*", { count: "exact", head: true });
  console.log(`dictionary_terms now holds ${count} rows`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
