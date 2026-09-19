/**
 * Loads the authored Prompt School content into the database (specs/prompt-school/).
 *
 *   npx tsx --env-file=.env.local scripts/seed-prompt-school.ts [--dry-run]
 *
 * Idempotent: chapters, lessons and exercises are upserted by slug, so running it again after editing
 * a content file updates the text and keeps every learner's progress (progress is keyed by row id,
 * and upsert keeps the ids). Rows that are no longer in the content are left alone, never deleted.
 */
import { createClient } from "@supabase/supabase-js";
import { AUTHORED_CHAPTERS } from "../features/prompt-school/content";
import { PROMPT_SCHOOL_OUTLINE } from "../features/prompt-school/content/outline";
import { validateExerciseContent } from "../features/prompt-school/domain";

const dryRun = process.argv.includes("--dry-run");

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase URL or service role key is not configured");
  const db = createClient(url, key, { auth: { persistSession: false } });

  for (const authored of AUTHORED_CHAPTERS) {
    const outlineIndex = PROMPT_SCHOOL_OUTLINE.findIndex((c) => c.slug === authored.slug);
    const outline = PROMPT_SCHOOL_OUTLINE[outlineIndex];
    if (!outline) throw new Error(`Chapter ${authored.slug} is not in the outline`);
    const problems = authored.exercises.flatMap((e) => validateExerciseContent(e));
    if (problems.length > 0) throw new Error(`Exercise problems in ${authored.slug}:\n${problems.join("\n")}`);

    console.log(`${authored.slug}: ${authored.lessons.length} lessons, ${authored.exercises.length} exercises`);
    if (dryRun) continue;

    const { data: chapter, error: chErr } = await db
      .from("ps_chapters")
      .upsert(
        { slug: outline.slug, level: outline.level, title: outline.title, summary: outline.summary, order_index: outlineIndex + 1, published: true, book_ref: outline.bookRef },
        { onConflict: "slug" },
      )
      .select("id")
      .single();
    if (chErr || !chapter) throw new Error(`Chapter upsert failed: ${chErr?.message}`);

    const lessonRows = authored.lessons.map((l, i) => ({
      chapter_id: chapter.id,
      slug: l.slug,
      title: l.title,
      order_index: i + 1,
      minutes: l.minutes,
      body: l.body,
      published: true,
    }));
    const { error: lErr } = await db.from("ps_lessons").upsert(lessonRows, { onConflict: "chapter_id,slug" });
    if (lErr) throw new Error(`Lesson upsert failed: ${lErr.message}`);

    const exerciseRows = authored.exercises.map((e, i) => ({
      chapter_id: chapter.id,
      slug: e.slug,
      order_index: i + 1,
      kind: e.kind,
      title: e.title,
      prompt_text: e.promptText,
      public: e.public,
      answer: e.answer,
      explanation: e.explanation,
    }));
    const { error: eErr } = await db.from("ps_exercises").upsert(exerciseRows, { onConflict: "chapter_id,slug" });
    if (eErr) throw new Error(`Exercise upsert failed: ${eErr.message}`);
  }
  console.log(dryRun ? "Dry run: nothing written." : "Seeded.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
