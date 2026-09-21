"use server";

import { supabaseAdmin } from "@/lib/db/client";
import { registerSchema } from "@/lib/validation/schemas";
import { TRIAL_DAYS } from "@/lib/pricing";
import { awardCoins } from "@/features/rewards/repository";

interface AuthResponse {
  success: boolean;
  error?: string;
  data?: unknown;
}

/**
 * Registration action (E-6 five-step: auth → authorize → validate → execute → return)
 * 1. Auth: Not required for registration (public endpoint)
 * 2. Authorize: Not required for registration (public endpoint)
 * 3. Validate: Zod schema (E-2)
 * 4. Execute: Create user + profile
 * 5. Return: User-friendly response
 */
export async function registerAction(input: unknown): Promise<AuthResponse> {
  try {
    // 3. Validate
    const parsed = registerSchema.parse(input);

    if (!supabaseAdmin) {
      return {
        success: false,
        error: "Authentication service unavailable",
      };
    }

    // 4. Execute: Check if user exists
    const { data: existing } = await supabaseAdmin
      .from("user_profiles")
      .select("id")
      .eq("email", parsed.email)
      .single();

    if (existing) {
      return {
        success: false,
        error: "Email already registered",
      };
    }

    // Create auth user via Supabase Auth. Supabase's Admin API hashes the
    // password itself internally -- it must receive the plaintext value,
    // never a pre-hashed one (hashing an already-hashed string here would
    // make the stored credential correspond to bcrypt_hash_of(password),
    // not password itself, so no user could ever sign back in with their
    // real password -- confirmed live during Sprint 07 verification).
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: parsed.email,
      password: parsed.password,
      email_confirm: true,
    });

    if (authError || !authUser.user) {
      return {
        success: false,
        error: "Failed to create account",
      };
    }

    // Create user profile
    // P-13 (Sprint 07): 3-day trial, Premium-level access during trial
    // (Director-confirmed 2026-07-23, sprints/SPRINT_07.md Decision 1).
    const trialStartedAt = new Date();
    const trialEndsAt = new Date(trialStartedAt.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    const { error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .insert({
        id: authUser.user.id,
        email: parsed.email,
        tools_used: parsed.tools_used,
        depth_preference: parsed.depth_preference,
        other_tools_freetext: parsed.other_tools_freetext || null,
        terms_accepted_at: new Date().toISOString(),
        subscription_status: "trial",
        trial_started_at: trialStartedAt.toISOString(),
        trial_ends_at: trialEndsAt.toISOString(),
        subscription_tier: "premium",
      });

    if (profileError) {
      return {
        success: false,
        error: "Failed to create user profile",
      };
    }

    // Gamification Wave 2: onboarding_complete awarded here, server-side,
    // rather than as a client-side award() call from RegisterForm --
    // registerAction runs via supabaseAdmin.auth.admin.createUser, which
    // does NOT establish a client-side session, so there is no token
    // RegisterForm could attach to a fetch call at this point. Awarding
    // it directly (same dedupeKey=null pattern as any other
    // at-most-once event) means the coins are already there the moment
    // the user actually signs in and RewardsProvider loads their state
    // -- the live celebration just doesn't play on the register page
    // itself, a reasonable trade-off given there's no session to show
    // it in. Best-effort: a failed award must never fail registration
    // itself (M-4 / P-1.1 -- reward feedback is a delight layer).
    try {
      await awardCoins(authUser.user.id, "onboarding_complete", null);
    } catch (rewardError) {
      const msg = rewardError instanceof Error ? rewardError.message : String(rewardError);
      console.error(`[ONBOARDING] onboarding_complete award failed (non-fatal): ${msg}`);
    }

    // 5. Return
    return {
      success: true,
      data: { userId: authUser.user.id, email: parsed.email },
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}
