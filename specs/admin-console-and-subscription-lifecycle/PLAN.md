# PLAN — Admin Console & Subscription Lifecycle

Implements `SPEC.md`. Grounded in the actual existing code (not
guessed): `features/onboarding/{actions,domain}.ts`,
`features/payments/{domain,repository}.ts`,
`app/api/webhooks/paypal/route.ts`, `lib/payments/paypal-client.ts`,
`lib/db/client.ts`, `lib/permissions.ts`, `app/admin/layout.tsx`.

## Architecture

Two new feature slices (A-2), reusing existing infrastructure rather
than duplicating it:

```
features/admin-users/
  repository.ts    list users, get one user's detail (usage + payment
                    history), block/unblock, create account
  domain.ts         validation/shaping helpers, usage-summary aggregation

features/subscription-lifecycle/
  domain.ts         expiry-window calculation (pure), upgrade-payment
                     classification helper
  repository.ts      find users due for a 7-day/2-day notice, record a
                     sent notice (idempotency), find users eligible to
                     upgrade

app/admin/users/
  page.tsx           user list + detail (admin-only, reuses AdminGuard
                      via the existing app/admin/layout.tsx)

app/api/admin/users/
  route.ts            GET list, POST create account
  [id]/route.ts        GET detail (usage + payments)
  [id]/block/route.ts   POST block
  [id]/unblock/route.ts POST unblock

app/api/cron/subscription-expiry-check/route.ts   daily cron, CRON_SECRET-authenticated (same pattern as daily-digest/university-generate)

app/api/payments/create-upgrade-order/route.ts     Basic→Premium $40 upgrade order (parallel to the existing create-order, not a modification of it)

lib/payments/paypal-client.ts   + createPayPalUpgradeOrder()
lib/email/resend.ts             + sendSubscriptionExpiringEmail()
features/onboarding/domain.ts   evaluateSubscriptionAccess() gains an is_blocked check (single source of truth, M-7 — see Rule Constraints)
lib/permissions.ts               + isBlocked-aware composition, no new function needed (see below)
```

