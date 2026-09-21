# SPEC — Admin Console & Subscription Lifecycle

> **Status 2026-09-22: shipped and live** (PDL-048). The acceptance boxes below were not ticked as the work landed; the probe (`npm run probe:security`) now checks the admin, block and payment rules end to end.

## Purpose

Today, managing the paying subscriber base requires either a self-service
signup+payment or a direct database edit — there is no way for the
Director, as admin, to see, manage, or control subscriber accounts
through the product itself. This feature closes that gap: a real admin
console for the subscriber base (who's subscribed, at what tier, how
they're using paid features, and direct control over their access), plus
two subscription-lifecycle gaps that affect real subscribers today —
nothing warns a subscriber before their year lapses, and a Basic
subscriber who wants Premium has no way to upgrade without paying full
price again on top of what they already paid.

## User Stories

- As an admin, I can see a list of every subscriber with their tier,
  status, and expiry, so I know the state of the paying user base
  without querying the database directly.
- As an admin, I can see a user's feature-usage summary (e.g. Assistant
  generations, lessons completed) and their payment/order history, so I
  can answer billing questions and understand usage patterns.
- As an admin, I can block a user's access and later unblock them, so I
  can respond to abuse or a support situation without deleting their
  account or data.
- As an admin, I can create a brand-new subscriber account directly
  (email, tier), so I can onboard someone who isn't going through
  self-registration (e.g. an account paid for outside the normal flow).
- As a $10/year (Basic) subscriber, I can upgrade to the $50/year
  (Premium) tier by paying only the $40 difference, so I don't pay twice
  for what I already own.
- As any subscriber, I receive a notification 7 days and again 2 days
  before my annual subscription expires, so I have time to renew before
  losing access.

## Acceptance Criteria

- [ ] Admin: a "Users" section lists every account with email, role,
      tier, status, and expiry date.
- [ ] Admin: opening a specific user shows their feature-usage summary
      and their payment/order history.
- [ ] Admin: can block a specific user; on their next action requiring
      auth, that user sees a clear "account blocked" message instead of
      normal access. (A known platform limitation — an already-issued
      session token can remain valid until its natural expiry — is
      disclosed, not silently pretended away.)
- [ ] Admin: can unblock a previously blocked user, restoring normal
      access.
- [ ] Admin: can create a new account for an email that doesn't yet
      exist in the system, directly assigned to the $10 or $50 tier,
      without that person self-registering.
- [ ] $10 (Basic) subscriber: sees an "Upgrade to Premium" option;
      completing it requires paying exactly $40; University and the
      Vibe-Coding Assistant become accessible immediately after payment.
- [ ] Any subscriber: receives one email 7 days before
      `subscription_expires_at`, and a second, distinct email 2 days
      before — each states the subscription is about to expire and how
      to renew.
- [ ] A subscriber whose year has already fully lapsed (not blocked,
      just expired) continues to see the existing "Subscription
      Required" experience unchanged — this feature adds the advance
      warning before expiry, it doesn't change what already happens at
      expiry itself.

## Explicitly Out of Scope

- Changing the existing PayPal-only, sandbox-mode payment
  infrastructure to a different provider.
- A user-facing self-service "cancel my subscription" flow.
- Prorating the $40 upgrade price by time remaining in the year — flat
  $40 regardless of when the upgrade happens, per the Director's
  explicit instruction.
- General admin content moderation — `/admin/review-queue`,
  `/admin/hold-gate-calibration`, and `/admin/university` already cover
  that; this feature's "track users" scope is subscriber accounts, not
  content.
- Real-time/instant token revocation on block — the known Supabase Auth
  limitation (blocks new logins immediately, doesn't invalidate an
  already-issued token) stands as-is; no custom revocation blocklist
  unless the Director asks for one after seeing this disclosed.
- SMS or push notifications for expiry — email only, the only
  notification channel this project already has.

## Open Questions

- What happens to the required onboarding fields (`tools_used`,
  `depth_preference`) for an admin-created account that skips
  self-registration — a default value, a relaxed/nullable requirement,
  or a required admin-panel input? Deferred to `/plan-feature`.
- Exact data-model shape for "blocked" — a new `subscription_status`
  value, or a separate boolean column — to be decided against the
  existing enum and access-check code, not guessed independently.
  Deferred to `/plan-feature`.
- Whether the $40 upgrade purchase reuses the existing PayPal order
  endpoints with a new amount/order type, or needs a dedicated one — a
  HOW decision for `/plan-feature`.
- Exact wording/branding of the two expiry emails and the in-app
  "account blocked" message — a copy pass, not assumed here.
