/**
 * GET /api/ideas — list published Top Profitable Ideas for Vibe-Coders.
 * Premium-only (Director-approved, 2026-10-02 six-step feasibility study, step 5).
 * E-6 five-step: authenticate → authorize → validate → execute → return.
 */

import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUser } from "@/lib/auth/verify-token";
import { canAccessIdeas } from "@/lib/permissions";
import { evaluateSubscriptionAccess } from "@/features/onboarding/domain";
import { getPublishedIdeas } from "@/features/ideas/repository";

export async function GET(request: NextRequest) {
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
      is_blocked: user.isBlocked,
    });
    const allowed = canAccessIdeas({
      role: user.role,
      subscriptionTier: user.subscriptionTier,
      hasActiveAccess: access.hasAccess,
    });
    if (!allowed) {
      return NextResponse.json({ error: "Premium subscription required" }, { status: 403 });
    }

    // 3. VALIDATE (no input)

    // 4. EXECUTE
    const ideas = await getPublishedIdeas();

    // 5. RETURN
    return NextResponse.json({ ideas }, { headers: { "Cache-Control": "private, max-age=300" } });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[IDEAS] Error fetching ideas: ${errorMsg}`);
    return NextResponse.json({ error: "Failed to fetch ideas" }, { status: 500 });
  }
}
