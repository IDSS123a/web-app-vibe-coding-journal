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
}): Promise<boolean> {
  if (!resend || !resendApiKey) {
    console.warn("[EMAIL] Resend not configured — skipping review queue alert");
    return false;
  }

  try {
    const reasonsList = payload.reasons.map((r) => `• ${r}`).join("\n");

    const html = `
<h2>Vibe-Coding Journal — Review Required</h2>
<p><strong>Date:</strong> ${payload.date}</p>
<p><strong>Articles:</strong> ${payload.articleCount}</p>
<p><strong>Issues:</strong></p>
<pre>${reasonsList}</pre>
<p><a href="https://app.example.com/admin/review-queue">Review in dashboard →</a></p>
    `.trim();

    const { error } = await resend.emails.send({
      from: fromAddress,
      to: reviewQueueEmail,
      subject: `[REVIEW] Daily digest for ${payload.date} — ${payload.articleCount} articles`,
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
