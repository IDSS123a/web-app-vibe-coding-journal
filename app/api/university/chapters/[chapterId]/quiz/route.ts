/**
 * GET  /api/university/chapters/[chapterId]/quiz — the chapter's 5
 *      questions (no answer key -- see getQuizQuestionsForChapter).
 * POST /api/university/chapters/[chapterId]/quiz — submit answers,
 *      graded server-side, chapter_quiz_attempts row recorded.
 * Premium-only. E-6 five-step throughout.
 */

import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUser } from "@/lib/auth/verify-token";
import { canAccessUniversity } from "@/lib/permissions";
import { evaluateSubscriptionAccess } from "@/features/onboarding/domain";
import { getQuizQuestionsForChapter, submitChapterQuizAttempt } from "@/features/university/repository";
import { submitChapterQuizInputSchema } from "@/lib/validation/schemas";

async function authorize(request: NextRequest) {
  const user = await getVerifiedUser(request.headers.get("authorization"));
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  const access = evaluateSubscriptionAccess({
    subscription_status: user.subscriptionStatus,
    trial_ends_at: user.trialEndsAt,
    is_blocked: user.isBlocked,
  });
  const allowed = canAccessUniversity({
    role: user.role,
    subscriptionTier: user.subscriptionTier,
    hasActiveAccess: access.hasAccess,
  });
  if (!allowed) {
    return { error: NextResponse.json({ error: "Premium subscription required" }, { status: 403 }) } as const;
  }
  return { user } as const;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> },
) {
  try {
    const auth = await authorize(request);
    if ("error" in auth) return auth.error;

    const { chapterId } = await params;
    const questions = await getQuizQuestionsForChapter(chapterId);

    return NextResponse.json({ questions });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[UNIVERSITY] Error fetching chapter quiz: ${errorMsg}`);
    return NextResponse.json({ error: "Failed to fetch quiz" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> },
) {
  try {
    const auth = await authorize(request);
    if ("error" in auth) return auth.error;

    const { chapterId } = await params;
    const body = await request.json().catch(() => null);
    const parsed = submitChapterQuizInputSchema.safeParse({ ...body, chapter_id: chapterId });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid quiz submission" }, { status: 400 });
    }

    const result = await submitChapterQuizAttempt(auth.user.sub, chapterId, parsed.data.answers);

    return NextResponse.json(result);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[UNIVERSITY] Error submitting chapter quiz: ${errorMsg}`);
    return NextResponse.json({ error: "Failed to submit quiz" }, { status: 500 });
  }
}
