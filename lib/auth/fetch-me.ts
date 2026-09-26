"use client";

/**
 * Shared /api/me fetch with in-flight de-duplication.
 *
 * Found live 2026-09-26: many components independently check /api/me on
 * their own (SiteNav for the admin link, SubscriptionGuard or PremiumGuard
 * for the paywall, TrialBanner/RenewalBanner/UpgradeToPremiumBanner for
 * their own state) -- on a single page with two or three of them mounted
 * at once, that meant two or three full round trips for the identical
 * answer, each costing 0.7 to 1.2s server-side (getVerifiedUser's own two
 * Supabase round trips), measured as the reason /archive and /dictionary
 * felt slow to load.
 *
 * fetchMe collapses concurrent calls for the SAME token into one real
 * request. A call made after the in-flight one has already resolved still
 * fires a fresh request, so a component that polls (the payment-approval
 * banners) keeps seeing up-to-date state exactly as before -- only calls
 * that genuinely overlap in time are merged.
 */

export interface MeResponse {
  authenticated: boolean;
  isAdmin: boolean;
  email?: string;
  hasAccess: boolean;
  accessReason: string;
  hasUniversityAccess: boolean;
  hasAssistantAccess: boolean;
  hasPromptSchoolAccess: boolean;
  subscriptionTier: "basic" | "premium" | null;
  subscriptionStatus: "trial" | "active" | "expired" | null;
  isBlocked: boolean;
  trialEndsAt: string | null;
  subscriptionExpiresAt: string | null;
  paypalMode?: "sandbox" | "live";
}

let inFlight: { token: string; promise: Promise<MeResponse> } | null = null;

export function fetchMe(token: string): Promise<MeResponse> {
  if (inFlight && inFlight.token === token) return inFlight.promise;

  const promise = fetch("/api/me", { headers: { authorization: `Bearer ${token}` } })
    .then((r) => r.json() as Promise<MeResponse>)
    .finally(() => {
      if (inFlight?.promise === promise) inFlight = null;
    });

  inFlight = { token, promise };
  return promise;
}
