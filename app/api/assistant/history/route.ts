/**
 * GET /api/assistant/history — list the caller's own past Vibe-Coding
 * Assistant generations (summary fields only).
 * Role required: authenticated, subscription_tier = 'premium' (or admin)
 * Response: { success: true, data: PromptBlueprintGenerationSummary[] }
 * Errors: 401, 403, 500
 *
 * specs/prompt-blueprint-builder/. E-6 five-step (no request body to
 * validate for a GET list): authenticate → authorize → execute → return.
 */

import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUser } from "@/lib/auth/verify-token";
import { canAccessPromptAssistant } from "@/lib/permissions";
import { evaluateSubscriptionAccess } from "@/features/onboarding/domain";
import { listUserGenerations } from "@/features/prompt-assistant/repository";

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
    const allowed = canAccessPromptAssistant({
      role: user.role,
      subscriptionTier: user.subscriptionTier,
      hasActiveAccess: access.hasAccess,
    });
    if (!allowed) {
      return NextResponse.json({ error: "Premium subscription required" }, { status: 403 });
    }

    // 3. EXECUTE
    const generations = await listUserGenerations(user.sub);

    // 4. RETURN
    return NextResponse.json({ success: true, data: generations });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[ASSISTANT] history failed: ${message}`);
    return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
  }
}
