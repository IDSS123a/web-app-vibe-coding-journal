/**
 * Payment domain logic (Sprint 08, P-16, P-1 applied to money)
 * Pure functions — no I/O, no Supabase, no PayPal SDK calls. Signature
 * verification happens at the API route layer (it needs the raw request
 * body/headers); this layer only classifies an already-verified event.
 */

export type TierName = "basic" | "premium";

// PDL-014: flat annual prices, exact match required. P-1: if an amount
// doesn't exactly match either tier, that's ambiguous, not "close enough
// to guess" -- a payment discrepancy is exactly the kind of thing that
// must never resolve silently.
const TIER_PRICES_USD: Record<TierName, number> = {
  basic: 10,
  premium: 50,
};

export function mapAmountToTier(amountUsd: number): TierName | null {
  if (amountUsd === TIER_PRICES_USD.basic) return "basic";
  if (amountUsd === TIER_PRICES_USD.premium) return "premium";
  return null;
}

export type WebhookClassification =
  | { kind: "processed"; tier: TierName; amountUsd: number }
  | { kind: "ambiguous"; reason: string }
  | { kind: "ignored"; reason: string };

// Precursor/informational PayPal event types that are real and expected,
// but are not themselves confirmation that funds moved -- PAYMENT.CAPTURE
// .COMPLETED is the only event this project activates a subscription on
// (Decision 2: webhook, specifically the capture confirmation, is the
// sole source of truth).
const KNOWN_NON_ACTIVATING_EVENT_TYPES = new Set([
  "CHECKOUT.ORDER.APPROVED",
  "PAYMENT.CAPTURE.PENDING",
  "PAYMENT.CAPTURE.DECLINED",
]);

// Admin Console & Subscription Lifecycle (specs/admin-console-and-
// subscription-lifecycle/): the flat, non-prorated Basic->Premium
// upgrade price. Separate from TIER_PRICES_USD deliberately -- $40 is
// never a valid amount for a FRESH tier purchase, only for an upgrade
// from an existing Basic subscriber, so it must not be folded into
// mapAmountToTier's exact-match table (that would let a stray $40
// charge silently activate a "premium" tier purchase for a brand-new
// or already-premium user with no Basic-tier check at all).
const UPGRADE_PRICE_USD = 40;

/**
 * Classifies a capture event as a valid Basic->Premium upgrade, or
 * returns null if it isn't one -- the caller (the webhook route) falls
 * through to the normal classifyPaymentWebhookEvent when this returns
 * null, so an ordinary $10/$50 payment is completely unaffected by this
 * function's existence.
 *
 * Same fail-loud discipline as classifyPaymentWebhookEvent (PDL-014):
 * a $40 capture only ever activates a premium upgrade when the paying
 * user's CURRENT tier is exactly "basic" -- any other combination
 * (already premium, unknown user) is deliberately left unclassified
 * here so the caller's normal ambiguous-path alert fires, rather than
 * silently upgrading an account that shouldn't be.
 */
export function classifyUpgradeEvent(
  eventType: string,
  amountUsd: number | null,
  currentTier: TierName | null,
): WebhookClassification | null {
  if (eventType !== "PAYMENT.CAPTURE.COMPLETED") return null;
  if (amountUsd !== UPGRADE_PRICE_USD) return null;
  if (currentTier !== "basic") return null;

  return { kind: "processed", tier: "premium", amountUsd };
}

export function classifyPaymentWebhookEvent(
  eventType: string,
  amountUsd: number | null,
): WebhookClassification {
  if (KNOWN_NON_ACTIVATING_EVENT_TYPES.has(eventType)) {
    return { kind: "ignored", reason: `${eventType} is not an activation trigger` };
  }

  if (eventType !== "PAYMENT.CAPTURE.COMPLETED") {
    return { kind: "ambiguous", reason: `unrecognized event type: ${eventType}` };
  }

  if (amountUsd === null) {
    return { kind: "ambiguous", reason: "capture completed but amount missing from payload" };
  }

  const tier = mapAmountToTier(amountUsd);
  if (!tier) {
    return { kind: "ambiguous", reason: `amount ${amountUsd} does not match either tier's price` };
  }

  return { kind: "processed", tier, amountUsd };
}

/**
 * +1 year from confirmation, calendar-correct. Commander's
 * FEATURE_LIFECYCLE.md explicitly warns "add N years to a date" logic
 * needs explicit leap-year Feb 29 test coverage, not just today's date --
 * setUTCFullYear naturally rolls Feb 29 -> Mar 1 in a non-leap target
 * year (there is no Feb 29 to land on), which is the correct behavior
 * here, verified explicitly rather than assumed.
 */
export function computeSubscriptionExpiry(confirmedAt: Date): Date {
  const expiry = new Date(confirmedAt.getTime());
  expiry.setUTCFullYear(expiry.getUTCFullYear() + 1);
  return expiry;
}

// ---------- who may start a payment, and when the new year starts (PDL-079, before real money) ----------

/** A plan can be renewed in its last 14 days (the reminder e-mails come at 7 and 2 days), or at any time after it has ended. */
export const RENEWAL_WINDOW_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface PurchaseContext {
  status: "trial" | "active" | "expired";
  tier: TierName;
  expiresAt: Date | null;
  now: Date;
}

export type OrderEligibility = { ok: true } | { ok: false; reason: string };

/**
 * Stops a customer from paying for something they already have. Real money is involved, so the server refuses, not just the
 * screen: an active plan cannot be bought again before its last 14 days, a lower plan cannot be bought over a higher one, and
 * Premium cannot be bought at $50 over an active Basic (that is the $40 upgrade). Trial and ended plans can buy anything.
 */
export function checkFreshOrderEligibility(requested: TierName, ctx: PurchaseContext): OrderEligibility {
  const stillActive = ctx.status === "active" && (ctx.expiresAt === null || ctx.expiresAt.getTime() > ctx.now.getTime());
  if (!stillActive) return { ok: true };
  if (requested === "basic" && ctx.tier === "premium") return { ok: false, reason: "You already have Premium, which includes Basic." };
  if (requested === "premium" && ctx.tier === "basic") return { ok: false, reason: "Use the upgrade to Premium instead of buying it again." };
  if (ctx.expiresAt === null) return { ok: false, reason: "Your plan is already active." };
  const daysLeft = (ctx.expiresAt.getTime() - ctx.now.getTime()) / DAY_MS;
  if (daysLeft > RENEWAL_WINDOW_DAYS) return { ok: false, reason: `Your plan is active until ${ctx.expiresAt.toISOString().slice(0, 10)}. You can renew in its last ${RENEWAL_WINDOW_DAYS} days.` };
  return { ok: true };
}

/**
 * The end date after a confirmed payment.
 * - The $40 upgrade starts a NEW 12 months on the day it is paid (Director, 2026-09-21).
 * - A renewal made in the last 14 days starts when the current year ends, so nothing already paid for is lost.
 * - Any other payment (first purchase, after the trial, after the plan ended) starts on the day it is paid.
 */
export function computePurchaseExpiry(kind: "upgrade" | "purchase", ctx: { status: PurchaseContext["status"]; expiresAt: Date | null; now: Date }): Date {
  if (kind === "purchase" && ctx.status === "active" && ctx.expiresAt !== null && ctx.expiresAt.getTime() > ctx.now.getTime()) {
    return computeSubscriptionExpiry(ctx.expiresAt);
  }
  return computeSubscriptionExpiry(ctx.now);
}
