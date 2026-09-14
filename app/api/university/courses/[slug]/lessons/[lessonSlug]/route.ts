/**
 * GET /api/university/courses/[slug]/lessons/[lessonSlug] — one
 * published lesson. Premium-only.
 * E-6 five-step: authenticate → authorize → validate → execute → return.
 */

import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUser } from "@/lib/auth/verify-token";
import { canAccessUniversity } from "@/lib/permissions";
import { evaluateSubscriptionAccess } from "@/features/onboarding/domain";
import { getCourseBySlug, getLessonBySlug } from "@/features/university/repository";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonSlug: string }> },
) {
  try {
    // 1. AUTHENTICATE
    const user = await getVerifiedUser(request.headers.get("authorization"));
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. AUTHORIZE
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

    // 3. VALIDATE
    const { slug, lessonSlug } = await params;

    // 4. EXECUTE
    const course = await getCourseBySlug(slug);
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    const lesson = await getLessonBySlug(course.id, lessonSlug);
    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // 5. RETURN
    return NextResponse.json({ course, lesson });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[UNIVERSITY] Error fetching lesson: ${errorMsg}`);
    return NextResponse.json({ error: "Failed to fetch lesson" }, { status: 500 });
  }
}
