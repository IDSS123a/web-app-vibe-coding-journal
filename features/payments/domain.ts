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
