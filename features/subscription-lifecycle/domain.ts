/**
 * Subscription Lifecycle domain logic
 * (specs/admin-console-and-subscription-lifecycle/). Pure functions
 * only -- no DB/network access here (see repository.ts), same layering
 * convention as features/rewards/domain.ts.
 */

export type ExpiryNotificationType = "7day" | "2day";

export const EXPIRY_WARNING_DAYS: Record<ExpiryNotificationType, number> = {
  "7day": 7,
  "2day": 2,
};

export interface DateWindow {
  start: Date;
  end: Date;
}

/**
 * The 24h window, `daysBefore` days from `now`, the daily cron checks
 * for each warning type -- e.g. daysBefore=7 -> [now+7d, now+8d). A
 * once-daily cron firing inside this window catches every subscriber
 * expiring "in about `daysBefore` days" exactly once per warning type,
 * per exact subscription_expires_at (idempotency enforced by the
 * unique constraint on subscription_expiry_notifications, not by this
 * window alone -- a missed day or a re-run is still safe).
 */
export function expiryWarningWindow(notificationType: ExpiryNotificationType, now: Date = new Date()): DateWindow {
  const daysBefore = EXPIRY_WARNING_DAYS[notificationType];
  const start = new Date(now.getTime());
  start.setUTCDate(start.getUTCDate() + daysBefore);
  const end = new Date(start.getTime());
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

// Flat, non-prorated upgrade price (Director's explicit instruction) --
// $50 (premium) - $10 (basic) = $40, named here rather than left as a
// magic number at the call site.
export const BASIC_TO_PREMIUM_UPGRADE_PRICE_USD = 40;
