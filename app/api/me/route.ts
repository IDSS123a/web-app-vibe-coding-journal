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
 *
 * Also returns `rewardState` (2026-10-02, performance pass): CoinBalance
 * used to call its own GET /api/rewards/state, which re-ran getVerifiedUser()
 * from scratch -- a second, fully independent pair of Supabase round trips to
 * answer an identity question /api/me had already just answered. Every page
 * renders both the nav (which calls /api/me) and CoinBalance (rewards/state),
 * so this doubled the real "who is this" cost on every single page load.
 * Folding one extra reward-state query into this request removes that whole
 * second round trip entirely. GET /api/rewards/state is retired
 * (features/rewards/repository.ts's getRewardState is unchanged, only where
 * it's called from has moved here).
 */

import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUser } from "@/lib/auth/verify-token";
import { isBillingExempt, canAccessUniversity, canAccessPromptAssistant, canAccessPromptSchool, canAccessFreeTools } from "@/lib/permissions";
import { evaluateSubscriptionAccess } from "@/features/onboarding/domain";
import { resolvePayPalMode } from "@/lib/payments/paypal-mode";
import { getRewardState, type RewardState } from "@/features/rewards/repository";

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
        hasPromptSchoolAccess: false,
        hasFreeToolsAccess: false,
        subscriptionTier: null,
        subscriptionStatus: null,
        isBlocked: false,
        rewardState: null,
      },
      { status: 200 },
    );
  }

  // Reward display is a delight layer (CoinBalance's own existing framing) --
  // its query failing must never take down /api/me's actual access decision.
  let rewardState: RewardState | null = null;
  try {
    rewardState = await getRewardState(user.sub);
  } catch (err) {
    console.error(`[ME] reward state fetch failed: ${err instanceof Error ? err.message : String(err)}`);
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
      // Prompt School (specs/prompt-school/): same premium-tier gate as University.
      hasPromptSchoolAccess: canAccessPromptSchool({
        role: user.role,
        subscriptionTier: user.subscriptionTier,
        hasActiveAccess: subscriptionResult.hasAccess,
      }),
      // Top Tools to Try, free-tools section (Director-approved, 2026-10-02): same
      // premium-tier gate as University -- see lib/permissions.ts canAccessFreeTools.
      // The paid-tools section needs no separate flag: it's covered by hasAccess itself.
      hasFreeToolsAccess: canAccessFreeTools({
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
      // The end of the paid year; the renewal banner shows in its last 7 days (PDL-079).
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      // Sandbox or live PayPal, so the payment screens tell the truth about whether real money moves (PDL-079).
      paypalMode: resolvePayPalMode(),
      // When the free trial ends, for the trial banner on the dashboard.
      trialEndsAt: user.trialEndsAt,
      isBlocked: user.isBlocked,
      rewardState,
    },
    { status: 200 },
  );
}
