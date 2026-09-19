# Full-Project Stress Test (2026-09-18) and Plan for the Next Session

Requested by the Director: an overall "brutal" stress test — horizontal
(logic, traceability, functionality, AI–user communication, AI answer
quality) and vertical (every folder, semantics and syntax). This file is
the durable record so the next session does not depend on memory.

**Method:** live probes against production (forged tokens, direct
Supabase REST calls with a real non-admin session, every API route with no
login, security headers, DNS), direct SQL against the real database (RLS,
grants, policies, integrity), adversarial AI generation, dependency and
secret scans (tracked files + git history), static counts, and a
traceability read of governance/spec/decision documents. Test sessions
were minted for `user@test.local` only; every state change made by a test
was reverted and verified.

## 1. Fixed during the test (live, verified on production)

| # | Severity | Finding | Fix | Decision |
|---|----------|---------|-----|----------|
| F1 | CRITICAL | Any hand-built token with a garbage signature was accepted as the user/admin it named (`jwt-decode` never checks signatures). A forged token returned `isAdmin:true` and the full user list. | Tokens now verified by Supabase Auth (`auth.getUser`). Forged and tampered tokens rejected on production, legitimate token accepted. 6 regression tests. | PDL-050 |
| F2 | CRITICAL | Policy "Users can update own profile" let any signed-in user PATCH their own row through Supabase's REST API and set `role='admin'`, tier, status, expiry, `is_blocked`, coins. Proven with a real non-admin session, reverted. | Migration 021 drops the policy (no app code used it). All 4 escalation attempts now blocked, state unchanged, own-row read still works. | PDL-051 |
| F3 | HIGH | (found in the stress test, fixed 2026-09-19) Any registered user (free trial is enough) could read through the Supabase REST API all 77 University lessons, all 75 chapter-quiz + 36 level-test questions **including `correct_option_index`**, 55 held-for-review + 5 rejected Daily Reports (defeats the P-6 review gate) and 1000+ articles. | Migration 022 drops the ten `auth.role() = 'authenticated'` read policies. Verified: all ten tables now return 0 rows to a logged-in user; own-data tables still readable; university, dictionary, rewards, history, `/api/me`, dashboard and archive all still work on production. | PDL-052 |

## 2. Open findings, ranked (fix order for the next session)

### P0 — security / data safety (do first)

- **S1b (HIGH, needs a Director decision) The paid Daily Report is readable without logging in.** `/archive` and `/archive/[date]` have no guard at all; `/dashboard` is guarded only client-side, so a browser shows "Checking access…" but the article text is in the page source (verified with curl on 2026-09-19: article titles and "Why it matters" text present for an anonymous request). This is the already-documented open item from PDL-026 / `middleware.ts` ("intentionally PUBLIC today… a product decision for the Director"). Basic ($10) advertises exactly this content. Options: (a) keep public deliberately as marketing and change the pricing copy; (b) real paywall — needs server-side authentication, i.e. cookie-based SSR sessions (`@supabase/ssr`), or rendering the report client-side from an authenticated API; (c) hybrid (public teaser of the latest report, full detail and archive gated).
- **S2 (HIGH) No database backups exist.** Management API: `backups: []`, `pitr_enabled: false`. Users, payment events and — critically — the University curriculum (AI-generated and curated over days, its seed SQL lived only in a session scratchpad, not in the repo) are unrecoverable if lost. Options: Supabase Pro (daily backups) or a scheduled `pg_dump` to private storage via GitHub Actions. Needs a Director decision (cost vs. effort).
- **S3 (HIGH) Test accounts in production:** `admin@test.local` (role admin, premium, never expires) and `user@test.local` (premium, never expires). Unknown/likely weak passwords on an admin account. Delete or lock down; keep one real admin.
- **S4 (MED) Credentials exposed in chat this session** (Resend API key, Supabase access token): rotate both after the session; the forged-token window (F1) also means admin-API-readable data (emails, tiers, payment events) may have been read — there are no request logs to prove otherwise (see PDL-050).
- **S5 (MED) Crons fail open in code:** `CRON_SECRET || "dev-secret-change-in-production"` in three routes. Production is not vulnerable (probe: 401) but a missing env var would silently expose them. Make them fail closed.
- **S6 (MED) Missing security headers:** only HSTS is sent; no CSP, `X-Frame-Options`/`frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`; `X-Powered-By` exposes Next.js. Add in `next.config.js` (CSP first in report-only mode, PayPal SDK and Supabase origins allow-listed).
- **S7 (MED) Registration abuse:** `registerAction` creates accounts with `email_confirm: true` (no ownership check), no CAPTCHA, no rate limit → free-trial farming and registering other people's addresses.
- **S8 (LOW-MED) Dead but dangerous code:** `loginAction` ("simplified for the scaffold") returns success for any existing email without checking a password; `hashPassword`/`verifyPassword` unused (auth is Supabase). Delete.
- **S9 (LOW) No error monitoring** (no Sentry or equivalent; E-8 requires it) — failures are only visible if someone reads Vercel logs. No audit log of admin actions (block/unblock/tier/create are `console.log` only).

