/**
 * Admin Console & Subscription Lifecycle domain logic
 * (specs/admin-console-and-subscription-lifecycle/). Pure functions
 * only -- no DB/network access here (see repository.ts), same layering
 * convention as features/rewards/domain.ts.
 */

/**
 * An admin-created account skips the self-service onboarding
 * questionnaire entirely, so `tools_used`/`depth_preference` (required,
 * NOT NULL) get these fixed defaults rather than either relaxing the
 * schema or building a second admin-facing questionnaire (PLAN.md Risks
 * -- these fields are cosmetic/personalization only, not
 * access-control-relevant anywhere in lib/permissions.ts).
 */
export const ADMIN_CREATED_ACCOUNT_DEFAULTS = {
  toolsUsed: ["ai_assisted_ide"] as const,
  depthPreference: "technical_when_needed" as const,
};

/** +1 year from now, calendar-correct (same leap-year-safe pattern as features/payments/domain.ts computeSubscriptionExpiry). */
export function oneYearFrom(date: Date): Date {
  const expiry = new Date(date.getTime());
  expiry.setUTCFullYear(expiry.getUTCFullYear() + 1);
  return expiry;
}

// Supabase's own documented convention for an effectively-permanent
// ban / lifting one -- not a project-specific magic number.
export const AUTH_BAN_DURATION_BLOCKED = "876000h";
export const AUTH_BAN_DURATION_UNBLOCKED = "none";
