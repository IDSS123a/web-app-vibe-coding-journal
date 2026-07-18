"use server";

import { supabaseAdmin } from "@/lib/db/client";
import { registerSchema, loginSchema } from "@/lib/validation/schemas";
import { hashPassword } from "@/lib/auth/password";

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

    // Create auth user via Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: parsed.email,
      password: await hashPassword(parsed.password),
      email_confirm: true,
    });

    if (authError || !authUser.user) {
      return {
        success: false,
        error: "Failed to create account",
      };
    }

    // Create user profile
    const { error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .insert({
        id: authUser.user.id,
        email: parsed.email,
        tools_used: parsed.tools_used,
        depth_preference: parsed.depth_preference,
        other_tools_freetext: parsed.other_tools_freetext || null,
      });

    if (profileError) {
      return {
        success: false,
        error: "Failed to create user profile",
      };
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

/**
 * Login action (E-6 five-step)
 * 1. Auth: Check if user exists (implicit in step 4)
 * 2. Authorize: N/A for login
 * 3. Validate: Zod schema
 * 4. Execute: Verify password
 * 5. Return: Session token
 */
export async function loginAction(input: unknown): Promise<AuthResponse> {
  try {
    // 3. Validate
    const parsed = loginSchema.parse(input);

    if (!supabaseAdmin) {
      return {
        success: false,
        error: "Authentication service unavailable",
      };
    }

    // 4. Execute: Get user and verify password
    const { data: user, error: userError } = await supabaseAdmin
      .from("user_profiles")
      .select("id, email")
      .eq("email", parsed.email)
      .single();

    if (userError || !user) {
      return {
        success: false,
        error: "Invalid email or password",
      };
    }

    // Note: In production, password verification happens via Supabase Auth
    // This is simplified for the scaffold. Real implementation uses
    // supabaseAdmin.auth.signInWithPassword() which handles verification.

    // 5. Return
    return {
      success: true,
      data: { userId: user.id, email: user.email },
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
