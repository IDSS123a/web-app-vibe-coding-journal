/**
 * POST /api/assistant/generate — generate a new Vibe-Coding Assistant
 * prompt Blueprint from the wizard answers.
 * Role required: authenticated, subscription_tier = 'premium' (or admin)
 * Body: PromptAssistantWizardSchema
 * Response: { success: true, data: PromptBlueprintGeneration }
 * Errors: 401 (unauthenticated), 403 (not premium), 422 (validation),
 *         429 (per-user daily cap exceeded), 503 (global daily cap
 *         exceeded -- shared free-tier Gemini quota protection), 500
 *
 * specs/prompt-blueprint-builder/, resolves CONSTITUTION.md P-19,
 * DECISION_LOG.md PDL-046. E-6 five-step:
 * authenticate → authorize → validate → execute → return.
 */

import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUser } from "@/lib/auth/verify-token";
import { canAccessPromptAssistant } from "@/lib/permissions";
import { evaluateSubscriptionAccess } from "@/features/onboarding/domain";
import { promptAssistantWizardSchema } from "@/lib/validation/schemas";
import {
  countUserGenerationsToday,
  countGenerationsToday,
  insertGeneration,
} from "@/features/prompt-assistant/repository";
import { buildGenerateInput, isUserCapExceeded, isGlobalCapExceeded, ASSISTANT_DAILY_CAP_PER_USER } from "@/features/prompt-assistant/domain";
import { ensureAIProviderInitialized } from "@/lib/ai/init";
import { getAIProvider } from "@/lib/ai/ai-provider";
import { GeminiKeysExhaustedError, GeminiUnavailableError } from "@/lib/ai/gemini-provider";

export async function POST(request: NextRequest) {
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
    const body = await request.json().catch(() => null);
    const parsed = promptAssistantWizardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 422 });
    }

    // 4. EXECUTE
    const userGenerationsToday = await countUserGenerationsToday(user.sub);
    if (isUserCapExceeded(userGenerationsToday)) {
      return NextResponse.json(
        { error: `Daily limit reached (${ASSISTANT_DAILY_CAP_PER_USER} per day). Try again tomorrow.` },
        { status: 429 },
      );
    }

    const generationsToday = await countGenerationsToday();
    if (isGlobalCapExceeded(generationsToday)) {
      // Rare (shared free-tier Gemini quota protection, P-18) -- not the
      // requesting user's fault, so this is a 503, not a 429.
      return NextResponse.json(
        { error: "The Vibe-Coding Assistant is at capacity for today. Please try again tomorrow." },
        { status: 503 },
      );
    }

    ensureAIProviderInitialized();
    const aiInput = buildGenerateInput(parsed.data);
    const output = await getAIProvider().generatePromptBlueprint(aiInput);

    // A successful HTTP call is not a successful result (E-5/AUDIT-003):
    // an empty promptBlueprint means generation failed upstream (bad
    // parse, MAX_TOKENS truncation) -- never persist or return that as
    // if it were real.
    if (!output.promptBlueprint) {
      console.error(`[ASSISTANT] Empty generation result for user ${user.sub}`);
      return NextResponse.json({ error: "Generation failed. Please try again." }, { status: 500 });
    }

    const generation = await insertGeneration(user.sub, parsed.data, output);

    // 5. RETURN
    return NextResponse.json({ success: true, data: generation });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[ASSISTANT] generate failed: ${message}`);
    // A failed generation is never persisted (insertGeneration runs only after
    // success), so it does not count toward the user's daily cap -- the message
    // says so, because "did that use one of my 5?" is the first thing people ask.
    if (error instanceof GeminiUnavailableError) {
      return NextResponse.json(
        { error: "The AI service is busy right now. Nothing was counted against your daily limit, please try again in a minute." },
        { status: 503 },
      );
    }
    if (error instanceof GeminiKeysExhaustedError) {
      return NextResponse.json(
        { error: "The AI service has reached its capacity for now. Nothing was counted against your daily limit, please try again later today." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "Failed to generate prompt. Nothing was counted against your daily limit, please try again." }, { status: 500 });
  }
}
