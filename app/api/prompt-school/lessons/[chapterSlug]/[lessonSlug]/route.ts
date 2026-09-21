/**
 * GET /api/prompt-school/lessons/[chapterSlug]/[lessonSlug]: the lesson text, its neighbours in the
 * chapter and whether the caller finished it. Premium-only.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePromptSchoolUser } from "@/features/prompt-school/access";
import { getChapterState } from "@/features/prompt-school/progress";
import { countUserSandboxRunsToday, getCompletedLessonIds, getLessonsForChapter } from "@/features/prompt-school/repository";
import { SANDBOX_DAILY_CAP_PER_USER, findSandboxTask, runsLeft, toPublicSandboxTask } from "@/features/prompt-school/sandbox";

const slugSchema = z.string().regex(/^[a-z0-9-]{1,80}$/);

export async function GET(request: NextRequest, { params }: { params: Promise<{ chapterSlug: string; lessonSlug: string }> }) {
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
    const chapter = state.chapter;

    const lessons = await getLessonsForChapter(chapter.id);
    const index = lessons.findIndex((l) => l.slug === lessonSlug.data);
    if (index === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const lesson = lessons[index]!;

    const done = await getCompletedLessonIds(auth.user.sub);
    const neighbour = (l: (typeof lessons)[number] | undefined) => (l ? { slug: l.slug, title: l.title } : null);

    // The live sandbox (PDL-077): only lessons that have a task carry one. A failed count hides the panel, not the lesson.
    let sandbox: { task: ReturnType<typeof toPublicSandboxTask>; runsLeft: number; dailyCap: number } | null = null;
    const task = findSandboxTask(chapter.slug, lesson.slug);
    if (task) {
      try {
        sandbox = { task: toPublicSandboxTask(task), runsLeft: runsLeft(await countUserSandboxRunsToday(auth.user.sub)), dailyCap: SANDBOX_DAILY_CAP_PER_USER };
      } catch (err) {
        console.error(`[PROMPT-SCHOOL] Sandbox state unavailable: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return NextResponse.json({
      chapter: { slug: chapter.slug, title: chapter.title },
      lesson: { slug: lesson.slug, title: lesson.title, minutes: lesson.minutes, body: lesson.body, completed: done.has(lesson.id) },
      position: { index: index + 1, total: lessons.length },
      previous: neighbour(lessons[index - 1]),
      next: neighbour(lessons[index + 1]),
      sandbox,
    });
  } catch (err) {
    console.error(`[PROMPT-SCHOOL] Error fetching lesson: ${err instanceof Error ? err.message : String(err)}`);
    return NextResponse.json({ error: "Failed to fetch lesson" }, { status: 500 });
  }
}