### P1 — reliability and AI

- **R1 (HIGH, user-facing now) One flaky Gemini key fails every request.** Calls always start at key 1 and a 5xx is not retried on the next key. Measured today: key 1 → 503, and 6 other keys healthy — yet all 4 test generations failed with HTTP 503; the Assistant shows a generic error. Fix: rotate on 5xx/overload too (with a small bounded retry), and a friendly "try again" message.
- **R2 (HIGH) Gemini key/model health.** Per key against `gemini-2.5-flash`: 2,5,6,8 OK; 1 quota-exhausted; 3 model removed ("no longer available to new users, use gemini-3.6-flash"); 4 overloaded; **7 `PERMISSION_DENIED` on both models — possible suspended key (the P-18/PDL-012 risk)**. `gemini-3.6-flash` answers on 6 of 8 keys. Needs a Director decision on migrating the model (re-calibrating relevance and confidence thresholds, lesson/Assistant quality) and on key 7.
- **R3 (HIGH) Daily digest runs at ~290 s of a 300 s budget** and two attempts on 09-17 still hit `FUNCTION_INVOCATION_TIMEOUT`. Per-phase timing is now logged — read it from the first run after the deploy, then decide (parallel source fetch, fewer articles, or split phases into separate invocations). Also decouple the response `success` flag: one unreachable source flips it to `false` every day although the report is written (false alarm).
- **R4 (MED) Verify the P-0 fix outcome** on the next real run (PDL-049): does a report with only relevant, well-scored articles now auto-publish, or does another hold reason remain?
- **R5 (MED) Mermaid diagrams are intermittently invalid:** two of the first live generations put parentheses inside unquoted `[labels]`, which Mermaid rejects (later stress cases were clean, so it is intermittent). Add a canon rule (quote every label) and a server-side validator/sanitizer.
- **R6 (MED) Assistant input handling:** vague input ("app / people / make it good") yields a generic prompt with no warning; a harmful request is refused by the model (good) but still consumes a generation and relies entirely on model behaviour — add a server-side guard and do not charge the daily cap for a refusal.

### P2 — product / business decisions

- **B1 Empty dashboard:** since no report has ever auto-published, paying subscribers see "No Daily Report is available right now", with a placeholder wrongly badged "AUTO-PUBLISHED" and today's date. Decide the policy (auto-publish threshold, fall back to last published, honest empty state).
- **B2 Forgot-password page does not exist** (Site URL and SMTP are now configured, so it is cheap): add `/forgot-password` → `resetPasswordForEmail` → `/set-password`.
- **B3 Blocked user at login sees raw Supabase text** ("User is banned"); map it to the app message.
- **B4 Admin console gaps:** renewal/expiry extension, "expiring soon" view, pagination and search of users, real audit log.
- **B5 Email deliverability:** invites land in spam (authentication itself is correct: DKIM/SPF/DMARC present; DMARC is `p=none` without reporting) — branded template shipped; add DMARC `rua`, watch reputation. `ai@idss.ba` receives nothing although Resend reports "delivered" (mail is on crohost; check whether the mailbox exists).
- **B6 PayPal is sandbox-only by design** — a live-mode checklist (own reviewed change per Sprint 08) is needed before real money.
- **B7 Upgrade semantics:** the $40 upgrade restarts the annual clock from the upgrade date (deliberate simplification, PDL-048) — confirm or switch to proration.
- **B8 Assistant caps** (5/day per user, 30/day global) are still an unconfirmed proposal (PLAN.md).

### P3 — hygiene and traceability

