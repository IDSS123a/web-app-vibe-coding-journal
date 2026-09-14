/**
 * POST /api/university/progress — mark a lesson complete. Premium-only.
 * E-6 five-step: authenticate → authorize → validate → execute → return.
 */

import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUser } from "@/lib/auth/verify-token";
import { canAccessUniversity } from "@/lib/permissions";
import { evaluateSubscriptionAccess } from "@/features/onboarding/domain";
import { markLessonCompleteInputSchema } from "@/lib/validation/schemas";
import { markLessonComplete, getPublishedLessonsForCourse } from "@/features/university/repository";
import { computeCourseStatus } from "@/features/university/domain";
import { supabaseAdmin } from "@/lib/db/client";

export async function POST(request: NextRequest) {
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
    const body = await request.json().catch(() => null);
    const parsed = markLessonCompleteInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // 4. EXECUTE
    const progress = await markLessonComplete(user.sub, parsed.data.course_id, parsed.data.lesson_id);
    const publishedLessons = await getPublishedLessonsForCourse(parsed.data.course_id);
    const status = computeCourseStatus(progress.lessons_completed.length, publishedLessons.length);

    if (status !== progress.status && supabaseAdmin) {
      // Best-effort status correction -- markLessonComplete always
      // writes 'in_progress' (it doesn't know the total published
      // count); this reconciles it to 'completed' when applicable.
      // Not fatal if it fails -- lessons_completed is the source of
      // truth, `status` is a denormalized convenience field.
      await supabaseAdmin
        .from("course_progress")
        .update({ status })
        .eq("id", progress.id)
        .then(({ error }) => {
          if (error) console.error(`[UNIVERSITY] Failed to reconcile progress status: ${error.message}`);
        });
    }

    // 5. RETURN
    return NextResponse.json({ progress: { ...progress, status } });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[UNIVERSITY] Error updating progress: ${errorMsg}`);
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}
