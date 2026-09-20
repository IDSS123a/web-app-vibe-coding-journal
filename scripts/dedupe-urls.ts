/**
 * Marks articles that repeat another article's URL as duplicates (duplicate_of), never deleting anything.
 * Found by the data integrity pass, 2026-09-20: the article hash includes the title, so one story fetched under
 * two titles was stored twice. The pipeline already ignores rows with duplicate_of set.
 *
 *   npx tsx --env-file=.env.local scripts/dedupe-urls.ts           (dry run, prints what it would do)
 *   npx tsx --env-file=.env.local scripts/dedupe-urls.ts --apply   (writes duplicate_of)
 *
 * The canonical row of a group is the one already used in a report or a bookmark, else the one already scored,
 * else the oldest. A row that is itself in a report or a bookmark is never marked, so published reports and
 * readers' bookmarks are untouched. Reversible: `update articles set duplicate_of = null where id in (...)`.
 */
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

interface Row { id: string; url: string; created_at: string; relevance_score: number | null; duplicate_of: string | null; title: string; source: string }

async function all<T>(table: string, columns: string): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from(table).select(columns).range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

async function main() {
  const articles = await all<Row>("articles", "id, url, created_at, relevance_score, duplicate_of, title, source");
  const inReport = new Set((await all<{ article_id: string }>("daily_report_articles", "article_id")).map((r) => r.article_id));
  const bookmarked = new Set((await all<{ article_id: string }>("bookmarks", "article_id")).map((r) => r.article_id));
  const protectedIds = new Set([...inReport, ...bookmarked]);

  const byUrl = new Map<string, Row[]>();
  for (const a of articles.filter((x) => x.duplicate_of === null)) (byUrl.get(a.url) ?? byUrl.set(a.url, []).get(a.url)!).push(a);

  let groups = 0;
  let marked = 0;
  let kept = 0;
  for (const rows of byUrl.values()) {
    if (rows.length < 2) continue;
    groups++;
    const rank = (r: Row) => [protectedIds.has(r.id) ? 0 : 1, r.relevance_score !== null ? 0 : 1, r.created_at] as const;
    const sorted = [...rows].sort((a, b) => {
      const ra = rank(a);
      const rb = rank(b);
      return ra[0] - rb[0] || ra[1] - rb[1] || (ra[2] < rb[2] ? -1 : ra[2] > rb[2] ? 1 : 0);
    });
    const canonical = sorted[0]!;
    for (const r of sorted.slice(1)) {
      if (protectedIds.has(r.id)) {
        kept++;
        console.log(`KEEP  ${r.id.slice(0, 8)} is itself in a report or bookmark (${r.source}: ${r.title.slice(0, 50)})`);
        continue;
      }
      marked++;
      console.log(`${APPLY ? "MARK " : "would"} ${r.id.slice(0, 8)} duplicate_of ${canonical.id.slice(0, 8)}  (${r.source}: ${r.title.slice(0, 50)})`);
      if (APPLY) {
        const { error } = await sb.from("articles").update({ duplicate_of: canonical.id }).eq("id", r.id);
        if (error) throw new Error(error.message);
      }
    }
  }
  console.log(`\n${groups} groups with a repeated URL, ${marked} rows ${APPLY ? "marked" : "to mark"}, ${kept} kept because a report or bookmark uses them.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
