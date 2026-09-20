/**
 * GET /api/prompt-school: the whole planned course (3 levels, chapters mapped to the book) with the
 * caller's progress. Chapters that are not written yet are listed as "coming soon" from the static
 * outline. Written chapters open one after another, like the University's (isChapterUnlocked).
 * Premium-only. E-6: authenticate, authorize, validate, execute, return.
 */
import { NextRequest, NextResponse } from "next/server";
import { requirePromptSchoolUser } from "@/features/prompt-school/access";
import { getChapterStates } from "@/features/prompt-school/progress";
import { PROMPT_SCHOOL_LEVELS, PROMPT_SCHOOL_OUTLINE } from "@/features/prompt-school/content/outline";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePromptSchoolUser(request);
    if ("denied" in auth) return auth.denied;

    const states = await getChapterStates(auth.user.sub);
    const bySlug = new Map(states.map((s) => [s.chapter.slug, s]));

    const levels = PROMPT_SCHOOL_LEVELS.map((level) => ({
      ...level,
      chapters: PROMPT_SCHOOL_OUTLINE.filter((o) => o.level === level.id).map((o) => {
        const s = bySlug.get(o.slug);
        if (!s) {
          return { slug: o.slug, title: o.title, summary: o.summary, bookRef: o.bookRef, plannedLessons: o.plannedLessons, open: false as const };
        }
        return {
          slug: o.slug,
          title: o.title,
          summary: o.summary,
          bookRef: o.bookRef,
          plannedLessons: o.plannedLessons,
          open: true as const,
          unlocked: s.unlocked,
          waitingFor: s.waitingFor,
          lessonCount: s.lessonIds.length,
          lessonsDone: s.lessonsDone,
          exerciseCount: s.exerciseIds.length,
          score: s.score,
          passed: s.completed,
        };
      }),
    }));

    return NextResponse.json({ levels });
  } catch (err) {
    console.error(`[PROMPT-SCHOOL] Error fetching overview: ${err instanceof Error ? err.message : String(err)}`);
    return NextResponse.json({ error: "Failed to fetch Prompt School" }, { status: 500 });
  }
}
