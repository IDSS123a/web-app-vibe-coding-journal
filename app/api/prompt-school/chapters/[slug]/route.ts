/**
 * GET /api/prompt-school/chapters/[slug]: one chapter with its lessons and its practice. A locked chapter
 * answers 403 (the previous chapter is not complete yet). The exercises are listed only once every
 * lesson is done, and then carry only their public part (toPublicExercise): correct answers, rubrics
 * and explanations stay on the server until an attempt is graded. Premium-only.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePromptSchoolUser } from "@/features/prompt-school/access";
import { toPublicExercise } from "@/features/prompt-school/domain";
import { getChapterState } from "@/features/prompt-school/progress";
import { getBestScores, getCompletedLessonIds, getExercisesForChapter, getLessonsForChapter } from "@/features/prompt-school/repository";

const slugSchema = z.string().regex(/^[a-z0-9-]{1,80}$/);

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const auth = await requirePromptSchoolUser(request);
    if ("denied" in auth) return auth.denied;

    const parsed = slugSchema.safeParse((await params).slug);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const state = await getChapterState(auth.user.sub, parsed.data);
    if (!state) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!state.unlocked) return NextResponse.json({ error: "Chapter locked", waitingFor: state.waitingFor }, { status: 403 });
    const chapter = state.chapter;

    const [lessons, exercises, done, best] = await Promise.all([
      getLessonsForChapter(chapter.id),
      state.practiceAvailable ? getExercisesForChapter(chapter.id) : Promise.resolve([]),
      getCompletedLessonIds(auth.user.sub),
      getBestScores(auth.user.sub),
    ]);

    return NextResponse.json({
      chapter: { slug: chapter.slug, level: chapter.level, title: chapter.title, summary: chapter.summary, bookRef: chapter.book_ref },
      lessons: lessons.map((l) => ({ slug: l.slug, title: l.title, minutes: l.minutes, completed: done.has(l.id) })),
      practiceAvailable: state.practiceAvailable,
      exerciseCount: state.exerciseIds.length,
      exercises: exercises.map((e) => ({ ...toPublicExercise(e), bestScore: best[e.id] ?? null })),
      score: state.score,
      passed: state.completed,
    });
  } catch (err) {
    console.error(`[PROMPT-SCHOOL] Error fetching chapter: ${err instanceof Error ? err.message : String(err)}`);
    return NextResponse.json({ error: "Failed to fetch chapter" }, { status: 500 });
  }
}
