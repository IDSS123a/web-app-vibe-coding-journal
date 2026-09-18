/**
 * Subscription/trial domain logic (P-13, Sprint 07)
 * Pure evaluation of subscription state — does NOT consider admin billing
 * exemption (that's an authorization concern, see lib/permissions.ts
 * isBillingExempt — composed at the call site, not folded in here).
 */

export interface SubscriptionProfile {
  subscription_status: "trial" | "active" | "expired";
  trial_ends_at: string | null;
  // Admin Console & Subscription Lifecycle (specs/admin-console-and-
  // subscription-lifecycle/, migration 020). Optional so every existing
  // call site that hasn't been updated to fetch it yet still compiles
  // and behaves exactly as before (undefined is falsy) -- callers should
  // pass the real value once available.
  is_blocked?: boolean;
}

export interface SubscriptionAccessResult {
  hasAccess: boolean;
  reason: "blocked" | "active_subscription" | "trial_active" | "trial_expired" | "subscription_expired";
}

/**
 * P-13: hard block on trial/subscription expiry, no degraded read-only
 * mode. `now` is injectable for testing (matches the pattern already used
 * by lib/cron/schedule-gate.ts).
 *
 * `is_blocked` is checked FIRST, before status/trial logic, and
 * overrides an otherwise-active/in-trial subscription -- this is the
 * single source of truth every existing guard (SubscriptionGuard,
 * PremiumGuard via canAccessUniversity/canAccessPromptAssistant, /api/me)
 * already flows through, so blocking a user here propagates everywhere
 * automatically (M-7). Admin's isBillingExempt bypass, composed at each
 * call site exactly as before, still overrides this for an admin
 * account -- blocking is a control an admin exercises over OTHER users,
 * not a mechanism expected to lock out an admin's own account.
 */
export function evaluateSubscriptionAccess(
  profile: SubscriptionProfile,
  now: Date = new Date(),
): SubscriptionAccessResult {
  if (profile.is_blocked) {
    return { hasAccess: false, reason: "blocked" };
  }

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
