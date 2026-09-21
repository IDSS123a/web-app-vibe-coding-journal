import { supabaseAdmin } from "@/lib/db/client";

function db() {
  if (!supabaseAdmin) throw new Error("Admin client not available");
  return supabaseAdmin;
}

export interface EarnedBadge {
  badge_id: string;
  awarded_at: string;
}

export async function getEarnedBadges(userId: string): Promise<EarnedBadge[]> {
  const { data, error } = await db().from("user_badges").select("badge_id, awarded_at").eq("user_id", userId).order("awarded_at");
  if (error) throw new Error(`Failed to fetch badges: ${error.message}`);
  return data as EarnedBadge[];
}

/**
 * Records badges for a user and returns only the ones that were NEW. The primary key makes it idempotent: a badge
 * that already exists is ignored, and an upsert that ignores duplicates returns just the rows it really inserted.
 */
export async function grantBadges(userId: string, badgeIds: string[]): Promise<string[]> {
  if (badgeIds.length === 0) return [];
  const rows = [...new Set(badgeIds)].map((badge_id) => ({ user_id: userId, badge_id }));
  const { data, error } = await db().from("user_badges").upsert(rows, { onConflict: "user_id,badge_id", ignoreDuplicates: true }).select("badge_id");
  if (error) throw new Error(`Failed to grant badges: ${error.message}`);
  return (data as Array<{ badge_id: string }>).map((r) => r.badge_id);
}
