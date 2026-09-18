/**
 * Verify Supabase access tokens.
 * Identity comes from a token that Supabase Auth itself has verified; the
 * role comes from the user_profiles table
 * (M-7: single source of truth — roles live in the database, not in token claims)
 *
 * SECURITY FIX 2026-09-18 (found in a full stress test): this module used to
 * "verify" a token with jwt-decode, which only base64-decodes the payload
 * and never checks the signature. Its comment claimed signature verification
 * was "delegated to Supabase", but nothing ever called Supabase -- so ANY
 * hand-built token carrying a real user's id in `sub` (garbage signature and
 * all) was accepted, including the admin's, on every protected route. Proven
 * live against production before the fix: a forged token returned
 * isAdmin:true from /api/me and the full user list from /api/admin/users.
 * Tokens are now verified by Supabase Auth (`auth.getUser`), which checks
 * signature, expiry and that the user still exists.
 */

import { jwtDecode } from "jwt-decode";
import { supabaseAdmin } from "@/lib/db/client";

export interface VerifiedToken {
  sub: string;
  email: string;
  role: string;
  isAdmin: boolean;
  expiresAt: number;
  subscriptionStatus: "trial" | "active" | "expired";
  trialEndsAt: string | null;
  subscriptionTier: "basic" | "premium";
  // Admin Console & Subscription Lifecycle (specs/admin-console-and-
  // subscription-lifecycle/, migration 020).
  isBlocked: boolean;
}

/**
 * Reads `exp` from a token. ONLY ever called on a token Supabase Auth has
 * already verified -- decoding alone proves nothing about a token's
 * authenticity and must never be used to make a trust decision.
 */
function readExpiryOfVerifiedToken(token: string): number {
  try {
    return jwtDecode<{ exp?: number }>(token).exp ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Extract Bearer token from Authorization header
 * E-6 Step 1: Standard Bearer token extraction
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0]!.toLowerCase() !== "bearer") {
    console.warn("[AUTH] Invalid authorization header format");
    return null;
  }

  return parts[1]!;
}

/**
 * Verify Bearer token and resolve the user + role from user_profiles.
 * Returns the user for ANY valid token (admin or not); callers decide what
 * to do with `isAdmin`. Returns null for missing/forged/invalid/expired
 * tokens or a missing profile row.
 * E-6 Step 1 (authenticate: Supabase Auth verifies signature + expiry) +
 * role lookup (M-7: DB authority).
 */
export async function getVerifiedUser(
  authHeader: string | null,
): Promise<VerifiedToken | null> {
  const token = extractBearerToken(authHeader);
  if (!token) return null;

  if (!supabaseAdmin) {
    console.error("[AUTH] Admin client not available for token verification");
    return null;
  }

  // The actual authentication step: Supabase Auth validates the signature,
  // the expiry and that the user exists. A forged token fails here.
  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !authData.user) {
    console.warn("[AUTH] Token rejected by Supabase Auth");
    return null;
  }
  const authUser = authData.user;

  const { data: profile, error } = await supabaseAdmin
    .from("user_profiles")
    .select("role, subscription_status, trial_ends_at, subscription_tier, is_blocked")
    .eq("id", authUser.id)
    .single();

  if (error || !profile) {
    console.warn(`[AUTH] No profile found for user ${authUser.id}`);
    return null;
  }

  const role = (profile.role as string) || "user";

  return {
    sub: authUser.id,
    email: authUser.email ?? "",
    role,
    isAdmin: role === "admin",
    expiresAt: readExpiryOfVerifiedToken(token),
    subscriptionStatus: (profile.subscription_status as VerifiedToken["subscriptionStatus"]) || "expired",
    trialEndsAt: (profile.trial_ends_at as string | null) ?? null,
    subscriptionTier: (profile.subscription_tier as VerifiedToken["subscriptionTier"]) || "basic",
    isBlocked: (profile.is_blocked as boolean) ?? false,
  };
}

/**
 * Verify Bearer token AND require admin role.
 * E-6 Step 2 (authorize): returns null for valid-but-non-admin tokens.
 */
export async function verifyAdminToken(
  authHeader: string | null,
): Promise<VerifiedToken | null> {
  const user = await getVerifiedUser(authHeader);
  if (!user) return null;

  if (!user.isAdmin) {
    console.warn(`[AUTH] User ${user.email} attempted admin action without admin role`);
    return null;
  }

  return user;
}
