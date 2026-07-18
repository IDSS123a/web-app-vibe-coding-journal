# SPRINT_04 Lessons Learned

**Scope:** Scheduler (Vercel Cron) + Admin Panel (review queue, approve/reject, JWT auth)
**Test outcome:** All 6 end-to-end tests passed against a live Supabase project.

---

## Bugs Found by End-to-End Testing (would have shipped otherwise)

### 1. PostgREST null comparison: `.eq(col, null)` is silently wrong
- **Symptom:** `GET /api/admin/reports/[date]` returned `invalid input syntax for type uuid: "null"`.
- **Cause:** Supabase client `.eq("duplicate_of", null)` serializes to `duplicate_of=eq.null` — PostgREST treats `null` as the *string* "null".
- **Fix:** Use `.is("duplicate_of", null)` for NULL checks.
- **Commander candidate:** Add to ENGINEERING_RULES: "Supabase/PostgREST: NULL filters must use `.is()`, never `.eq()`. TypeScript will not catch this."

### 2. CHECK constraint drift when adding an enum value
- **Symptom:** Reject endpoint failed with `violates check constraint "daily_reports_review_status_check"`.
- **Cause:** Code added `review_status = "rejected"`, but the DB constraint from migration 001 only allowed the original three values. TypeScript and Zod were updated; the database was not.
- **Fix:** Migration 004 drops and recreates the constraint with `'rejected'` included.
- **Commander candidate:** "When extending an enum-like value, update all three layers in one commit: Zod schema, TypeScript unions, AND the DB CHECK constraint (new migration). Grep migrations for the column name before shipping."

### 3. JWT does not contain the application role
- **Symptom:** Valid admin sign-in still got 401 from admin endpoints.
- **Cause:** Original `verify-token.ts` read `user_metadata.role` from the JWT. Supabase puts only `email_verified` there; our role lives in `user_profiles.role`.
- **Fix:** `verifyAdminToken()` is now async — it decodes the JWT for identity/expiry, then looks up the role in `user_profiles` by the token's `sub`. This is also more correct per M-7 (single source of truth): role revocation takes effect immediately instead of waiting for token expiry.
- **Commander candidate:** "Authorization data (roles/permissions) must be read from the database at request time, not from token claims. Tokens prove identity; the database decides authority."

### 4. Dashboard-created auth users have no profile row
- **Symptom:** `UPDATE user_profiles SET role='admin' WHERE email=...` reported success but affected 0 rows; admin API kept returning 401.
- **Cause:** Users created via the Supabase Auth dashboard bypass our registration server action, so no `user_profiles` row exists. The auth user and the profile row are separate records joined by id.
- **Fix:** Inserted the profile row explicitly with the auth user's real UUID (taken from the JWT `sub`).
- **Commander candidate:** "After any UPDATE used for setup/verification, check the affected row count. '0 rows updated' is a silent failure. Prefer `RETURNING *` in setup SQL."

---

## API / Tooling Gotchas

### 5. Supabase token endpoint: grant_type is a URL query param
- `POST /auth/v1/token` with `grant_type` in the JSON body → `unsupported_grant_type`.
- Correct: `POST /auth/v1/token?grant_type=password` with `{email, password}` body, plus the `apikey` header (anon key). Without `apikey`: "No API key found in request".

### 6. Windows shell friction cost significant time
- The user's terminal was cmd.exe, then PowerShell 5.1; bash-style `curl -X ... \` multiline commands fail in both, and PowerShell aliases `curl` to `Invoke-WebRequest` (no `-X` flag).
- **Lesson:** Test instructions must be written for the user's actual shell. Better: run the tests directly via the agent's own Bash tool (which is what finally worked) instead of relaying commands through the user.
- **Commander candidate:** ACA protocol — "When verification requires HTTP calls, the agent should execute them itself where possible; only delegate to the user for steps requiring dashboard UI or credentials the agent must not handle."

### 7. Next.js parallel route collision
- Creating `app/register/page.tsx` while `app/(auth)/register/page.tsx` existed broke the whole dev server (500 on every route), since route groups don't namespace URLs.
- **Lesson:** Before creating a page, glob for existing pages resolving to the same path, including inside route groups.

### 8. DDL cannot go through PostgREST
- Data fixes (INSERT/UPDATE) work via REST with the service-role key; schema changes (ALTER TABLE) must go through the SQL Editor / CLI / management API. Plan migrations accordingly — the human runs DDL, the agent can verify data afterward via REST.

---

## Manual UI Testing Findings

