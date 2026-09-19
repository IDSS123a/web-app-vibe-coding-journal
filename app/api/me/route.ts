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
import { isBillingExempt, canAccessUniversity, canAccessPromptAssistant } from "@/lib/permissions";
import { evaluateSubscriptionAccess } from "@/features/onboarding/domain";

export async function GET(request: NextRequest) {
  const user = await getVerifiedUser(request.headers.get("authorization"));

  if (!user) {
    return NextResponse.json(
      {
        authenticated: false,
        isAdmin: false,
        hasAccess: false,
        accessReason: "unauthenticated",
        hasUniversityAccess: false,
        hasAssistantAccess: false,
        subscriptionTier: null,
        subscriptionStatus: null,
        isBlocked: false,
      },
      { status: 200 },
    );
  }

  const exempt = isBillingExempt({ role: user.role });
  const subscriptionResult = evaluateSubscriptionAccess({
    subscription_status: user.subscriptionStatus,
    trial_ends_at: user.trialEndsAt,
    is_blocked: user.isBlocked,
  });
  const hasAccess = exempt || subscriptionResult.hasAccess;

  return NextResponse.json(
    {
      authenticated: true,
      isAdmin: user.isAdmin,
      email: user.email,
      hasAccess,
      accessReason: exempt ? "admin_exempt" : subscriptionResult.reason,
      // Vibe-Coding University + Dictionary (specs/vibe-coding-university/):
      // Premium-only, distinct from the general subscription-access
      // check above -- see lib/permissions.ts canAccessUniversity.
      hasUniversityAccess: canAccessUniversity({
        role: user.role,
        subscriptionTier: user.subscriptionTier,
        hasActiveAccess: subscriptionResult.hasAccess,
      }),
      // Vibe-Coding Assistant (specs/prompt-blueprint-builder/, resolves
      // CONSTITUTION.md P-19, DECISION_LOG.md PDL-046): same premium-tier
      // gate as University -- see lib/permissions.ts canAccessPromptAssistant.
      hasAssistantAccess: canAccessPromptAssistant({
        role: user.role,
        subscriptionTier: user.subscriptionTier,
        hasActiveAccess: subscriptionResult.hasAccess,
      }),
      // Admin Console & Subscription Lifecycle (specs/admin-console-and-
      // subscription-lifecycle/): lets UpgradeToPremiumBanner decide
      // whether to render without a second endpoint -- the server
      // already computed this value above for the two checks it made.
      subscriptionTier: user.subscriptionTier,
      // trial | active | expired. The upgrade screens need it: only an ACTIVE Basic subscriber
      // (who has paid) may pay the $40 difference; a trial user has tier basic but paid nothing.
      subscriptionStatus: user.subscriptionStatus,
      isBlocked: user.isBlocked,
    },
    { status: 200 },
  );
}
