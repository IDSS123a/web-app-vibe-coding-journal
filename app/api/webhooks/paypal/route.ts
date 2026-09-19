/**
 * POST /api/webhooks/paypal — the sole source of truth for subscription
 * activation (Decision 2). No user session; authentication here IS
 * signature verification against PAYPAL_WEBHOOK_ID.
 *
 * Idempotency: checked early (skip already-known events without
 * re-running side effects) AND enforced by payment_events.paypal_event_id
 * being UNIQUE (migration 006) as a safety net against a genuine race
 * between two concurrent deliveries of the same event.
 *
 * The event is recorded with its ACTUAL outcome, decided AFTER attempting
 * activation — not the outcome classification predicted before trying —
 * so a DB update failure never leaves the log claiming "processed" when
 * nothing was actually activated (P-1).
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/payments/paypal-client";
import {
  getPaymentEventByPaypalId,
  recordPaymentEventIfNew,
} from "@/features/payments/repository";
import { classifyPaymentWebhookEvent, classifyUpgradeEvent, computeSubscriptionExpiry } from "@/features/payments/domain";
import { supabaseAdmin } from "@/lib/db/client";
import { sendPaymentIssueAlert, sendAdminNotification } from "@/lib/email/resend";

interface PayPalWebhookResource {
  custom_id?: string;
  amount?: { value?: string };
  purchase_units?: Array<{ custom_id?: string; amount?: { value?: string } }>;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  let event: { id?: string; event_type?: string; resource?: PayPalWebhookResource };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const transmissionId = request.headers.get("paypal-transmission-id");
  const transmissionTime = request.headers.get("paypal-transmission-time");
  const certUrl = request.headers.get("paypal-cert-url");
  const authAlgo = request.headers.get("paypal-auth-algo");
  const transmissionSig = request.headers.get("paypal-transmission-sig");

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    console.error("[PAYPAL_WEBHOOK] Missing required verification headers");
    return NextResponse.json({ error: "Missing verification headers" }, { status: 400 });
  }

  let verified: boolean;
  try {
    verified = await verifyWebhookSignature({
      transmissionId,
      transmissionTime,
      certUrl,
      authAlgo,
      transmissionSig,
      webhookEvent: event,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[PAYPAL_WEBHOOK] Signature verification request failed: ${message}`);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }

  if (!verified) {
    console.error(`[PAYPAL_WEBHOOK] Signature verification FAILED for event ${event.id}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const eventId = event.id ?? "";
  const eventType = event.event_type ?? "";
  const resource = event.resource ?? {};
  const userId = resource.custom_id ?? resource.purchase_units?.[0]?.custom_id ?? null;
  const rawAmount = resource.amount?.value ?? resource.purchase_units?.[0]?.amount?.value ?? null;
  const amountUsd = rawAmount !== null ? Number(rawAmount) : null;

  // Early idempotency check -- skip side effects entirely for a known event.
  const existing = eventId ? await getPaymentEventByPaypalId(eventId) : null;
  if (existing) {
    console.log(`[PAYPAL_WEBHOOK] Event ${eventId} already recorded, no-op`);
    return NextResponse.json({ success: true, alreadyProcessed: true });
  }

  // Admin Console & Subscription Lifecycle (specs/admin-console-and-
  // subscription-lifecycle/): a $40 capture is only ever a valid
  // Basic->Premium upgrade, never a fresh tier purchase -- check the
  // paying user's CURRENT tier before falling through to the normal
  // exact-price classifier, which has no concept of "upgrade" at all.
  let classification;
  if (amountUsd === 40 && userId && supabaseAdmin) {
    const { data: payingUser } = await supabaseAdmin
      .from("user_profiles")
      .select("subscription_tier")
      .eq("id", userId)
      .maybeSingle();
    const upgradeClassification = classifyUpgradeEvent(
      eventType,
      amountUsd,
      (payingUser?.subscription_tier as "basic" | "premium" | undefined) ?? null,
    );
    classification = upgradeClassification ?? classifyPaymentWebhookEvent(eventType, amountUsd);
  } else {
    classification = classifyPaymentWebhookEvent(eventType, amountUsd);
  }

  if (classification.kind === "ignored") {
    await recordPaymentEventIfNew({
      paypal_event_id: eventId,
      event_type: eventType,
      user_id: userId,
      tier: null,
      amount_usd: amountUsd,
      status: "ignored",
      raw_payload: event,
    });
    console.log(`[PAYPAL_WEBHOOK] Ignored event ${eventId}: ${classification.reason}`);
    return NextResponse.json({ success: true, ignored: true });
  }

  if (classification.kind === "ambiguous" || !userId) {
    const reason = classification.kind === "ambiguous" ? classification.reason : "no user_id to correlate";
    await recordPaymentEventIfNew({
      paypal_event_id: eventId,
      event_type: eventType,
      user_id: userId,
      tier: null,
      amount_usd: amountUsd,
      status: "ambiguous",
      raw_payload: event,
    });
    console.warn(`[PAYPAL_WEBHOOK] Ambiguous event ${eventId}: ${reason}`);
    await sendPaymentIssueAlert({ paypalEventId: eventId, eventType, reason, userId });
    return NextResponse.json({ success: true, ambiguous: true });
  }

  // classification.kind === "processed" and userId is present
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const expiresAt = computeSubscriptionExpiry(new Date());
  const { error } = await supabaseAdmin
    .from("user_profiles")
    .update({
      subscription_status: "active",
      subscription_tier: classification.tier,
      subscription_expires_at: expiresAt.toISOString(),
    })
    .eq("id", userId);

  // Record the ACTUAL outcome, not the predicted one -- a DB failure here
  // means activation did not happen, so the log must say "ambiguous", not
  // "processed", regardless of what classification predicted.
  const actualStatus = error ? "ambiguous" : "processed";
  await recordPaymentEventIfNew({
    paypal_event_id: eventId,
    event_type: eventType,
    user_id: userId,
    tier: classification.tier,
    amount_usd: amountUsd,
    status: actualStatus,
    raw_payload: event,
  });

  if (error) {
    console.error(`[PAYPAL_WEBHOOK] Failed to activate subscription for ${userId}: ${error.message}`);
    await sendPaymentIssueAlert({
      paypalEventId: eventId,
      eventType,
      reason: `DB update failed: ${error.message}`,
      userId,
    });
    return NextResponse.json({ success: false }, { status: 500 });
  }

  console.log(`[PAYPAL_WEBHOOK] Activated ${classification.tier} subscription for user ${userId}`);

  // 2026-09-14, Director's request: admin sees a payment as soon as it
  // happens (not just problems, via sendPaymentIssueAlert above). Does
  // NOT gate activation -- the subscription is already live by the time
  // this fires; this is visibility, not an approval step (confirmed
  // explicitly with the Director rather than assumed, see
  // DECISION_LOG.md PDL-030's sibling discussion the same day).
  // Best-effort: a failed notification must never undo or fail the
  // activation that already succeeded above.
  void sendAdminNotification({
    subject: `New ${classification.tier} subscription, $${amountUsd ?? "?"}`,
    html: `
<h2>New Subscription Activated</h2>
<p><strong>Tier:</strong> ${classification.tier}</p>
<p><strong>Amount:</strong> $${amountUsd ?? "unknown"}</p>
<p><strong>User ID:</strong> ${userId}</p>
<p><strong>PayPal event:</strong> ${eventId}</p>
<p>Already active -- this is a notification, not an approval request.</p>
    `.trim(),
  }).catch(() => undefined);

  return NextResponse.json({ success: true, activated: true });
}
