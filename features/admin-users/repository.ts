import { supabaseAdmin } from "@/lib/db/client";
import {
  ADMIN_CREATED_ACCOUNT_DEFAULTS,
  AUTH_BAN_DURATION_BLOCKED,
  AUTH_BAN_DURATION_UNBLOCKED,
  oneYearFrom,
} from "./domain";

export interface AdminUserSummary {
  id: string;
  email: string;
  role: string;
  subscriptionStatus: string;
  subscriptionTier: string;
  isBlocked: boolean;
  subscriptionExpiresAt: string | null;
  createdAt: string;
}

export interface AdminUserDetail extends AdminUserSummary {
  trialEndsAt: string | null;
  createdByAdminId: string | null;
  usage: {
    assistantGenerations: number;
    lessonsCompleted: number;
  };
}

interface UserProfileRow {
  id: string;
  email: string;
  role: string;
  subscription_status: string;
  subscription_tier: string;
  is_blocked: boolean;
  subscription_expires_at: string | null;
  trial_ends_at: string | null;
  created_by_admin_id: string | null;
  created_at: string;
}

function mapSummary(row: UserProfileRow): AdminUserSummary {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    subscriptionStatus: row.subscription_status,
    subscriptionTier: row.subscription_tier,
    isBlocked: row.is_blocked,
    subscriptionExpiresAt: row.subscription_expires_at,
    createdAt: row.created_at,
  };
}

export async function listUsers(): Promise<AdminUserSummary[]> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { data, error } = await supabaseAdmin
    .from("user_profiles")
    .select("id, email, role, subscription_status, subscription_tier, is_blocked, subscription_expires_at, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list users: ${error.message}`);
  }

  return (data as UserProfileRow[]).map(mapSummary);
}

export async function getUserDetail(userId: string): Promise<AdminUserDetail | null> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("user_profiles")
    .select(
      "id, email, role, subscription_status, subscription_tier, is_blocked, subscription_expires_at, trial_ends_at, created_by_admin_id, created_at",
    )
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Failed to load user: ${profileError.message}`);
  }
  if (!profile) return null;

  // Usage summary: read-only aggregation over existing tables (P-1 --
  // no new history table to keep in sync).
  const [{ count: assistantGenerations, error: assistantError }, { data: progressRows, error: progressError }] =
    await Promise.all([
      supabaseAdmin
        .from("prompt_blueprint_generations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabaseAdmin.from("course_progress").select("lessons_completed").eq("user_id", userId),
    ]);

  if (assistantError) {
    throw new Error(`Failed to count Assistant usage: ${assistantError.message}`);
  }
  if (progressError) {
    throw new Error(`Failed to load course progress: ${progressError.message}`);
  }

  const lessonsCompleted = (progressRows ?? []).reduce(
    (sum: number, row: { lessons_completed: string[] }) => sum + (row.lessons_completed?.length ?? 0),
    0,
  );

  return {
    ...mapSummary(profile as UserProfileRow),
    trialEndsAt: (profile as UserProfileRow).trial_ends_at,
    createdByAdminId: (profile as UserProfileRow).created_by_admin_id,
    usage: {
      assistantGenerations: assistantGenerations ?? 0,
      lessonsCompleted,
    },
  };
}

export async function userExistsByEmail(email: string): Promise<boolean> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { data, error } = await supabaseAdmin
    .from("user_profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check existing user: ${error.message}`);
  }
  return data !== null;
}

/**
 * Creates an account the admin's way: invites by email (Supabase sends
 * the invite; the admin never sets or sees a password -- E-4) and
 * activates the chosen tier immediately, skipping the self-service
 * trial. `toolsUsed`/`depthPreference` get sensible defaults (see
 * PLAN.md) since there's no onboarding questionnaire for this path.
 */
export async function createAdminInvitedUser(
  email: string,
  tier: "basic" | "premium",
  createdByAdminId: string,
): Promise<{ userId: string }> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { data: invited, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);
  if (inviteError || !invited.user) {
    throw new Error(`Failed to invite user: ${inviteError?.message ?? "unknown error"}`);
  }

  const expiresAt = oneYearFrom(new Date());

  const { error: profileError } = await supabaseAdmin.from("user_profiles").insert({
    id: invited.user.id,
    email,
    tools_used: [...ADMIN_CREATED_ACCOUNT_DEFAULTS.toolsUsed],
    depth_preference: ADMIN_CREATED_ACCOUNT_DEFAULTS.depthPreference,
    other_tools_freetext: null,
    subscription_status: "active",
    subscription_tier: tier,
    subscription_expires_at: expiresAt.toISOString(),
    created_by_admin_id: createdByAdminId,
  });

  if (profileError) {
    throw new Error(`Failed to create user profile: ${profileError.message}`);
  }

  return { userId: invited.user.id };
}

/**
 * Sets `is_blocked` (the single source of truth every access guard
 * flows through, features/onboarding/domain.ts) AND bans at the
 * Supabase Auth layer (defense-in-depth: stops new sign-ins
 * immediately, though an already-issued token remains valid until its
 * own expiry -- E-4's disclosed limitation, not solved here).
 */
export async function setUserBlocked(userId: string, blocked: boolean): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { error: profileError } = await supabaseAdmin
    .from("user_profiles")
    .update({ is_blocked: blocked, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (profileError) {
    throw new Error(`Failed to update block status: ${profileError.message}`);
  }

  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    ban_duration: blocked ? AUTH_BAN_DURATION_BLOCKED : AUTH_BAN_DURATION_UNBLOCKED,
  });

  if (authError) {
    // The app-data block above already succeeded and is the field every
    // access guard actually checks -- an auth-layer ban failure is real
    // but must not undo the block that already took effect (P-1.1).
    console.error(`[ADMIN_USERS] Auth-layer ban update failed for ${userId}: ${authError.message}`);
  }
}
