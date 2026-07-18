# HANDOFF — Sprint 04 (Scheduler + Admin Panel)

**Written 2026-07-18** at Sprint 04 close-out. Verified by real browser clicks and
a live pipeline run on real RSS sources, not only by API/curl.

---

## Completed

- **Scheduler:** `vercel.json` cron → `POST /api/cron/daily-digest` daily at 09:00 UTC
  (PDL-005: Vercel Cron chosen — platform-native, no external dep).
- **Admin Review Queue API** (E-6 five-step; JWT decoded for identity, role read
  from `user_profiles` at request time per M-7):
  - `GET /api/admin/reports` (list held, paginated)
  - `GET /api/admin/reports/[date]` (detail + articles)
  - `PUT /api/admin/reports/[date]/approve` → `manually_approved` + audit
  - `PUT /api/admin/reports/[date]/reject` → `rejected` + audit
- **Admin UI**, verified by clicking in a browser (not just curl):
  - `/login` — client-side Supabase sign-in (also fixed the earlier `/login` 404).
  - `useSession` hook supplies the access token to admin pages.
  - `/admin/review-queue` list + `/admin/review-queue/[date]` detail with working
    **Approve** and **Reject** (modal) buttons. Confirmed DB writes with the acting
    admin's email taken from the verified JWT.
- **Schema:** migration 003 (`user_profiles.role`, audit columns, admin RLS on
  `daily_reports`), migration 004 (`rejected` status value).
- **Email:** approve/reject notifications via Resend; `RESEND_FROM` /
  `REVIEW_QUEUE_EMAIL` made env-configurable; live send confirmed to the account
  owner (Resend test-mode only delivers to the owner).
- **CONSTITUTION P-4** synced with the shipped schema (separate commit).
- Home-page dead links fixed (`/auth/register`, `/login`).

## Not completed / deferred

- **Middleware role check for `/admin`** is still a placeholder — the API layer
  enforces admin (defense-in-depth exists), but the middleware does not yet redirect
  non-admins. Low risk (API returns 401), but finish before public launch.
- **No article-level or bulk approve/reject** (report-level only) — as scoped OUT.
- **AI Summary / P-3 editorial voice is UNTESTABLE** until the AI provider is
  chosen (PDL-001 still open). See "Blocker".

## Blocker for downstream work

**PDL-001 (AI provider) is unresolved.** `lib/ai/ai-provider.ts` is a `NoOpProvider`
and no summarize stage is wired into the pipeline. The Quality Engine (heuristic:
confidence, classification, hype-word filter) works on real data, but the editorial
summary fields (`summary`, `why_it_matters`, `worth_trying`) and full P-3 editorial
voice cannot be produced or tested without a real provider. This must be decided
before any sprint that claims to deliver AI Summary.

## Verification evidence

- Browser click-through: login → list → Approve (2026-10-01 → `manually_approved`
  by admin@test.local) and Reject-with-modal (2026-10-02 → `rejected` by
  admin@test.local). DB confirmed.
- Negative auth: no token → 401; valid **non-admin** token → 401.
- Live pipeline on 3 real RSS sources: 10 GitHub Blog articles collected, 0 false
  duplicates (after fix), 10 scored (conf 0.70–0.80), 2 classified, 8 null (M-4).

## Two bugs found & fixed during close-out (were latent since Sprint 02)

1. `getEnabledSources` used anon client → RLS hid all sources → 0 collected.
   Fixed to `supabaseAdmin`.
2. `getArticleByHash` self-match → every article marked duplicate-of-itself.
   Fixed with `excludeId`.

## DONE_CHECKLIST (actual status)

- [x] Scheduler decision logged (PDL-005) and `vercel.json` created
- [x] Admin role added to `user_profiles` (migration 003) + RLS
- [x] Admin endpoints created with auth (JWT + DB role check)
- [x] Approve/Reject tested — **by browser click**, DB writes confirmed
- [x] Email on approve/reject (live send confirmed)
- [x] `tsc --noEmit` zero errors; `next build` passes
- [x] End-to-end: hold → review → approve/reject verified
- [x] corrections/SPRINT_04_LESSONS.md created
- [x] HANDOFF_SPRINT_04.md created (this file)
- [ ] Middleware `/admin` role redirect — **deferred** (API enforces; UI guard pending)
- [ ] Vercel deploy to actually activate the cron — **pending deploy**

## Next sprint (do NOT start before PDL-001 is resolved)

Sprint 05 candidate: resolve PDL-001 (choose provider) → wire AI Summary stage →
test P-3 editorial voice end-to-end. Also: middleware guard, real XML feed parser.

---
*Handoff · governed by Commander v1.2*
