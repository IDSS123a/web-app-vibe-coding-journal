/**
 * Rebuilds historical Daily Reports from the relevant, summarised articles that never
 * appeared in any report, so the Archive is populated from the knowledge base that was
 * already built (Director, 2026-09-19: "we must use the existing base of information").
 * Dry run by default.
 *
 *   npx tsx --env-file=.env.local scripts/rebuild-archive.ts            (counts only)
 *   npx tsx --env-file=.env.local scripts/rebuild-archive.ts --apply
 *
 * One report per publication date that has at least MIN_ARTICLES qualifying articles and
 * no report yet. Qualifying: relevant (P-0 score 60 or more), confidence above zero, an
 * editorial summary, not a duplicate, and not already linked to a report. Each rebuilt
 * report goes through the same hold gate as a live one (evaluateReportHold), so a hype word
 * in published text still holds it for review. Existing reports are never overwritten.
 */
import { createClient } from "@supabase/supabase-js";
import { formatDigestEntry } from "../features/daily-report/format";
import { evaluateReportHold } from "../features/pipeline/quality-engine";
import { stripAiTells } from "../lib/text/no-ai-tells";
import type { Article } from "../lib/validation/schemas";

const APPLY = process.argv.includes("--apply");
const MIN_ARTICLES = 3;
const MAX_ARTICLES = 20;
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

async function all<T>(table: string, cols: string, filter?: (q: any) => any): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    let q: any = sb.from(table).select(cols).range(from, from + 999);
    if (filter) q = filter(q);
    const { data, error } = await q;
    if (error) throw new Error(`${table}: ${error.message}`);
    out.push(...(data as T[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

async function main() {
  const articles = await all<Article>("articles", "*", (q) => q.is("duplicate_of", null).gte("relevance_score", 60).gt("confidence_score", 0).not("summary", "is", null));
  const linked = new Set((await all<{ article_id: string }>("daily_report_articles", "article_id")).map((l) => l.article_id));
  const existingDates = new Set((await all<{ date: string }>("daily_reports", "date")).map((r) => r.date));

  const byDay = new Map<string, Article[]>();
  for (const a of articles) {
    if (linked.has(a.id)) continue;
    const day = a.published_at.slice(0, 10);
    if (existingDates.has(day)) continue;
    byDay.set(day, [...(byDay.get(day) ?? []), a]);
  }
  const days = [...byDay.entries()].filter(([, list]) => list.length >= MIN_ARTICLES).sort(([a], [b]) => (a < b ? 1 : -1));
  console.log(`qualifying articles ${[...byDay.values()].reduce((n, l) => n + l.length, 0)} on ${byDay.size} dates without a report; dates with at least ${MIN_ARTICLES}: ${days.length}`);

  let published = 0;
  let held = 0;
  for (const [day, list] of days) {
    const picked = [...list].sort((x, y) => (y.relevance_score ?? 0) - (x.relevance_score ?? 0)).slice(0, MAX_ARTICLES);
    const hold = evaluateReportHold(picked);
    const status = hold.hold ? "held_for_review" : "auto_published";
    if (status === "auto_published") published++;
    else held++;
    console.log(`  ${day}: ${picked.length} articles -> ${status}${hold.hold ? " (" + hold.reasons.join("; ") + ")" : ""}`);
    if (!APPLY) continue;

    const markdown = stripAiTells(picked.map((a) => formatDigestEntry(a, [])).join("\n\n"));
    const { data: report, error } = await sb
      .from("daily_reports")
      .insert({ date: day, markdown, article_count: picked.length, reading_time_minutes: Math.ceil(picked.length * 2), sections: ["Summary", "Articles"], review_status: status })
      .select("id")
      .single();
    if (error) throw new Error(`insert report ${day}: ${error.message}`);
    const { error: linkErr } = await sb.from("daily_report_articles").insert(picked.map((a) => ({ report_id: report.id, article_id: a.id })));
    if (linkErr) throw new Error(`link ${day}: ${linkErr.message}`);
  }
  console.log(`${APPLY ? "created" : "would create"} ${days.length} reports: ${published} auto-published, ${held} held for review`);
  if (!APPLY) console.log("dry run, nothing written. Re-run with --apply.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
