/**
 * GET /api/assistant/history/[id] — fetch one of the caller's own past
 * Vibe-Coding Assistant generations, in full.
 * DELETE /api/assistant/history/[id] — remove one of the caller's own generations from
 * their history (soft delete: it still counts toward the daily limit, so deleting
 * cannot be used to get extra generations from the shared free AI pool).
 * Role required: authenticated, subscription_tier = 'premium' (or admin),
 *   AND the row must belong to the caller (ownership check).
 * Response: { success: true, data: PromptBlueprintGeneration }
 * Errors: 401, 403, 404 (not found OR not owned -- same response
 *         either way, never confirms another user's row exists), 500
 *
 * specs/prompt-blueprint-builder/. E-6 five-step:
 * authenticate → authorize → validate (id shape) → execute → return.
 */

import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUser } from "@/lib/auth/verify-token";
import { canAccessPromptAssistant } from "@/lib/permissions";
import { evaluateSubscriptionAccess } from "@/features/onboarding/domain";
import { deleteOwnedGeneration, getOwnedGeneration } from "@/features/prompt-assistant/repository";
import { z } from "zod";

const idSchema = z.string().uuid();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // 3. VALIDATE
    const { id } = await params;
    const parsed = idSchema.safeParse(id);
    if (!parsed.success) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // 4. EXECUTE
    const generation = await getOwnedGeneration(parsed.data, user.sub);
    if (!generation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // 5. RETURN
    return NextResponse.json({ success: true, data: generation });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[ASSISTANT] history/[id] failed: ${message}`);
    return NextResponse.json({ error: "Failed to load generation" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // 3. VALIDATE
    const { id } = await params;
    const parsed = idSchema.safeParse(id);
    if (!parsed.success) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // 4. EXECUTE (ownership is part of the update itself)
    const deleted = await deleteOwnedGeneration(parsed.data, user.sub);
    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // 5. RETURN
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[ASSISTANT] history/[id] delete failed: ${message}`);
    return NextResponse.json({ error: "Failed to delete generation" }, { status: 500 });
  }
}