### 11. Route-group segment leaked into hrefs → dead links on the home page
- `app/page.tsx` linked to `/auth/register` and `/login`. Both 404:
  - `(auth)` is a Next.js route group — it does NOT appear in the URL; the page is served at `/register`, not `/auth/register`.
  - `/login` was never built; only `/register` exists.
- Fixed both to `/register`. A dedicated login page (vs. the register form) is still an open UX item.
- **Commander candidate:** "Route groups `(name)` are organizational only and never appear in the URL. After creating pages inside a group, click every internal link — a link that includes the group segment silently 404s, and nothing in the build warns about it."

## What Worked Well

- **E-6 five-step route structure** made the auth refactor trivial: swapping sync token check for async DB-backed check touched one line per route.
- **Audit columns** (`approved_by/at`, `rejected_by/at`) verified end-to-end; approver identity comes from the verified JWT, not from the request body — client cannot spoof it.
- **Negative tests** (no token, garbage token, valid non-admin token) all correctly return 401. The non-admin test used a real signed token with `role='user'` — proving the DB role check works, not just token parsing.
- **Service-role REST access** let the agent seed and verify test data directly, keeping the human in the loop only for dashboard-UI steps and DDL.

---

## Test Results (2026-07-18)

| # | Test | Result |
|---|------|--------|
| 1 | List held reports with admin token | ✅ PASS |
| 2 | Report details by date | ✅ PASS (after `.is()` fix) |
| 3 | Approve → `manually_approved` + audit fields | ✅ PASS |
| 4 | Reject → `rejected` + audit fields | ✅ PASS (after migration 004) |
| 5 | No token / garbage token → 401 | ✅ PASS |
| 6 | Valid non-admin token → 401 | ✅ PASS |
| 7 | Email notification on approve | ✅ PASS — `[EMAIL] Admin notification sent to mulalic.davor@outlook.com` |

Final DB state verified via REST: 2026-07-18 `manually_approved`; 2026-07-19 `rejected`; 2026-07-20/21/22 `manually_approved` (email-test reports), all by admin@test.local.

---

## Email Test Addendum (Resend live)

### 9. Resend test mode: two hard constraints, both surfaced by the API
- `from` must be `onboarding@resend.dev` until a domain is verified (custom domain → "verify a domain at resend.com/domains").
- Recipient must be the **account owner's** email. Resend's error names it explicitly: "You can only send testing emails to your own email address (mulalic.davor@outlook.com)." First guess (`mulalic71@gmail.com`) was wrong; the API told us the right one.
- Made `from` and recipient env-configurable (`RESEND_FROM`, `REVIEW_QUEUE_EMAIL`) rather than hardcoded — the hardcoded `noreply@example.com` would have failed 100% of the time.
- **Verdict:** the P-6 email integration was correct all along; it needed valid config, not code changes. The graceful-skip path (no key → logged warning, no crash) and the live-send path are both now confirmed.

### 10. TaskStop kills the wrapper, not the child — stale server ate a test
- `npm run dev` spawns `node` as a child. TaskStop ended the npm process but `node` kept listening on 3005. The "restart" then failed with `EADDRINUSE` and my email retest silently hit the **old** server (old env, wrong recipient) — it reported `success: true` while actually still misconfigured.
- Caught it only by reading the *server's own log* (empty email line + EADDRINUSE), not the curl response. The HTTP 200 was a false positive.
- **Fix:** kill by port on Windows — `Get-NetTCPConnection -LocalPort N | Stop-Process -Id $_.OwningProcess -Force` — then confirm the port is free before restarting.
- **Commander candidate:** "A dev-server restart is not confirmed by the new process starting; it's confirmed by the OLD listener being gone. After killing a server, assert the port is free before re-binding. When a test depends on fresh config, verify it hit the fresh process (log marker / unique response), because a stale server returns plausible-but-wrong success."

---

## Remaining for Sprint 04 close-out

- UI auth integration: session hook + Bearer token in admin pages (currently placeholder `TODO_GET_FROM_SESSION`)
- Middleware role check for `/admin` routes (API layer already enforces; middleware is defense-in-depth)
- `RESEND_API_KEY` for live email test
- Vercel deployment to activate the cron schedule (`vercel.json`)
- Fix duplicated inline modal state in `app/admin/review-queue/[date]/page.tsx` (module-level `showRejectModal` hack must become `useState`)

---

*Vibe-Coding Journal — Sprint 04 — governed by Commander v1.2. Commander-candidate items above feed the v1.3 improvement backlog (github.com/IDSS123a/commander).*