- `tsconfig.tsbuildinfo` is tracked (build artifact, changes every build) — untrack and gitignore.
- Six governance files that `CLAUDE.md` tells the ACA to read are **not in this repo** (`ENGINEERING_RULES.md`, `ARCHITECTURE_PATTERNS.md`, `ACA_COMMUNICATION_PROTOCOL.md`, `FEATURE_LIFECYCLE.md`, `DONE_CHECKLIST.md`, `PROMPT_LIBRARY/`); they only exist in the separate commander-repo — vendor them (tag-pinned) or correct `CLAUDE.md`.
- `README.md` is stale ("Commander v1.2", "Sprint 01 not yet started").
- `CHANGELOG.md` has no entries for 09-10, 09-14, 09-15; `specs/admin-console-and-subscription-lifecycle/TASKS.md` shows 17 unchecked boxes although the work shipped.
- 17 handoff/sprint documents clutter the repo root — move under `sprints/`.
- ESLint is installed but unconfigured (`next lint` prompts interactively → no lint gate). Source counts: 7 `any` (E-1), 8 `eslint-disable`, 40 `console.log` (E-11), 2 TODO; `app/api/me/route.ts` has no try/catch (E-5); `GEMINI_MODEL` missing from `.env.example`.
- Unused exports to delete: `getBookmarkedArticleIds`, `updateDailyReportStatus`, `loginAction`, `getUserProfileById`, `getUserProfileByEmail`, `mapAmountToTier`(only used inside its module), `isSourceStale`, `getAllSources`, `getSourceById`, `createSource`, `deleteSource`, `hashPassword`, `verifyPassword`, `extractBearerToken`(internal only).
- `npm audit`: 2 findings (postcss path traversal via Next; moderate/high). Fix needs Next 16 (breaking) — plan a tested upgrade; real exposure is low.
- Test coverage: 134 unit tests, all on pure domain logic. No API-route, RLS or end-to-end tests — which is exactly why F1 and F2 went unnoticed. Add a post-deploy security probe script (forged token, REST self-escalation, REST read exposure, route auth matrix) and run it in CI or after each deploy.

## 3. Verified working (evidence today)

- All 40 API route handlers answer 401 without login; `/api/me` is public by design; the PayPal webhook rejects unsigned calls (400); crons reject the default secret (401).
- RLS is enabled on all 24 tables; anonymous users read nothing; a user reads only their own profile, bookmarks, progress and payments.
- Data integrity: no orphan profiles/auth users, no duplicate emails, no expired-but-active subscriptions, every processed payment maps to a user, report `article_count` equals linked rows.
- No secrets in tracked files or git history (`HANDOFF_SPRINT_03.md` matches only a truncated placeholder).
- $40 upgrade end to end (PayPal sandbox → webhook → premium), expiry e-mails delivered to a non-owner address, invite → set-password → login, block/unblock at DB + Auth layers with the "Account Blocked" screen on 3 pages, tier change.
- AI generator under attack: prompt injection did not leak the canon or obey the injected text; Bosnian input → English output; harmful request refused and replaced with a benign example; all 7 output fields present each time; `### SECTION ###` delimiters used.
- Decision log numbering is continuous (PDL-001…051, no gaps or duplicates); Constitution P-0…P-21 all carry a status.

## 4. Not tested (be honest about the limits)

Load/concurrency, full mobile and accessibility pass across every screen, cross-browser, PayPal live mode, disaster recovery (impossible: no backup), Vercel request logs (no access — Vercel MCP unauthenticated, CLI not installed), Gemini output quality over a large sample (only 8 live generations were inspected).

## 5. Proposed order for the next session

1. **Start-of-session P-21 check** (CLAUDE.md): digest run/timings, latest report status.
2. ~~**S1** drop the content SELECT policies~~ — DONE 2026-09-19 (migration 022, F3, PDL-052).
3. **S3 + S4** delete/lock test accounts; rotate the two pasted credentials.
4. **R1** Gemini 5xx rotation (+ friendly error) — restores Assistant reliability.
5. **S5, S6, S8** cron fail-closed, security headers (CSP report-only), delete dead auth code.
6. **Decisions from the Director:** paywall for the Daily Report/Archive (S1b), backups (S2), Gemini model migration and key 7 (R2), dashboard empty-state policy (B1), upgrade clock (B7), Assistant caps (B8).
7. Then R3–R6, B2–B4, hygiene batch, and the security-probe script into CI.
