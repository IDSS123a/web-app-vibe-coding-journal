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

## Close-out Findings (2026-07-18, real-data run)

### 12. `getEnabledSources` used the anon client — RLS hid every source
- The cron runs server-side with no user session; the `sources` table RLS blocks
  anon reads, so the collector saw **0 sources** despite 3 enabled rows. Never
  caught in Sprint 02/03 because no real sources were ever configured — only the
  cron endpoint shape was tested, never a real collection.
- Fixed: `getEnabledSources` now uses `supabaseAdmin`.
- **Commander candidate:** "Any server-side/cron read of an RLS-protected table
  must use the service-role client. Test data inserted with the service role hides
  this class of bug — verify at least one pipeline read path with a *real* enabled
  row, not just a 200 from the endpoint."

### 13. `getArticleByHash` self-match — every article a duplicate of itself
- Ingestion upserts on `hash` (hash unique), so `getArticleByHash(hash)` returned
  the article itself; the dedup loop then set `duplicate_of = self` for all 10 real
  articles, starving the Quality Engine (0 scored). This is the true root cause of
  the "everything is a duplicate" symptom mis-attributed to test-data artifacts in
  [[SPRINT_02_LESSONS]].
- Fixed with `excludeId`.
- **Commander candidate:** "A dedup/self-reference check must exclude the row's own
  id. A test that asserts 'duplicates were found' can pass on a self-match bug —
  assert instead that *distinct* records collapse and *unique* records survive."

### 14. Hype-word filter defined but not wired into the pipeline hold decision
- `containsHypeWords` / `shouldHoldForReview` exist (Sprint 03) but the cron's
  `generateDailyReport` only checks the confidence threshold — a hype-laden article
  would auto-publish today, violating P-3 in the unattended path. Not yet fixed;
  logged for a future sprint.

---

## Process Lesson (Task 5) — batch sprint approval

### 15. Three sprints approved at once, with no review gate between them
- **What happened:** Sprints 02, 03, and 04 were built and "approved" in rapid
  succession within a single working stretch, each declared DONE (green
  checklists, passing `tsc`/`build`) without an independent review gate before the
  next sprint started. The green checklists were real for what they tested, but
  they tested endpoint shapes and synthetic data, not real inputs.
- **Consequence:** Two correctness bugs (findings 12 & 13) rode from Sprint 02 all
  the way to Sprint 04 undetected, because no sprint boundary forced a real-data
  run or an adversarial "does this actually work end-to-end?" pass. A per-sprint
  review gate would have caught the dedup self-match the moment real articles flowed.
- **Why it matters:** "DONE" that is self-certified by the same pass that wrote the
  code, and never re-checked at a boundary, accumulates latent defects. Batching
  approvals removes every checkpoint at once.
- **Commander Improvement Candidate (explicit):** Add a rule prohibiting
  batch-approval of multiple sprints. Proposed wording for Commander v1.3:
  > *"Each sprint requires an independent review gate before the next sprint may
  > begin: a real-data (not synthetic) exercise of the sprint's primary path, and a
  > sign-off distinct from the implementation pass. Multiple sprints MUST NOT be
  > approved in a single batch — every skipped gate is a defect checkpoint removed.
  > DONE is provisional until the gate passes on real inputs."*
- **Applies to this project now:** treat 02/03/04 as retro-gated by today's
  real-data run; do not start Sprint 05 until PDL-001 is resolved and the gate
  concept is adopted.

---

*Vibe-Coding Journal — Sprint 04 — governed by Commander v1.2. Commander-candidate items above feed the v1.3 improvement backlog (github.com/IDSS123a/commander).*