**Why the existing `create-order`/webhook path is NOT modified for the
upgrade, only extended:** `features/payments/domain.ts`'s
`classifyPaymentWebhookEvent` deliberately does an EXACT amount match
("if an amount doesn't exactly match either tier's price, that's
ambiguous, not close enough to guess" — its own comment, PDL-014).
Reusing that exact-match discipline for the $40 upgrade rather than
loosening it keeps the fail-loud guarantee intact for the two existing
tier purchases.

## Data Model

New migration `020_admin_users_and_lifecycle.sql`:

```sql
alter table user_profiles
  add column is_blocked boolean not null default false,
  add column created_by_admin_id uuid references user_profiles(id);
```

- `is_blocked`: a **separate boolean**, not a new `subscription_status`
  enum value. Blocking is orthogonal to trial/active/expired — a
  blocked Premium subscriber is still "active" tier-wise but blocked;
  folding it into the status enum would make that combination
  unrepresentable. Resolves SPEC.md's Open Question.
- `created_by_admin_id`: nullable, set only for admin-created accounts
  (audit trail, matches this project's existing discipline of
  recording *who* did a consequential action — same spirit as
  `lessons.reviewed_by`).

```sql
create table subscription_expiry_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  notification_type text not null check (notification_type in ('7day', '2day')),
  -- Keyed to the SPECIFIC expiry date being warned about, not just
  -- (user_id, notification_type) -- a renewal produces a NEW
  -- subscription_expires_at, and must be able to trigger the same two
  -- notifications again for the new expiry, not be permanently
  -- "already sent" from a previous year.
  subscription_expires_at timestamptz not null,
  sent_at timestamptz not null default now(),
  unique(user_id, notification_type, subscription_expires_at)
);

create index idx_expiry_notifications_user on subscription_expiry_notifications(user_id);
```

No new table for payment history — `payment_events` (migration 006,
already populated by the existing webhook) already records every
processed/ambiguous/ignored PayPal event per user; the admin detail
view queries it directly (A-3: a new `getPaymentEventsForUser`
function in `features/payments/repository.ts`, not a duplicate table).

No new table for feature-usage history — the admin detail view
aggregates existing tables directly: `count(*)` from
`prompt_blueprint_generations` for Assistant usage,
`course_progress.lessons_completed` array length for University
progress. A-3: read-only aggregation queries in
`features/admin-users/repository.ts`, no new storage.

**FK deletion (A-10):** `subscription_expiry_notifications.user_id` is
`on delete cascade` — this is per-user derived/audit data tied
1:1 to that user's account, same precedent as `reward_events`.
`created_by_admin_id` is left with the default `NO ACTION` (no
explicit `on delete`) deliberately: it is a real, permanent audit fact
("this account was created by that admin") and must not silently
vanish or cascade-delete the created account if the ADMIN account is
ever removed — matches A-10's own audit-trail guidance exactly
(pre-check for blockers before allowing that specific delete, not
loosened here).

## API / Server Actions

All routes follow E-6 (authenticate → authorize → validate → execute → return); admin routes use the existing `verifyAdminToken` pattern (`app/api/admin/reports/route.ts` precedent), not a new one.

**`GET /api/admin/users`** — list all users (id, email, role, tier, status, is_blocked, expires_at). Admin only.

**`POST /api/admin/users`** — create a new account.
```
Body: { email, tier: "basic"|"premium" }
```
Execute: reject if email already exists (same check as `registerAction`) → `supabaseAdmin.auth.admin.inviteUserByEmail(email)` (Supabase sends the invite; the admin never sets or sees a password — E-4's secret-handling discipline extended to this new path, not relaxed for convenience) → insert `user_profiles` row with `subscription_status: "active"`, the requested tier, `subscription_expires_at` = +1 year from now, `created_by_admin_id` = the calling admin's id, and **default** `tools_used: ["ai_assisted_ide"]` / `depth_preference: "technical_when_needed"` (resolves SPEC.md's Open Question — sensible defaults rather than relaxing the NOT NULL columns, since those defaults are already used elsewhere as a genuine fallback, e.g. `/api/me`'s own default pattern).

**`GET /api/admin/users/[id]`** — one user's detail: profile fields + `getPaymentEventsForUser(id)` + usage summary (Assistant generation count, lessons-completed count).

**`POST /api/admin/users/[id]/block`** / **`.../unblock`** — sets `is_blocked` and calls `supabaseAdmin.auth.admin.updateUserById(id, { ban_duration: "876000h" })` / `{ ban_duration: "none" }` (Supabase's own convention for "effectively indefinite" / "lift the ban") for defense-in-depth at the auth layer, not just the app-data layer. Response includes the disclosed limitation text (E-4: "blocks new sign-ins immediately; a session token already issued can remain valid up to its own expiry, typically ~1h") so the admin UI shows it, not hides it.

**`POST /api/payments/create-upgrade-order`** — parallel to `create-order`, not a modification.
```
Role required: authenticated, subscription_tier = 'basic', subscription_status = 'active' (must already be a real paying Basic subscriber, not trial/expired — matches the Director's "onaj koji koristi već pretplatu od 10$")
Response: { orderId, approveUrl }
```
Execute: `createPayPalUpgradeOrder(user.sub)` — a new function in `lib/payments/paypal-client.ts`, same shape as `createPayPalOrder` but hardcoded to `"40.00"` rather than a tier-keyed lookup.

**Webhook (`app/api/webhooks/paypal/route.ts`) extension**, not rewrite: before calling `classifyPaymentWebhookEvent`, look up the paying user's CURRENT `subscription_tier`. If `amountUsd === 40` AND the user's current tier is `"basic"`: classify as `{ kind: "processed", tier: "premium", amountUsd: 40 }` directly (a small branch alongside the existing `mapAmountToTier` call, not inside it — keeps the exact-match tier-price map's own logic untouched for the two real tier prices). If `amountUsd === 40` and the user is NOT currently `"basic"` (e.g. already premium, or no profile), classify `ambiguous` — same fail-loud discipline as an unrecognized amount, alerts the admin rather than silently no-opping or silently upgrading someone who shouldn't be.

**Upgrade activation reuses the exact same code path as a fresh tier purchase**: `subscription_expires_at` is recomputed as +1 year **from the upgrade payment**, same as `computeSubscriptionExpiry(new Date())` already does for every activation. This is a deliberate simplification (see Risks below), not an oversight — it avoids adding prorated-date-preservation logic to shared webhook code that runs for every payment, matching the flat (non-prorated) $40 price the Director specified.

**`app/api/cron/subscription-expiry-check/route.ts`** — CRON_SECRET-authenticated (E-6, no user auth — same shared-secret pattern as `daily-digest`/`university-generate`). Execute: find users whose `subscription_expires_at` falls in [now+7d, now+8d) with no existing `subscription_expiry_notifications` row for `('7day', that exact expires_at)` → send + record; same for [now+2d, now+3d) / `'2day'`. Idempotent per exact expiry timestamp (see Data Model), safe to run more than once a day if ever needed.

New GitHub Actions workflow `subscription-expiry-trigger.yml`, modeled directly on `university-generate-trigger.yml`: once-daily schedule, `workflow_dispatch` for manual testing, calls the cron endpoint with `CRON_SECRET`.

## Rule Constraints Applied

- **M-7 (single source of truth)**: blocking is enforced by extending `features/onboarding/domain.ts`'s `evaluateSubscriptionAccess()` — add `is_blocked` to its `SubscriptionProfile` input and check it FIRST (`if (profile.is_blocked) return { hasAccess: false, reason: "blocked" }`). Every existing call site (`SubscriptionGuard`, `PremiumGuard` via `canAccessUniversity`/`canAccessPromptAssistant`, `/api/me`) already flows through this one function, so blocking propagates everywhere automatically — no per-route special-casing needed, no new permission function required.
- **E-2**: new Zod schemas in `lib/validation/schemas.ts` — `adminCreateUserSchema` (`email`, `tier`), reusing the existing `email()` validator from `registerSchema`.
- **E-4**: admin-created accounts go through Supabase's `inviteUserByEmail`, never an admin-set or admin-visible password. Blocking uses `ban_duration`, with its documented incomplete-revocation limitation surfaced in the admin UI, not silently assumed instant (the exact case E-4 itself calls out).
- **E-5**: the webhook's new $40 branch fails loud (`ambiguous` + admin alert) for any amount/tier-state combination that doesn't cleanly match "currently Basic, paid exactly $40" — never a silent guess, matching the existing PDL-014 discipline for the other two amounts.
- **A-3**: no database query outside a `repository.ts` — `features/admin-users/repository.ts` and `features/subscription-lifecycle/repository.ts` own all new queries; `features/payments/repository.ts` gets one new read function (`getPaymentEventsForUser`) rather than a new file, since it's the existing owner of that table.
- **A-6**: migration `020_admin_users_and_lifecycle.sql`, sequential, rollback comment.
- **A-10**: FK deletion behavior explicit and justified per column, see Data Model.
- **E-9**: `features/admin-users/`, `features/subscription-lifecycle/`, `app/admin/users/`, `app/api/admin/users/*` — kebab-case, matching product/role naming.
- **P-1 (Almost-Zero-Maintenance)**: no new table for payment history or usage history — both are aggregation reads over data this project already stores, not a new denormalized copy to keep in sync.

## Risks / Deviations

- **The $40 upgrade resets the annual clock to a fresh year from the upgrade date, rather than preserving the original purchase's remaining time.** Deliberate: implementing true proration/clock-preservation would require the webhook (which runs for every payment) to know "was this an upgrade or a fresh purchase" and branch its expiry-setting logic accordingly — real added complexity and risk to code that activates real money, for a distinction the Director's own flat, non-prorated $40 price doesn't ask for. Flagged here explicitly rather than silently decided; easy to revisit if the Director wants proration once she sees this behavior in testing.
- **Admin-created accounts get default `tools_used`/`depth_preference` values** rather than either relaxing the NOT NULL constraint or building a second admin-facing onboarding questionnaire. If the Director wants these to mean something real for admin-created accounts (e.g. asking the admin to pick them), that's a small follow-up, not a blocking gap — the fields are cosmetic/personalization only, not access-control-relevant anywhere in the codebase today (confirmed by not appearing in `lib/permissions.ts`).
- **`ban_duration: "876000h"` (~100 years) is Supabase's own documented convention for an effectively-permanent ban**, not a project-specific magic number — used as-is rather than invented independently.
- **The known token-validity-after-ban gap (E-4) is disclosed in the admin UI's block confirmation, not solved.** Building a custom revocation blocklist is explicitly out of scope per `SPEC.md` unless the Director asks for it after seeing this.
