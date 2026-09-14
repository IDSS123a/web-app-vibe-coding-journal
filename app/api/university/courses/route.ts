/**
 * GET /api/university/courses — list all courses with the caller's
 * progress. Premium-only (specs/vibe-coding-university/SPEC.md).
 * E-6 five-step: authenticate → authorize → validate → execute → return.
 */

import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUser } from "@/lib/auth/verify-token";
import { canAccessUniversity } from "@/lib/permissions";
import { evaluateSubscriptionAccess } from "@/features/onboarding/domain";
import { getAllCourses, getUserProgress } from "@/features/university/repository";
import { computeCourseStatus } from "@/features/university/domain";
import { getPublishedLessonsForCourse } from "@/features/university/repository";

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
    const [courses, progress] = await Promise.all([getAllCourses(), getUserProgress(user.sub)]);
    const progressByCourse = new Map(progress.map((p) => [p.course_id, p]));

    const coursesWithStatus = await Promise.all(
      courses.map(async (course) => {
        const publishedLessons = await getPublishedLessonsForCourse(course.id);
        const userProgress = progressByCourse.get(course.id);
        const completed = new Set(userProgress?.lessons_completed ?? []);
        return {
          ...course,
          publishedLessonCount: publishedLessons.length,
          completedCount: completed.size,
          status: computeCourseStatus(completed.size, publishedLessons.length),
          lessons: publishedLessons.map((l) => ({
            id: l.id,
            slug: l.slug,
            title: l.title,
            completed: completed.has(l.id),
          })),
        };
      }),
    );

    // 5. RETURN
    return NextResponse.json({ courses: coursesWithStatus });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[UNIVERSITY] Error fetching courses: ${errorMsg}`);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}
