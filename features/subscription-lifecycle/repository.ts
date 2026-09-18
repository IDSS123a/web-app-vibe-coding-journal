import { supabaseAdmin } from "@/lib/db/client";
import type { ExpiryNotificationType, DateWindow } from "./domain";

export interface ExpiringSubscriber {
  id: string;
  email: string;
  subscriptionExpiresAt: string;
}

/**
 * Active subscribers whose subscription_expires_at falls inside the
 * given window AND who don't already have a recorded notification for
 * this exact (notification_type, subscription_expires_at) pair --
 * the unique constraint on subscription_expiry_notifications is the
 * real idempotency guarantee; this query is just the efficient way to
 * avoid re-sending to someone already notified for this expiry.
 */
export async function findSubscribersDueForNotification(
  notificationType: ExpiryNotificationType,
  window: DateWindow,
): Promise<ExpiringSubscriber[]> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { data: candidates, error } = await supabaseAdmin
    .from("user_profiles")
    .select("id, email, subscription_expires_at")
    .eq("subscription_status", "active")
    .eq("is_blocked", false)
    .gte("subscription_expires_at", window.start.toISOString())
    .lt("subscription_expires_at", window.end.toISOString());

  if (error) {
    throw new Error(`Failed to find subscribers due for notification: ${error.message}`);
  }
  if (!candidates || candidates.length === 0) return [];

  const { data: alreadyNotified, error: notifiedError } = await supabaseAdmin
    .from("subscription_expiry_notifications")
    .select("user_id, subscription_expires_at")
    .eq("notification_type", notificationType)
    .in(
      "user_id",
      candidates.map((c) => c.id as string),
    );

  if (notifiedError) {
    throw new Error(`Failed to check existing notifications: ${notifiedError.message}`);
  }

  const notifiedKeys = new Set(
    (alreadyNotified ?? []).map((row) => `${row.user_id}:${row.subscription_expires_at}`),
  );

  return candidates
    .filter((c) => !notifiedKeys.has(`${c.id}:${c.subscription_expires_at}`))
    .map((c) => ({
      id: c.id as string,
      email: c.email as string,
      subscriptionExpiresAt: c.subscription_expires_at as string,
    }));
}

export async function recordNotificationSent(
  userId: string,
  notificationType: ExpiryNotificationType,
  subscriptionExpiresAt: string,
): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { error } = await supabaseAdmin.from("subscription_expiry_notifications").insert({
    user_id: userId,
    notification_type: notificationType,
    subscription_expires_at: subscriptionExpiresAt,
  });

  if (error) {
    // A unique-constraint conflict here means another run already
    // recorded this exact notification -- not a real failure, the
    // caller's email may have double-sent in a race, but the DB state
    // is correct either way. Any OTHER error is real and must be loud.
    if (error.code !== "23505") {
      throw new Error(`Failed to record sent notification: ${error.message}`);
    }
  }
}
