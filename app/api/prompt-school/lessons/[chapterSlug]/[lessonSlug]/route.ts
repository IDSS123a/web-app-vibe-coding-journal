/**
 * GET /api/prompt-school/lessons/[chapterSlug]/[lessonSlug]: the lesson text, its neighbours in the
 * chapter and whether the caller finished it. Premium-only.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePromptSchoolUser } from "@/features/prompt-school/access";
import { getChapterBySlug, getCompletedLessonIds, getLessonsForChapter } from "@/features/prompt-school/repository";

const slugSchema = z.string().regex(/^[a-z0-9-]{1,80}$/);

export async function GET(request: NextRequest, { params }: { params: Promise<{ chapterSlug: string; lessonSlug: string }> }) {
  try {
    const auth = await requirePromptSchoolUser(request);
    if ("denied" in auth) return auth.denied;

    const raw = await params;
    const chapterSlug = slugSchema.safeParse(raw.chapterSlug);
    const lessonSlug = slugSchema.safeParse(raw.lessonSlug);
    if (!chapterSlug.success || !lessonSlug.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const chapter = await getChapterBySlug(chapterSlug.data);
    if (!chapter) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const lessons = await getLessonsForChapter(chapter.id);
    const index = lessons.findIndex((l) => l.slug === lessonSlug.data);
    if (index === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const lesson = lessons[index]!;

    const done = await getCompletedLessonIds(auth.user.sub);
    const neighbour = (l: (typeof lessons)[number] | undefined) => (l ? { slug: l.slug, title: l.title } : null);

    return NextResponse.json({
      chapter: { slug: chapter.slug, title: chapter.title },
      lesson: { slug: lesson.slug, title: lesson.title, minutes: lesson.minutes, body: lesson.body, completed: done.has(lesson.id) },
      position: { index: index + 1, total: lessons.length },
      previous: neighbour(lessons[index - 1]),
      next: neighbour(lessons[index + 1]),
    });
  } catch (err) {
    console.error(`[PROMPT-SCHOOL] Error fetching lesson: ${err instanceof Error ? err.message : String(err)}`);
    return NextResponse.json({ error: "Failed to fetch lesson" }, { status: 500 });
  }
}
