import { supabaseAdmin } from "@/lib/db/client";
import type { PaymentEvent } from "@/lib/validation/schemas";

/**
 * Idempotent insert: `paypal_event_id` is UNIQUE (migration 006), so a
 * replayed webhook delivery (PayPal's documented at-least-once behavior)
 * is a no-op here, not a double-activation. Returns the existing row
 * (not an error) when the event was already recorded, so callers can
 * treat "already processed" as a normal, expected outcome.
 */
export async function recordPaymentEventIfNew(
  event: Omit<PaymentEvent, "id" | "created_at">,
): Promise<{ event: PaymentEvent; alreadyProcessed: boolean }> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const existing = await getPaymentEventByPaypalId(event.paypal_event_id);
  if (existing) {
    return { event: existing, alreadyProcessed: true };
  }

  const { data, error } = await supabaseAdmin
    .from("payment_events")
    .insert(event)
    .select()
    .single();

  if (error) {
    // Unique-constraint race (two concurrent webhook deliveries for the
    // same event): re-fetch rather than treat as a real failure.
    const raced = await getPaymentEventByPaypalId(event.paypal_event_id);
    if (raced) {
      return { event: raced, alreadyProcessed: true };
    }
    throw new Error(`Failed to record payment event: ${error.message}`);
  }

  return { event: data as PaymentEvent, alreadyProcessed: false };
}

export type PaymentEventWithEmail = PaymentEvent & { user_email: string | null };

/**
 * Most recent payment events, newest first — powers the admin payments
 * view (2026-09-14, Director's request: admin should see a payment as
 * soon as it happens). Joins user_profiles for the paying user's email
 * (a bare user_id UUID isn't useful to a human reviewing the list).
 * Read-only visibility; does NOT gate subscription activation (that
 * stays fully automatic via the webhook, unchanged — the Director
 * explicitly confirmed automatic activation over a manual approval gate).
 */
export async function getRecentPaymentEvents(limit = 50): Promise<PaymentEventWithEmail[]> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { data, error } = await supabaseAdmin
    .from("payment_events")
    .select("*, user_profiles(email)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch recent payment events: ${error.message}`);
  }

  return (data as unknown as Array<PaymentEvent & { user_profiles: { email: string } | null }>).map(
    (row) => {
      const { user_profiles, ...event } = row;
      return { ...event, user_email: user_profiles?.email ?? null };
    },
  );
}

/**
 * A single user's payment history, newest first -- powers the Admin
 * Console's per-user detail view (specs/admin-console-and-subscription-
 * lifecycle/). Unlike getRecentPaymentEvents (global, admin payments
 * feed), this is scoped to one user_id and doesn't need the email join.
 */
export async function getPaymentEventsForUser(userId: string): Promise<PaymentEvent[]> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { data, error } = await supabaseAdmin
    .from("payment_events")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch payment events for user: ${error.message}`);
  }

  return data as PaymentEvent[];
}

export async function getPaymentEventByPaypalId(
  paypalEventId: string,
): Promise<PaymentEvent | null> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { data, error } = await supabaseAdmin
    .from("payment_events")
    .select("*")
    .eq("paypal_event_id", paypalEventId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = not found
    throw new Error(`Failed to fetch payment event: ${error.message}`);
  }

  return (data as PaymentEvent) || null;
}
