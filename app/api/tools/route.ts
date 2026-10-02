/**
 * GET /api/tools — list Top Tools to Try (Director-approved, 2026-10-02 six-step
 * feasibility study). Unlike Dictionary/University, this rubric is split by tier at
 * the pricing-section level, not as a single on/off gate: Basic ($10) reads the paid
 * tools, Premium ($50) reads both sections (lib/permissions.ts canAccessPaidTools /
 * canAccessFreeTools).
 * E-6 five-step: authenticate → authorize → validate → execute → return.
 */

import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUser } from "@/lib/auth/verify-token";
import { canAccessFreeTools, canAccessPaidTools } from "@/lib/permissions";
import { evaluateSubscriptionAccess } from "@/features/onboarding/domain";
import { getAllTools } from "@/features/tools/repository";

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
    const authContext = { role: user.role, subscriptionTier: user.subscriptionTier, hasActiveAccess: access.hasAccess };
    const canPaid = canAccessPaidTools(authContext);
    const canFree = canAccessFreeTools(authContext);
    if (!canPaid && !canFree) {
      return NextResponse.json({ error: "Subscription required" }, { status: 403 });
    }

    // 3. VALIDATE (no input)

    // 4. EXECUTE
    const all = await getAllTools();
    const tools = canFree ? all : all.filter((t) => t.pricing === "paid");

    // 5. RETURN
    return NextResponse.json({ tools }, { headers: { "Cache-Control": "private, max-age=300" } });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[TOOLS] Error fetching tools: ${errorMsg}`);
    return NextResponse.json({ error: "Failed to fetch tools" }, { status: 500 });
  }
}
