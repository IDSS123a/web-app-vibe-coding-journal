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
