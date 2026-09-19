/**
 * GET /api/prompt-school: the whole planned course (3 levels, chapters mapped to the book) with the
 * caller's progress. Chapters that are not written yet are listed as "coming soon" from the static
 * outline. Premium-only, same rule as University. E-6: authenticate, authorize, validate, execute, return.
 */
import { NextRequest, NextResponse } from "next/server";
import { requirePromptSchoolUser } from "@/features/prompt-school/access";
import { chapterPassed, chapterScore } from "@/features/prompt-school/domain";
import { PROMPT_SCHOOL_LEVELS, PROMPT_SCHOOL_OUTLINE } from "@/features/prompt-school/content/outline";
import { getBestScores, getCompletedLessonIds, getExerciseStubs, getLessonStubs, getPublishedChapters } from "@/features/prompt-school/repository";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePromptSchoolUser(request);
    if ("denied" in auth) return auth.denied;

    const [chapters, lessons, exercises, done, best] = await Promise.all([
      getPublishedChapters(),
      getLessonStubs(),
      getExerciseStubs(),
      getCompletedLessonIds(auth.user.sub),
      getBestScores(auth.user.sub),
    ]);
    const bySlug = new Map(chapters.map((c) => [c.slug, c]));

    const levels = PROMPT_SCHOOL_LEVELS.map((level) => ({
      ...level,
      chapters: PROMPT_SCHOOL_OUTLINE.filter((o) => o.level === level.id).map((o) => {
        const row = bySlug.get(o.slug);
        if (!row) {
          return { slug: o.slug, title: o.title, summary: o.summary, bookRef: o.bookRef, plannedLessons: o.plannedLessons, open: false as const };
        }
        const chapterLessons = lessons.filter((l) => l.chapter_id === row.id);
        const exerciseIds = exercises.filter((e) => e.chapter_id === row.id).map((e) => e.id);
        const score = chapterScore(best, exerciseIds);
        return {
          slug: o.slug,
          title: o.title,
          summary: o.summary,
          bookRef: o.bookRef,
          plannedLessons: o.plannedLessons,
          open: true as const,
          lessonCount: chapterLessons.length,
          lessonsDone: chapterLessons.filter((l) => done.has(l.id)).length,
          exerciseCount: exerciseIds.length,
          score,
          passed: exerciseIds.length > 0 && chapterPassed(score),
        };
      }),
    }));

    return NextResponse.json({ levels });
  } catch (err) {
    console.error(`[PROMPT-SCHOOL] Error fetching overview: ${err instanceof Error ? err.message : String(err)}`);
    return NextResponse.json({ error: "Failed to fetch Prompt School" }, { status: 500 });
  }
}
