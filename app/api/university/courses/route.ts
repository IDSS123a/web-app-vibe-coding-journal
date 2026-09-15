/**
 * GET /api/university/courses — list all courses with the caller's
 * chapter-gated progress. Premium-only (specs/vibe-coding-university/
 * SPEC.md). E-6 five-step: authenticate → authorize → validate →
 * execute → return.
 *
 * Response shape changed 2026-09-15 (chapter/quiz amendment): each
 * course now returns its CHAPTERS (each with lock status, its core
 * lessons, and quiz availability/pass status) instead of one flat
 * lesson list. Supplementary lessons (is_core=false, e.g. everything
 * the weekly generation cron produces) are returned separately per
 * course, un-gated.
 */

import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUser } from "@/lib/auth/verify-token";
import { canAccessUniversity } from "@/lib/permissions";
import { evaluateSubscriptionAccess } from "@/features/onboarding/domain";
import {
  getAllCourses,
  getUserProgress,
  getChaptersForCourse,
  getCoreLessonsForChapter,
  getPassedChapterOrderIndexes,
  hasPassedLevelTest,
} from "@/features/university/repository";
import { isChapterUnlocked, isChapterQuizAvailable, isLevelTestUnlocked } from "@/features/university/domain";
import { supabaseAdmin } from "@/lib/db/client";
import type { Lesson } from "@/lib/validation/schemas";

export async function GET(request: NextRequest) {
  try {
    // 1. AUTHENTICATE
    const user = await getVerifiedUser(request.headers.get("authorization"));
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. AUTHORIZE (Premium tier or admin)
    const access = evaluateSubscriptionAccess({
      subscription_status: user.subscriptionStatus,
      trial_ends_at: user.trialEndsAt,
    });
    const allowed = canAccessUniversity({
      role: user.role,
      subscriptionTier: user.subscriptionTier,
      hasActiveAccess: access.hasAccess,
    });
    if (!allowed) {
      return NextResponse.json({ error: "Premium subscription required" }, { status: 403 });
    }

    // 3. VALIDATE (no input)

    // 4. EXECUTE
    if (!supabaseAdmin) throw new Error("Admin client not available");

    const [courses, progressRows] = await Promise.all([getAllCourses(), getUserProgress(user.sub)]);
    const progressByCourse = new Map(progressRows.map((p) => [p.course_id, p]));

    const coursesWithChapters = await Promise.all(
      courses.map(async (course) => {
        const completed = new Set(progressByCourse.get(course.id)?.lessons_completed ?? []);
        const [chapters, passedChapterIndexes, levelPassed] = await Promise.all([
          getChaptersForCourse(course.id),
          getPassedChapterOrderIndexes(user.sub, course.id),
          hasPassedLevelTest(user.sub, course.level),
        ]);

        const chaptersWithState = await Promise.all(
          chapters.map(async (chapter) => {
            const unlocked = isChapterUnlocked(chapter.order_index, passedChapterIndexes);
            const lessons = unlocked ? await getCoreLessonsForChapter(chapter.id) : [];
            const lessonIds = lessons.map((l) => l.id);
            return {
              ...chapter,
              unlocked,
              lessons: lessons.map((l) => ({
                id: l.id,
                slug: l.slug,
                title: l.title,
                completed: completed.has(l.id),
              })),
              quizAvailable: unlocked && isChapterQuizAvailable(lessonIds, completed),
              quizPassed: passedChapterIndexes.has(chapter.order_index),
            };
          }),
        );

        const { data: supplementaryRows, error: suppError } = await supabaseAdmin!
          .from("lessons")
          .select("*")
          .eq("course_id", course.id)
          .eq("is_core", false)
          .eq("status", "published")
          .order("created_at", { ascending: false });
        if (suppError) throw new Error(`Failed to fetch supplementary lessons: ${suppError.message}`);
        const supplementaryLessons = (supplementaryRows as Lesson[]).map((l) => ({
          id: l.id,
          slug: l.slug,
          title: l.title,
          completed: completed.has(l.id),
        }));

        return {
          ...course,
          chapters: chaptersWithState,
          levelTestUnlocked: isLevelTestUnlocked(chapters.length, passedChapterIndexes.size),
          levelTestPassed: levelPassed,
          supplementaryLessons,
        };
      }),
    );

    // 5. RETURN
    return NextResponse.json({ courses: coursesWithChapters });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[UNIVERSITY] Error fetching courses: ${errorMsg}`);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}
