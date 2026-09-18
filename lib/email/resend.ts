/**
 * Email notifications via Resend
 * E-8: Monitoring via email alerts
 */

import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const reviewQueueEmail = process.env.REVIEW_QUEUE_EMAIL || "admin@example.com";
// Resend requires a verified domain for custom senders; onboarding@resend.dev
// is the universally-available fallback usable without domain verification.
const fromAddress = process.env.RESEND_FROM || "Vibe-Coding Journal <onboarding@resend.dev>";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Send review queue alert when Daily Report is held for review
 * P-6: Notify human when auto-publish is interrupted
 */
export async function sendReviewQueueAlert(payload: {
  date: string;
  articleCount: number;
  reasons: string[]; // e.g. ["Low confidence (45%)", "Hype word detected"]
  // PDL-012: distinguishes "quota exhausted, wait until tomorrow" from
  // "possible account suspension, act now" at the point the Director
  // actually sees it first — the inbox subject line, before opening the
  // email — not just in the body text.
  urgent?: boolean;
}): Promise<boolean> {
  if (!resend || !resendApiKey) {
    console.warn("[EMAIL] Resend not configured — skipping review queue alert");
    return false;
  }

  try {
    const reasonsList = payload.reasons.map((r) => `• ${r}`).join("\n");
    const subjectTag = payload.urgent ? "[URGENT — ACTION NEEDED]" : "[REVIEW]";
    const urgentBanner = payload.urgent
      ? `<p style="background:#fee2e2;color:#991b1b;padding:12px;border-radius:6px;font-weight:bold;">⚠ Possible AI provider account suspension detected — not ordinary quota exhaustion. Verify account/key status now.</p>`
      : "";

    const html = `
<h2>Vibe-Coding Journal — Review Required</h2>
${urgentBanner}
<p><strong>Date:</strong> ${payload.date}</p>
<p><strong>Articles:</strong> ${payload.articleCount}</p>
<p><strong>Issues:</strong></p>
<pre>${reasonsList}</pre>
<p><a href="https://app.example.com/admin/review-queue">Review in dashboard →</a></p>
    `.trim();

    const { error } = await resend.emails.send({
      from: fromAddress,
      to: reviewQueueEmail,
      subject: `${subjectTag} Daily digest for ${payload.date} — ${payload.articleCount} articles`,
      html,
    });

    if (error) {
      console.error("[EMAIL] Failed to send review alert:", error);
      return false;
    }

    console.log(`[EMAIL] Review alert sent to ${reviewQueueEmail}`);
    return true;
  } catch (err) {
    console.error("[EMAIL] Error sending review alert:", err);
    return false;
  }
}

/**
 * Send payment-issue alert (Sprint 08, P-16, Decision 3).
 * Deliberately a separate function from sendReviewQueueAlert, not a
 * variant of it — a payment ambiguity and a held Daily Report are
 * different severities and different audiences, and P-1 applied to money
 * means this must never be silently folded into unrelated notifications.
 * `[PAYMENT ISSUE]` mirrors the `[URGENT]` escalation precedent from
 * PDL-012: distinct at the inbox subject line, before opening the email.
 */
export async function sendPaymentIssueAlert(payload: {
  paypalEventId: string;
  eventType: string;
  reason: string;
  userId: string | null;
}): Promise<boolean> {
  if (!resend || !resendApiKey) {
    console.warn("[EMAIL] Resend not configured — skipping payment issue alert");
    return false;
  }

  try {
    const html = `
<h2>Vibe-Coding Journal — Payment Requires Manual Review</h2>
<p style="background:#fee2e2;color:#991b1b;padding:12px;border-radius:6px;font-weight:bold;">⚠ A PayPal webhook event could not be resolved automatically — do not assume it succeeded or failed.</p>
<p><strong>PayPal event ID:</strong> ${payload.paypalEventId}</p>
<p><strong>Event type:</strong> ${payload.eventType}</p>
<p><strong>Reason:</strong> ${payload.reason}</p>
<p><strong>User ID:</strong> ${payload.userId ?? "unknown — could not correlate to a user"}</p>
    `.trim();

    const { error } = await resend.emails.send({
      from: fromAddress,
      to: reviewQueueEmail,
      subject: `[PAYMENT ISSUE] ${payload.eventType} — manual review needed`,
      html,
    });

    if (error) {
      console.error("[EMAIL] Failed to send payment issue alert:", error);
      return false;
    }

    console.log(`[EMAIL] Payment issue alert sent to ${reviewQueueEmail}`);
    return true;
  } catch (err) {
    console.error("[EMAIL] Error sending payment issue alert:", err);
    return false;
  }
}

/**
 * Send admin notification (generic)
 * For future use: errors, warnings, system events
 */
export async function sendAdminNotification(payload: {
  subject: string;
  html: string;
}): Promise<boolean> {
  if (!resend || !resendApiKey) {
    console.warn("[EMAIL] Resend not configured — skipping admin notification");
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: fromAddress,
      to: reviewQueueEmail,
      subject: `[ADMIN] ${payload.subject}`,
      html: payload.html,
    });

    if (error) {
      console.error("[EMAIL] Failed to send admin notification:", error);
      return false;
    }

    console.log(`[EMAIL] Admin notification sent to ${reviewQueueEmail}`);
    return true;
  } catch (err) {
    console.error("[EMAIL] Error sending admin notification:", err);
    return false;
  }
}

/**
 * Subscription-expiry warning (specs/admin-console-and-subscription-
 * lifecycle/) -- sent 7 days and again 2 days before
 * subscription_expires_at (app/api/cron/subscription-expiry-check).
 * This is the first USER-facing transactional email in this project;
 * every prior use of Resend (above) notified the admin, not a
 * subscriber, so this is a genuinely new audience for the `to` field.
 */
export async function sendSubscriptionExpiringEmail(payload: {
  to: string;
  daysRemaining: 7 | 2;
  expiresAt: string; // ISO date
}): Promise<boolean> {
  if (!resend || !resendApiKey) {
    console.warn("[EMAIL] Resend not configured — skipping subscription-expiry email");
    return false;
  }

  const expiresDateText = new Date(payload.expiresAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  try {
    const { error } = await resend.emails.send({
      from: fromAddress,
      to: payload.to,
      subject:
        payload.daysRemaining === 7
          ? "Your Vibe-Coding Journal subscription expires in 7 days"
          : "Your Vibe-Coding Journal subscription expires in 2 days",
      html: `
<h2>Your subscription is about to expire</h2>
<p>Your annual Vibe-Coding Journal subscription expires on <strong>${expiresDateText}</strong> (in ${payload.daysRemaining} days).</p>
<p>Renew before then to keep uninterrupted access to your Daily Report, Archive, Bookmarks, and any Premium features on your plan.</p>
<p>Sign in to your account to renew.</p>
      `.trim(),
    });

    if (error) {
      console.error(`[EMAIL] Failed to send subscription-expiry email to ${payload.to}:`, error);
      return false;
    }

    console.log(`[EMAIL] Subscription-expiry (${payload.daysRemaining}-day) email sent to ${payload.to}`);
    return true;
  } catch (err) {
    console.error(`[EMAIL] Error sending subscription-expiry email to ${payload.to}:`, err);
    return false;
  }
}
