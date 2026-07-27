# HANDOFF — Sprint 07 (Subscription/Trial Data Model & Access Gating)

**Status:** ✅ Complete, all four in-scope items live-verified through the
real UI and direct DB checks — not just code review.
**Date:** 2026-07-27
**Commits:** migration + code (this sprint's own feature), plus one
separate out-of-scope fix (`edec5da`, registration password bug) found
while verifying it.

---

## What shipped

1. **`user_profiles` schema extension** — `subscription_status`,
   `trial_started_at`, `trial_ends_at`, `subscription_expires_at`,
   `subscription_tier`, exactly matching the P-4 schema block already
   documented in `CONSTITUTION.md`. Migration
   (`supabase/migrations/005_subscription_trial.sql`) applied by the
   Director via the Supabase Dashboard SQL Editor (no DDL execution path
   was available to the ACA — PostgREST doesn't do schema changes,
   `supabase` CLI wasn't authenticated, the connected Supabase MCP points
   at an unrelated project). Existing rows backfilled to
   `active`/`premium`/never-expires, per the Director's resolved decision.
2. **Trial lifecycle on registration** — 3 days, Premium-level access
   (Director-confirmed), wired into the existing `registerAction`.
3. **Hard paywall enforcement** — `SubscriptionGuard` (mirrors the
   existing `AdminGuard` pattern exactly, since sessions are client-side
   localStorage, not cookie-based SSR) wraps `/dashboard` via a new
   `app/dashboard/layout.tsx`. Shows a real paywall screen (actual P-13
   pricing, $10 Basic / $50 Premium, Subscribe buttons disabled since
   PayPal is Sprint 08) instead of the real content when access is
   denied.
4. **Admin billing exemption** — `isBillingExempt()` in
   `lib/permissions.ts`, a separate, named, auditable check (per P-13's
   explicit wording), composed with `evaluateSubscriptionAccess()`
   (`features/onboarding/domain.ts`) server-side in `/api/me` — the
   client only ever sees one `hasAccess` boolean, never re-implements the
   business logic.

## Concrete proof (this session, fresh — not re-narrated from code review)

- **Domain logic** — 6 cases via a temporary test route (deleted after
  use): active, trial-not-expired, trial-expired, null `trial_ends_at`
  (fails safe — blocks rather than granting indefinite access),
  subscription-expired, and the exact-boundary moment (counts as
  expired). All correct.
- **Real registration, twice** — once before and once after the password
  fix below. Both produced exactly correct trial fields (3-day window,
  Premium tier), confirmed via direct DB read, not the UI's own claim of
  success.
- **Real login → trial-active dashboard access** — logged in as a fresh
  trial user through the actual `/login` page, loaded `/dashboard`, got
  the real Daily Report content.
- **Real trial-expired block** — set the same test user's `trial_ends_at`
  to the past, reloaded `/dashboard`, got the actual paywall screen (real
  pricing, correct messaging) — not the dashboard content.
- **Real admin exemption, isolated** — temporarily set `admin@test.local`
  to `subscription_status: expired` (deliberately breaking the path that
  would otherwise make this an inconclusive test), confirmed dashboard
  access still worked, then restored the original state immediately
  after. Verified via a final direct DB read that only the two original
  pre-existing accounts remain, both correctly `active`/`premium`.

### ⚠ Found and fixed along the way — not this sprint's own bug

`registerAction` was passing an already-bcrypt-hashed password to
Supabase Auth's `createUser()`, which hashes internally and expects
plaintext. Result: **no user who ever registered through this flow could
sign back in** — a pre-existing, severe bug, discovered only because
Sprint 07's own verification required a working login. Fixed and
committed separately (`edec5da`), not folded into Sprint 07's feature
commit. See `corrections/SPRINT_07_LESSONS.md` finding #1 for detail.

### ⚠ Also found — unrelated project on the expected dev port

Mid-verification, `localhost:3000` served a completely different,
unrelated project's dev server instead of this one. Confirmed via the
actual process command line before touching anything; left it running
untouched, started this project's server fresh (Next.js auto-assigned
port 3001). See `corrections/SPRINT_07_LESSONS.md` finding #2.

---

## DONE_CHECKLIST

See `sprints/SPRINT_07.md` Definition of Done — every item checked with
live evidence above, not just "the code exists."

---

## Explicitly NOT done here (by design)

- **PayPal integration (P-16)** — Sprint 08, gated by P-18's ToS-risk
  precondition. The paywall screen's Subscribe buttons are real UI,
  intentionally disabled.
- **Archive / Bookmarks pages** — don't exist as routes yet (only
  `repository.ts` stubs, no `actions.ts`/components/page).
  `SubscriptionGuard` is built and reusable, ready to wrap those layouts
  the moment those routes exist, but only `/dashboard` is concretely
  wired and tested today.
- **Upgrade/downgrade behavior, Contact form (P-15), chatbot (P-19)** —
  all explicitly out of scope per `sprints/SPRINT_07.md`.

---

## Next Steps

Sprint 08 (PayPal) — needs its own scope document addressing the P-18
Gemini ToS-risk precondition explicitly, per the Constitution's own
requirement, before payment work begins.

---

*Vibe-Coding Journal — Sprint 07 — governed by Commander v1.2.*
