/**
 * Data integrity pass over the production database (stress test, re-runnable, read only).
 *
 *   npm run check:integrity
 *
 * Reports every invariant that must always hold, and fails (exit 1) when one is broken. It never writes.
 * Sections: articles and reports (the daily pipeline), the Dictionary, the University, and the Prompt School
 * (stored content equals the authored content files, every stored exercise is well formed, order is contiguous).
 */
import { createClient } from "@supabase/supabase-js";
import { RELEVANCE_THRESHOLD } from "../features/pipeline/quality-engine";
import { AUTHORED_CHAPTERS } from "../features/prompt-school/content";
import { PROMPT_SCHOOL_OUTLINE } from "../features/prompt-school/content/outline";
import { validateExerciseContent, type ExerciseContent } from "../features/prompt-school/domain";
import { hasAiTells } from "../lib/text/no-ai-tells";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
}

async function all<T = Record<string, unknown>>(table: string, columns = "*"): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from(table).select(columns).range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

const dupes = (values: Array<string | null | undefined>) => {
  const seen = new Set<string>();
  const dup = new Set<string>();
  for (const v of values) {
    if (v == null) continue;
    if (seen.has(v)) dup.add(v);
    seen.add(v);
  }
  return [...dup];
};

async function main() {
  // ---------- articles and reports ----------
  const articles = await all<{ id: string; hash: string | null; url: string; duplicate_of: string | null; relevance_score: number | null; summary: string | null }>(
    "articles",
    "id, hash, url, duplicate_of, relevance_score, summary",
  );
  const ids = new Set(articles.map((a) => a.id));
  check("no duplicate article hashes", dupes(articles.map((a) => a.hash)).length === 0);
  {
    // One URL, one live article. A repeat is tolerated only when a report or a bookmark already uses it
    // (published reports and readers' bookmarks are never rewritten), see scripts/dedupe-urls.ts.
    const used = new Set([
      ...(await all<{ article_id: string }>("daily_report_articles", "article_id")).map((r) => r.article_id),
      ...(await all<{ article_id: string }>("bookmarks", "article_id")).map((r) => r.article_id),
    ]);
    const live = new Map<string, string[]>();
    for (const a of articles.filter((x) => x.duplicate_of === null)) (live.get(a.url) ?? live.set(a.url, []).get(a.url)!).push(a.id);
    const bad = [...live.values()].filter((g) => g.filter((id) => !used.has(id)).length > 1);
    check("no repeated article URL among live articles (except ones a report or bookmark already uses)", bad.length === 0, `${bad.length} groups`);
  }
  check("duplicate_of always points to an existing article", articles.every((a) => !a.duplicate_of || ids.has(a.duplicate_of)));
  const unscored = articles.filter((a) => a.relevance_score === null).length;
  console.log(`INFO  articles ${articles.length}, not yet scored for relevance ${unscored}`);

  const reports = await all<{ id: string; date: string; article_count: number | null; review_status: string }>("daily_reports", "id, date, article_count, review_status");
  const links = await all<{ report_id: string; article_id: string }>("daily_report_articles", "report_id, article_id");
  check("no duplicate report dates", dupes(reports.map((r) => r.date)).length === 0);
  check("every report link points to an existing article and report", links.every((l) => ids.has(l.article_id)) && links.every((l) => reports.some((r) => r.id === l.report_id)));
  const byId = new Map(articles.map((a) => [a.id, a]));
  const published = reports.filter((r) => ["auto_published", "manually_approved"].includes(r.review_status));
  let countOk = true;
  let contentOk = true;
  for (const r of published) {
    const linked = links.filter((l) => l.report_id === r.id);
    if (linked.length > 0 && r.article_count !== null && r.article_count !== linked.length) countOk = false;
    for (const l of linked) {
      const a = byId.get(l.article_id);
      if (!a || !a.summary || (a.relevance_score ?? 0) < RELEVANCE_THRESHOLD) contentOk = false;
    }
  }
  check("a published report's article_count equals its linked articles", countOk);
  check("every article in a published report is relevant and summarised", contentOk);
  check("no dash tells in stored report text", !(await all<{ markdown: string }>("daily_reports", "markdown")).some((r) => hasAiTells(r.markdown ?? "")));

  // ---------- dictionary ----------
  const terms = await all<{ slug: string; term: string; classified: boolean }>("dictionary_terms", "slug, term, classified");
  check("no duplicate dictionary slugs", dupes(terms.map((t) => t.slug)).length === 0);
  check("every dictionary term has a slug and a name", terms.every((t) => t.slug && t.term));
  console.log(`INFO  dictionary ${terms.length} terms, waiting to be filed ${terms.filter((t) => !t.classified).length}`);

  // ---------- university ----------
  const lessons = await all<{ course_id: string; slug: string; status: string; chapter_id: string | null; is_core: boolean }>("lessons", "course_id, slug, status, chapter_id, is_core");
  check("no duplicate lesson slugs within a course", dupes(lessons.map((l) => `${l.course_id}/${l.slug}`)).length === 0);
  check("every core lesson belongs to a chapter", lessons.filter((l) => l.is_core).every((l) => l.chapter_id));

  // ---------- prompt school ----------
  const chapters = await all<{ id: string; slug: string; order_index: number; level: string; published: boolean }>("ps_chapters");
  const psLessons = await all<{ chapter_id: string; slug: string; order_index: number; body: string; title: string; published: boolean }>("ps_lessons");
  const psExercises = await all<{ chapter_id: string; slug: string; order_index: number; kind: string; title: string; prompt_text: string; public: unknown; answer: unknown; explanation: string }>("ps_exercises");
  const outlineIndex = new Map(PROMPT_SCHOOL_OUTLINE.map((c, i) => [c.slug, i + 1]));

  check("every stored chapter is in the outline, at the outline's position", chapters.every((c) => outlineIndex.get(c.slug) === c.order_index));
  check("every stored chapter has the level the outline gives it", chapters.every((c) => PROMPT_SCHOOL_OUTLINE.find((o) => o.slug === c.slug)?.level === c.level));
  check("a chapter is available in the outline exactly when it is stored and published", PROMPT_SCHOOL_OUTLINE.every((o) => o.available === chapters.some((c) => c.slug === o.slug && c.published)));

  for (const authored of AUTHORED_CHAPTERS) {
    const ch = chapters.find((c) => c.slug === authored.slug);
    check(`${authored.slug}: stored`, Boolean(ch));
    if (!ch) continue;
    const ls = psLessons.filter((l) => l.chapter_id === ch.id).sort((a, b) => a.order_index - b.order_index);
    check(`${authored.slug}: lessons equal the content files, in order`, JSON.stringify(ls.map((l) => l.slug)) === JSON.stringify(authored.lessons.map((l) => l.slug)));
    check(`${authored.slug}: lesson order is 1..n`, ls.every((l, i) => l.order_index === i + 1));
    check(`${authored.slug}: lesson text equals the content files`, ls.every((l, i) => l.body === authored.lessons[i]!.body && l.title === authored.lessons[i]!.title));
    check(`${authored.slug}: all lessons published`, ls.every((l) => l.published));
    const ex = psExercises.filter((e) => e.chapter_id === ch.id).sort((a, b) => a.order_index - b.order_index);
    check(`${authored.slug}: exercises equal the content files, in order`, JSON.stringify(ex.map((e) => e.slug)) === JSON.stringify(authored.exercises.map((e) => e.slug)));
    const problems = ex.flatMap((e) =>
      validateExerciseContent({ slug: e.slug, kind: e.kind, title: e.title, promptText: e.prompt_text, public: e.public, answer: e.answer, explanation: e.explanation } as ExerciseContent),
    );
    check(`${authored.slug}: every stored exercise is well formed`, problems.length === 0, problems.slice(0, 2).join("; "));
    check(`${authored.slug}: stored text has no dash tells`, ![...ls.map((l) => l.title + l.body), ...ex.map((e) => JSON.stringify(e))].some((t) => hasAiTells(t)));
  }
  const storedSlugs = new Set(chapters.map((c) => c.slug));
  check("no chapter is stored without authored content", chapters.every((c) => AUTHORED_CHAPTERS.some((a) => a.slug === c.slug)) && storedSlugs.size === chapters.length);
  check("no orphan lessons or exercises", psLessons.every((l) => chapters.some((c) => c.id === l.chapter_id)) && psExercises.every((e) => chapters.some((c) => c.id === e.chapter_id)));

  console.log(failures ? `\n${failures} FAILED` : "\nall integrity checks passed");
  process.exit(failures ? 1 : 0);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
