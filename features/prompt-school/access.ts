/**
 * The one place the Prompt School routes decide "may this caller in" (M-7): authenticate, then
 * authorize with the same Premium rule as the University (lib/permissions.ts canAccessPromptSchool).
 * Returns the verified user, or the ready 401 / 403 response.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getVerifiedUser } from "@/lib/auth/verify-token";
import { canAccessPromptSchool } from "@/lib/permissions";
import { evaluateSubscriptionAccess } from "@/features/onboarding/domain";

export type VerifiedUser = NonNullable<Awaited<ReturnType<typeof getVerifiedUser>>>;

export async function requirePromptSchoolUser(request: NextRequest): Promise<{ user: VerifiedUser } | { denied: NextResponse }> {
  const user = await getVerifiedUser(request.headers.get("authorization"));
  if (!user) return { denied: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const access = evaluateSubscriptionAccess({
    subscription_status: user.subscriptionStatus,
    trial_ends_at: user.trialEndsAt,
    is_blocked: user.isBlocked,
  });
  const allowed = canAccessPromptSchool({
    role: user.role,
    subscriptionTier: user.subscriptionTier,
    hasActiveAccess: access.hasAccess,
  });
  if (!allowed) return { denied: NextResponse.json({ error: "Premium subscription required" }, { status: 403 }) };
  return { user };
}
