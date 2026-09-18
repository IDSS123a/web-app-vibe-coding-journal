/**
 * GET  /api/university/level-test/[level] — the level's final test
 *      questions (no answer key).
 * POST /api/university/level-test/[level] — submit answers, graded
 *      server-side, level_test_attempts row recorded.
 * Premium-only. E-6 five-step throughout.
 */

import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUser } from "@/lib/auth/verify-token";
import { canAccessUniversity } from "@/lib/permissions";
import { evaluateSubscriptionAccess } from "@/features/onboarding/domain";
import { getLevelTestQuestions, submitLevelTestAttempt } from "@/features/university/repository";
import { submitLevelTestInputSchema } from "@/lib/validation/schemas";

const LEVELS = ["beginner", "intermediate", "expert"] as const;
type Level = (typeof LEVELS)[number];

function isLevel(value: string): value is Level {
  return (LEVELS as readonly string[]).includes(value);
}

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

export async function GET(request: NextRequest, { params }: { params: Promise<{ level: string }> }) {
  try {
    const auth = await authorize(request);
    if ("error" in auth) return auth.error;

    const { level } = await params;
    if (!isLevel(level)) {
      return NextResponse.json({ error: "Invalid level" }, { status: 400 });
    }

    const questions = await getLevelTestQuestions(level);
    return NextResponse.json({ questions });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[UNIVERSITY] Error fetching level test: ${errorMsg}`);
    return NextResponse.json({ error: "Failed to fetch level test" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ level: string }> }) {
  try {
    const auth = await authorize(request);
    if ("error" in auth) return auth.error;

    const { level } = await params;
    if (!isLevel(level)) {
      return NextResponse.json({ error: "Invalid level" }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const parsed = submitLevelTestInputSchema.safeParse({ ...body, level });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid test submission" }, { status: 400 });
    }

    const result = await submitLevelTestAttempt(auth.user.sub, level, parsed.data.answers);
    return NextResponse.json(result);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[UNIVERSITY] Error submitting level test: ${errorMsg}`);
    return NextResponse.json({ error: "Failed to submit level test" }, { status: 500 });
  }
}
