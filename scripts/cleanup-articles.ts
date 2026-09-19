/**
 * Removes off-topic content from the stored articles and digests, keeping what is useful
 * for vibe-coding (Director's instruction, 2026-09-19; PDL-059). Dry run by default.
 *
 *   npx tsx --env-file=.env.local scripts/cleanup-articles.ts            (counts only)
 *   npx tsx --env-file=.env.local scripts/cleanup-articles.ts --apply    (backup, then delete)
 *
 * What it does, in order:
 *   1. BACKUP: with --apply, every row of articles, daily_reports and daily_report_articles is
 *      written as JSON to C:/DAVOR_PRIVATE/AI/backups/vcj-cleanup-<time>/ (outside the
 *      repository) BEFORE anything is changed. Restoring is a plain re-insert of those files.
 *   2. Off-topic articles: articles whose relevance score is BELOW the P-0 threshold (60) are
 *      deleted, leaving a tombstone (rejected_articles: hash only) so the collector does not
 *      fetch and re-judge the same item again. Articles that are unscored are never touched,
 *      and neither are articles in a published report or bookmarked by a user.
 *   3. Reports: an entry whose article was removed is cut out of each report's markdown; the
 *      report's count and reading time follow. A report left with no entries is deleted.
 *      The two 900+ article reports of 2026-09-08/09 (never linked to articles, pre-fix
 *      garbage) are deleted outright. Published reports (auto_published, manually_approved)
 *      are never modified.
 * Safe to run repeatedly.
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { stripAiTells } from "../lib/text/no-ai-tells";

const APPLY = process.argv.includes("--apply");
const RELEVANCE_THRESHOLD = 60;
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

async function all<T = Record<string, unknown>>(table: string, cols = "*"): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from(table).select(cols).range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

const norm = (t: string) => stripAiTells(t).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function splitEntries(markdown: string): string[] {
  return markdown.split(/\n(?=## )/g).filter((e) => e.trim());
}
const entryTitle = (entry: string) => (entry.match(/^## (.+)$/m)?.[1] ?? "").trim();

async function main() {
  const articles = await all<{ id: string; title: string; hash: string; url: string; source: string; relevance_score: number | null }>("articles");
  const reports = await all<{ id: string; date: string; markdown: string; review_status: string; article_count: number }>("daily_reports");
  const links = await all<{ report_id: string; article_id: string }>("daily_report_articles");
  const bookmarks = await all<{ article_id: string }>("bookmarks", "article_id");

  const scored = articles.filter((a) => a.relevance_score !== null);
  const off = scored.filter((a) => (a.relevance_score as number) < RELEVANCE_THRESHOLD);
  const publishedReportIds = new Set(reports.filter((r) => r.review_status === "auto_published" || r.review_status === "manually_approved").map((r) => r.id));
  const protectedIds = new Set([...links.filter((l) => publishedReportIds.has(l.report_id)).map((l) => l.article_id), ...bookmarks.map((b) => b.article_id)]);
  const toDelete = off.filter((a) => !protectedIds.has(a.id));

  console.log(`articles ${articles.length}: scored ${scored.length}, unscored ${articles.length - scored.length} (left alone), relevant ${scored.length - off.length}, off topic ${off.length}`);
  console.log(`  off topic and protected (published report or bookmark): ${off.length - toDelete.length}; to delete: ${toDelete.length}`);

  // Reports
  const removedTitles = new Set(toDelete.map((a) => norm(a.title)));
  const linkedReportIds = new Set(links.map((l) => l.report_id));
  const plans: Array<{ report: (typeof reports)[number]; keep: string[]; dropped: number; deleteWhole: boolean; why: string }> = [];
  for (const r of reports) {
    if (publishedReportIds.has(r.id)) continue;
    const entries = splitEntries(r.markdown);
    const isGiant = r.article_count > 200 && !linkedReportIds.has(r.id);
    const keep = entries.filter((e) => !removedTitles.has(norm(entryTitle(e))));
    const dropped = entries.length - keep.length;
    if (isGiant) plans.push({ report: r, keep: [], dropped: entries.length, deleteWhole: true, why: "900+ article pile, never linked" });
    else if (entries.length > 0 && keep.length === 0) plans.push({ report: r, keep, dropped, deleteWhole: true, why: "nothing left after cleaning" });
    else if (dropped > 0) plans.push({ report: r, keep, dropped, deleteWhole: false, why: "entries cut" });
  }
  const wholeDeletes = plans.filter((p) => p.deleteWhole);
  const cuts = plans.filter((p) => !p.deleteWhole);
  console.log(`reports ${reports.length} (published ${publishedReportIds.size}): delete whole ${wholeDeletes.length}, cut entries in ${cuts.length} (${cuts.reduce((n, p) => n + p.dropped, 0)} entries)`);
  for (const p of wholeDeletes.slice(0, 8)) console.log(`   delete ${p.report.date} ${p.report.review_status} (${p.why})`);

  if (!APPLY) {
    console.log("\ndry run, nothing changed. Re-run with --apply to back up and delete.");
    return;
  }

  // 1. Backup first.
  const dir = path.join("C:/DAVOR_PRIVATE/AI/backups", `vcj-cleanup-${new Date().toISOString().replace(/[:.]/g, "-")}`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "articles.json"), JSON.stringify(await all("articles")));
  fs.writeFileSync(path.join(dir, "daily_reports.json"), JSON.stringify(await all("daily_reports")));
  fs.writeFileSync(path.join(dir, "daily_report_articles.json"), JSON.stringify(await all("daily_report_articles")));
  console.log(`backup written to ${dir}`);

  // 2. Tombstones, then delete the articles.
  for (let i = 0; i < toDelete.length; i += 200) {
    const slice = toDelete.slice(i, i + 200);
    const { error: tErr } = await sb.from("rejected_articles").upsert(
      slice.map((a) => ({ hash: a.hash, url: a.url, title: a.title, source: a.source, relevance_score: a.relevance_score, reason: "off_topic" })),
      { onConflict: "hash", ignoreDuplicates: true },
    );
    if (tErr) throw new Error(`tombstones: ${tErr.message}`);
    const { error: dErr } = await sb.from("articles").delete().in("id", slice.map((a) => a.id));
    if (dErr) throw new Error(`delete articles: ${dErr.message}`);
  }
  console.log(`deleted ${toDelete.length} off-topic articles (tombstoned)`);

  // 3. Reports.
  for (const p of wholeDeletes) {
    const { error } = await sb.from("daily_reports").delete().eq("id", p.report.id);
    if (error) throw new Error(`delete report ${p.report.date}: ${error.message}`);
  }
  for (const p of cuts) {
    const { error } = await sb
      .from("daily_reports")
      .update({ markdown: p.keep.join("\n\n"), article_count: p.keep.length, reading_time_minutes: Math.ceil(p.keep.length * 2) })
      .eq("id", p.report.id);
    if (error) throw new Error(`update report ${p.report.date}: ${error.message}`);
  }
  console.log(`reports: ${wholeDeletes.length} deleted, ${cuts.length} cleaned`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
