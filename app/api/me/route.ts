/**
 * GET /api/me — "who am I" for the client-side admin guard AND the
 * subscription/paywall guard (Sprint 07). Returns the caller's
 * authenticated identity, whether they are an admin, and whether they
 * currently have subscription access — with the actual admin-exemption
 * (lib/permissions.ts isBillingExempt) and trial/subscription evaluation
 * (features/onboarding/domain.ts evaluateSubscriptionAccess) composed
 * here, server-side, so the client never re-implements the business
 * logic — it only acts on `hasAccess`. Always 200; the body tells the UI
 * what to render. Never leaks anything beyond the caller's own state.
 */

import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUser } from "@/lib/auth/verify-token";
import { isBillingExempt } from "@/lib/permissions";
import { evaluateSubscriptionAccess } from "@/features/onboarding/domain";

export async function GET(request: NextRequest) {
  const user = await getVerifiedUser(request.headers.get("authorization"));

  if (!user) {
    return NextResponse.json(
      { authenticated: false, isAdmin: false, hasAccess: false, accessReason: "unauthenticated" },
      { status: 200 },
    );
  }

  const exempt = isBillingExempt({ role: user.role });
  const subscriptionResult = evaluateSubscriptionAccess({
    subscription_status: user.subscriptionStatus,
    trial_ends_at: user.trialEndsAt,
  });

  return NextResponse.json(
    {
      authenticated: true,
      isAdmin: user.isAdmin,
      email: user.email,
      hasAccess: exempt || subscriptionResult.hasAccess,
      accessReason: exempt ? "admin_exempt" : subscriptionResult.reason,
    },
    { status: 200 },
  );
}
