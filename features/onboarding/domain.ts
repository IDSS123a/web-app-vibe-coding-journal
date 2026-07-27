/**
 * Subscription/trial domain logic (P-13, Sprint 07)
 * Pure evaluation of subscription state — does NOT consider admin billing
 * exemption (that's an authorization concern, see lib/permissions.ts
 * isBillingExempt — composed at the call site, not folded in here).
 */

export interface SubscriptionProfile {
  subscription_status: "trial" | "active" | "expired";
  trial_ends_at: string | null;
}

export interface SubscriptionAccessResult {
  hasAccess: boolean;
  reason: "active_subscription" | "trial_active" | "trial_expired" | "subscription_expired";
}

/**
 * P-13: hard block on trial/subscription expiry, no degraded read-only
 * mode. `now` is injectable for testing (matches the pattern already used
 * by lib/cron/schedule-gate.ts).
 */
export function evaluateSubscriptionAccess(
  profile: SubscriptionProfile,
  now: Date = new Date(),
): SubscriptionAccessResult {
  if (profile.subscription_status === "active") {
    return { hasAccess: true, reason: "active_subscription" };
  }

  if (profile.subscription_status === "trial") {
    const stillInTrial = profile.trial_ends_at !== null && new Date(profile.trial_ends_at) > now;
    return stillInTrial
      ? { hasAccess: true, reason: "trial_active" }
      : { hasAccess: false, reason: "trial_expired" };
  }

  // subscription_status === "expired"
  return { hasAccess: false, reason: "subscription_expired" };
}
