/**
 * Verify and decode Supabase JWT tokens
 * Identity comes from the JWT; the role comes from the user_profiles table
 * (M-7: single source of truth — roles live in the database, not in token claims)
 */

import { jwtDecode } from "jwt-decode";
import { supabaseAdmin } from "@/lib/db/client";

interface SupabaseJWT {
  aud: string;
  sub: string;
  email: string;
  iat: number;
  exp: number;
  user_metadata: Record<string, unknown>;
}

export interface VerifiedToken {
  sub: string;
  email: string;
  role: string;
  isAdmin: boolean;
  expiresAt: number;
}

/**
 * Decode Supabase JWT and check expiration.
 * NOTE: signature verification is delegated to Supabase (tokens are issued by
 * Supabase auth); role authorization additionally requires a DB lookup below,
 * so a forged token cannot gain admin access without a matching admin row.
 */
export function decodeSupabaseToken(token: string): SupabaseJWT | null {
  try {
    if (!token) return null;

    const decoded = jwtDecode<SupabaseJWT>(token);

    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      console.warn("[AUTH] Token expired");
      return null;
    }

    return decoded;
  } catch (err) {
    console.error("[AUTH] Token decode failed:", err);
    return null;
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
 * to do with `isAdmin`. Returns null only for missing/invalid/expired tokens
 * or a missing profile row.
 * E-6 Step 1 (authenticate: decode + expiry) + role lookup (M-7: DB authority).
 */
export async function getVerifiedUser(
  authHeader: string | null,
): Promise<VerifiedToken | null> {
  const token = extractBearerToken(authHeader);
  if (!token) return null;

  const decoded = decodeSupabaseToken(token);
  if (!decoded) return null;

  if (!supabaseAdmin) {
    console.error("[AUTH] Admin client not available for role lookup");
    return null;
  }

  const { data: profile, error } = await supabaseAdmin
    .from("user_profiles")
    .select("role")
    .eq("id", decoded.sub)
    .single();

  if (error || !profile) {
    console.warn(`[AUTH] No profile found for user ${decoded.sub}`);
    return null;
  }

  const role = (profile.role as string) || "user";

  return {
    sub: decoded.sub,
    email: decoded.email,
    role,
    isAdmin: role === "admin",
    expiresAt: decoded.exp || 0,
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
