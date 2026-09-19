/**
 * POST /api/prompt-school/lessons/[chapterSlug]/[lessonSlug]/complete: marks a lesson finished for the
 * caller. Idempotent. Premium-only.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePromptSchoolUser } from "@/features/prompt-school/access";
import { getChapterBySlug, getLessonsForChapter, markLessonDone } from "@/features/prompt-school/repository";

const slugSchema = z.string().regex(/^[a-z0-9-]{1,80}$/);

export async function POST(request: NextRequest, { params }: { params: Promise<{ chapterSlug: string; lessonSlug: string }> }) {
  try {
    const auth = await requirePromptSchoolUser(request);
    if ("denied" in auth) return auth.denied;

    const raw = await params;
    const chapterSlug = slugSchema.safeParse(raw.chapterSlug);
    const lessonSlug = slugSchema.safeParse(raw.lessonSlug);
    if (!chapterSlug.success || !lessonSlug.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const chapter = await getChapterBySlug(chapterSlug.data);
    if (!chapter) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const lesson = (await getLessonsForChapter(chapter.id)).find((l) => l.slug === lessonSlug.data);
    if (!lesson) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await markLessonDone(auth.user.sub, lesson.id);
    return NextResponse.json({ completed: true });
  } catch (err) {
    console.error(`[PROMPT-SCHOOL] Error completing lesson: ${err instanceof Error ? err.message : String(err)}`);
    return NextResponse.json({ error: "Failed to save progress" }, { status: 500 });
  }
}
