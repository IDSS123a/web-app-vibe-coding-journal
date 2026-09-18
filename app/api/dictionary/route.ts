/**
 * GET /api/dictionary — list all Vibe-Coding Dictionary terms.
 * Premium-only (specs/vibe-coding-university/SPEC.md).
 * E-6 five-step: authenticate → authorize → validate → execute → return.
 */

import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUser } from "@/lib/auth/verify-token";
import { canAccessUniversity } from "@/lib/permissions";
import { evaluateSubscriptionAccess } from "@/features/onboarding/domain";
import { getAllTerms } from "@/features/dictionary/repository";

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
    const terms = await getAllTerms();

    // 5. RETURN
    return NextResponse.json({ terms });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[DICTIONARY] Error fetching terms: ${errorMsg}`);
    return NextResponse.json({ error: "Failed to fetch terms" }, { status: 500 });
  }
}
