/**
 * Cron endpoint: /api/cron/subscription-expiry-check
 * Daily job: emails every active subscriber whose subscription_expires_at
 * falls exactly 7 days or exactly 2 days from now (specs/admin-console-
 * and-subscription-lifecycle/). Security: Requires CRON_SECRET header,
 * same pattern as app/api/cron/daily-digest/route.ts.
 *
 * Idempotent per (user_id, notification_type, subscription_expires_at) --
 * migration 020's unique constraint is the real guarantee; safe to
 * trigger more than once a day if ever needed.
 */

import { NextRequest, NextResponse } from "next/server";
import { expiryWarningWindow, type ExpiryNotificationType } from "@/features/subscription-lifecycle/domain";
import { findSubscribersDueForNotification, recordNotificationSent } from "@/features/subscription-lifecycle/repository";
import { sendSubscriptionExpiringEmail } from "@/lib/email/resend";
import { isValidCronSecret } from "@/lib/cron/auth";

function validateCronAuth(request: NextRequest): boolean {
  return isValidCronSecret(request.headers.get("authorization"));
}

async function processNotificationType(notificationType: ExpiryNotificationType): Promise<number> {
  const window = expiryWarningWindow(notificationType);
  const subscribers = await findSubscribersDueForNotification(notificationType, window);

  let sent = 0;
  for (const subscriber of subscribers) {
    const daysRemaining = notificationType === "7day" ? 7 : 2;
    const emailed = await sendSubscriptionExpiringEmail({
      to: subscriber.email,
      daysRemaining,
      expiresAt: subscriber.subscriptionExpiresAt,
    });

    // Record even if the email send failed (Resend not configured, or a
    // transient provider error) -- an emailed:false is logged loudly by
    // sendSubscriptionExpiringEmail itself; recording anyway prevents a
    // permanently-misconfigured mail provider from generating an
    // unbounded retry storm against the same subscriber every single
    // day. A real, persistent email outage is an operational issue to
    // catch via server logs, not something this per-subscriber loop
    // should re-attempt indefinitely.
    await recordNotificationSent(subscriber.id, notificationType, subscriber.subscriptionExpiresAt);
    if (emailed) sent += 1;
  }

  return sent;
}

export async function POST(request: NextRequest) {
  try {
    if (!validateCronAuth(request)) {
      console.error("[EXPIRY_CRON] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [sevenDaySent, twoDaySent] = await Promise.all([
      processNotificationType("7day"),
      processNotificationType("2day"),
    ]);

    console.log(`[EXPIRY_CRON] Sent ${sevenDaySent} 7-day and ${twoDaySent} 2-day warnings`);
    return NextResponse.json({ success: true, sevenDaySent, twoDaySent });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[EXPIRY_CRON] Failed: ${message}`);
    return NextResponse.json({ error: "Failed to run expiry check" }, { status: 500 });
  }
}
