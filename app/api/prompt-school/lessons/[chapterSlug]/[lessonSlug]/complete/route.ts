/**
 * POST /api/prompt-school/lessons/[chapterSlug]/[lessonSlug]/complete: marks a lesson finished for the
 * caller. Idempotent. Premium-only. Pays 5 coins the first time (PDL-072), never again.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePromptSchoolUser } from "@/features/prompt-school/access";
import { getChapterState } from "@/features/prompt-school/progress";
import { getLessonsForChapter, markLessonDone } from "@/features/prompt-school/repository";
import { awardPromptSchool } from "@/features/prompt-school/rewards";
import { grantNewBadges } from "@/features/badges/award";

const slugSchema = z.string().regex(/^[a-z0-9-]{1,80}$/);

export async function POST(request: NextRequest, { params }: { params: Promise<{ chapterSlug: string; lessonSlug: string }> }) {
  try {
    const auth = await requirePromptSchoolUser(request);
    if ("denied" in auth) return auth.denied;

    const raw = await params;
    const chapterSlug = slugSchema.safeParse(raw.chapterSlug);
    const lessonSlug = slugSchema.safeParse(raw.lessonSlug);
    if (!chapterSlug.success || !lessonSlug.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const state = await getChapterState(auth.user.sub, chapterSlug.data);
    if (!state) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!state.unlocked) return NextResponse.json({ error: "Chapter locked", waitingFor: state.waitingFor }, { status: 403 });
    const lesson = (await getLessonsForChapter(state.chapter.id)).find((l) => l.slug === lessonSlug.data);
    if (!lesson) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await markLessonDone(auth.user.sub, lesson.id);
    const reward = await awardPromptSchool(auth.user.sub, "ps_lesson_complete", lesson.id);
    const badges = await grantNewBadges(auth.user.sub, ["first-lesson"]);
    return NextResponse.json({ completed: true, reward, badges });
  } catch (err) {
    console.error(`[PROMPT-SCHOOL] Error completing lesson: ${err instanceof Error ? err.message : String(err)}`);
    return NextResponse.json({ error: "Failed to save progress" }, { status: 500 });
  }
}
