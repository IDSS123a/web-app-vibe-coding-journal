/**
 * GET /api/prompt-school/chapters/[slug]: one chapter with its lessons and its practice. Exercises
 * carry only their public part (toPublicExercise): correct answers, rubrics and explanations stay on
 * the server until an attempt is graded. Premium-only.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePromptSchoolUser } from "@/features/prompt-school/access";
import { chapterPassed, chapterScore, toPublicExercise } from "@/features/prompt-school/domain";
import { getBestScores, getChapterBySlug, getCompletedLessonIds, getExercisesForChapter, getLessonsForChapter } from "@/features/prompt-school/repository";

const slugSchema = z.string().regex(/^[a-z0-9-]{1,80}$/);

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const auth = await requirePromptSchoolUser(request);
    if ("denied" in auth) return auth.denied;

    const parsed = slugSchema.safeParse((await params).slug);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const chapter = await getChapterBySlug(parsed.data);
    if (!chapter) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [lessons, exercises, done, best] = await Promise.all([
      getLessonsForChapter(chapter.id),
      getExercisesForChapter(chapter.id),
      getCompletedLessonIds(auth.user.sub),
      getBestScores(auth.user.sub),
    ]);
    const score = chapterScore(best, exercises.map((e) => e.id));

    return NextResponse.json({
      chapter: { slug: chapter.slug, level: chapter.level, title: chapter.title, summary: chapter.summary, bookRef: chapter.book_ref },
      lessons: lessons.map((l) => ({ slug: l.slug, title: l.title, minutes: l.minutes, completed: done.has(l.id) })),
      exercises: exercises.map((e) => ({ ...toPublicExercise(e), bestScore: best[e.id] ?? null })),
      score,
      passed: exercises.length > 0 && chapterPassed(score),
    });
  } catch (err) {
    console.error(`[PROMPT-SCHOOL] Error fetching chapter: ${err instanceof Error ? err.message : String(err)}`);
    return NextResponse.json({ error: "Failed to fetch chapter" }, { status: 500 });
  }
}
