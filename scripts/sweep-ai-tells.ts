/**
 * One-off and re-runnable sweep of stored content for AI tells (em dash above all).
 * Writing rule of 2026-09-19, see lib/text/no-ai-tells.ts. Safe to run any time:
 * it only rewrites strings that still contain a tell, and reports counts first.
 *
 *   npx tsx --env-file=.env.local scripts/sweep-ai-tells.ts          (dry run)
 *   npx tsx --env-file=.env.local scripts/sweep-ai-tells.ts --apply  (write)
 *
 * Columns that carry identifiers (id, url, hash, slug, *_id, created/updated stamps) are
 * never touched.
 */
import { createClient } from "@supabase/supabase-js";
import { stripAiTellsDeep } from "../lib/text/no-ai-tells";

const APPLY = process.argv.includes("--apply");
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

const TABLES = [
  "articles", "daily_reports", "lessons", "chapters", "quiz_questions", "level_test_questions",
  "courses", "dictionary_terms", "prompt_blueprint_generations", "sources", "term_candidates",
  "ps_chapters", "ps_lessons", "ps_exercises",
];
const SKIP_COLUMN = /^(id|url|hash|slug|source_url|.*_id|.*_at|date|report_date|duplicate_of|review_status|status|role)$/;

async function main() {
  let totalRows = 0;
  for (const table of TABLES) {
    const rows: Record<string, unknown>[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await sb.from(table).select("*").range(from, from + 999);
      if (error) {
        if (/does not exist|schema cache|relation/.test(error.message)) break; // table not created yet
        throw new Error(`${table}: ${error.message}`);
      }
      rows.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }
    let changedRows = 0;
    const perColumn: Record<string, number> = {};
    for (const row of rows) {
      const patch: Record<string, unknown> = {};
      for (const [col, value] of Object.entries(row)) {
        if (SKIP_COLUMN.test(col) || value == null) continue;
        const cleaned = stripAiTellsDeep(value);
        if (JSON.stringify(cleaned) !== JSON.stringify(value)) {
          patch[col] = cleaned;
          perColumn[col] = (perColumn[col] ?? 0) + 1;
        }
      }
      if (Object.keys(patch).length === 0) continue;
      changedRows++;
      if (APPLY) {
        const { error } = await sb.from(table).update(patch).eq("id", row.id as string);
        if (error) throw new Error(`${table} ${String(row.id)}: ${error.message}`);
      }
    }
    totalRows += changedRows;
    console.log(`${table.padEnd(30)} rows ${String(rows.length).padStart(5)}  with tells ${String(changedRows).padStart(5)}  ${JSON.stringify(perColumn)}`);
  }
  console.log(`\n${APPLY ? "Rewrote" : "Would rewrite"} ${totalRows} row(s).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
