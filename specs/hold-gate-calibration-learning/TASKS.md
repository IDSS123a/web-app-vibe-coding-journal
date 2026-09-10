# TASKS — Hold-Gate Calibration Learning

Mirrors `FEATURE_LIFECYCLE.md` Step 3's fixed order — do not reorder,
do not start a step before the one above it is complete and tested.
Two items are added beyond the standard 8-step build sequence because
`PLAN.md` calls for them explicitly (AI provider interface extension,
external scheduled-trigger workflow) — noted where they appear, not
silently folded into an adjacent step.

- [x] **1. Database migration** — `supabase/migrations/007_hold_gate_calibration.sql`
  (commit `a98ad8a`)
  - `hold_gate_calibration_runs`, `hold_gate_calibration_findings`,
    `hold_gate_calibration_suggestions` exactly as specified in
    `PLAN.md`'s Data Model section, including the `ON DELETE CASCADE`
    FKs and their A-10 reasoning written directly into the SQL file's
    comments, not just `PLAN.md`.
  - Header comment: brief context + pointer to SPEC.md/PLAN.md,
    matching this project's **actual** established convention
    (migrations 005/006), not A-6's generic
    Migration/Date/Author/Description/Rollback template literally.
  - RLS enabled, service_role-only on every operation/table — added
    beyond `PLAN.md`'s literal Data Model text, per
    `DONE_CHECKLIST.md`'s unconditional "RLS enabled + deny-by-default
    on EVERY table" requirement (noticed `payment_events`, migration
    006, skipped this — not repeating that gap here).
  - **APPLIED to the live database 2026-09-11** — via the Supabase
    Management API directly (`SUPABASE_ACCESS_TOKEN`, new capability
    this session — no more manual Dashboard SQL Editor step needed for
    this or future migrations). Live-verified: all three tables exist,
    `relrowsecurity = true` on each, confirmed against
    `information_schema`/`pg_class`, not assumed from the API call's
    success alone.

- [x] **2. TypeScript types** — folded into Step 3 (commit `3d4786e`),
  deliberately **no** separate `types/index.ts` or
  `features/hold-gate-calibration/types.ts` file, per this project's
  real established precedent (`z.infer<>` centralized in
  `lib/validation/schemas.ts`).

- [x] **3. Zod validation schemas** — `lib/validation/schemas.ts`
  (commit `3d4786e`)
  - `holdGateCalibrationRunSchema` / `HoldGateCalibrationRun`
  - `holdGateCalibrationFindingSchema` / `HoldGateCalibrationFinding`
  - `holdGateCalibrationSuggestionSchema` / `HoldGateCalibrationSuggestion`
  - `judgeHoldReasonOutputSchema` / `JudgeHoldReasonOutput` — validates
    the AI provider's response specifically (E-2: external API
    responses are parsed before trusted, not just DB rows)
  - `tsc --noEmit` clean

- [ ] **4. Repository functions** — `features/hold-gate-calibration/repository.ts`
  - `insertCalibrationRun()` → `status: 'running'`
  - `updateCalibrationRun(id, updates)` → completed/failed transitions
  - `getReportsNotYetJudged()` — `daily_reports` rows with no existing
    `hold_gate_calibration_findings.report_id` referencing them (the
    free-only, never-re-judge constraint from `PLAN.md`)
  - `insertFinding()`
  - `getAllFindings()` — for domain-layer aggregation (accumulated
    evidence across every run, not just the current one)
  - `insertSuggestion()`
  - `updateSuggestionStatus(id, status, appliedBy)` — the explicit
    Director-apply-tracking acceptance criterion from `SPEC.md`
  - `getLatestCalibrationRun()`, `getCalibrationRunHistory()` — for the
    admin page

- [ ] **5. Domain logic** — `features/hold-gate-calibration/domain.ts`
  (pure — no I/O, no AI calls, matching A-1's dependency direction)
  - Group findings by hold reason; compute false-positive rate per
    reason
  - Derive `hold_gate_calibration_suggestions` candidates from that
    aggregation, each with the specific evidence backing it (`SPEC.md`
    acceptance criterion: suggestions must be actionable, not raw
    statistics)
  - Build the human-readable `summary_markdown` for the run row

- [ ] **5a. AI Provider interface extension** *(added beyond the
  standard 8 steps — `PLAN.md` calls for this as its own piece of
  Infrastructure work, distinct from the repository/domain layers)*
  - `lib/ai/ai-provider.ts`: add `JudgeHoldReasonInput`,
    `JudgeHoldReasonOutput`, `judgeHoldReason()` to the `AIProvider`
    interface
  - `lib/ai/gemini-provider.ts`: implement it, same pattern as the
    existing `summarize`/`classify` methods
  - `maxTokens` sized per A-5/AUDIT-003 — confirm against a real
    sample of longest expected reasoning text, don't assume 512 is
    correct without checking

- [ ] **6. API route** — `app/api/admin/hold-gate-calibration/run/route.ts`
  - E-6 five-step exactly as detailed in `PLAN.md`, JSDoc block
    included
  - Dual auth: `CRON_SECRET` header first, `verifyAdminToken` fallback
    (same helper `approve`/`reject` already use)
  - Calls repository → domain → AI provider per the Execute sequence
    in `PLAN.md`
  - A run that fails partway updates its own row to `status: 'failed'`
    with `error_message` — never left stuck at `'running'`

- [ ] **6a. External scheduled trigger** *(added beyond the standard 8
  steps — the monthly counterpart to Step 6's on-demand path)*
  - `.github/workflows/monthly-hold-gate-calibration.yml`, same
    `curl --fail-with-body` + `CRON_SECRET` pattern as
    `hourly-digest-trigger.yml`, monthly `schedule` cron expression +
    `workflow_dispatch` for manual testing

- [ ] **7. UI component**
  - `app/admin/hold-gate-calibration/page.tsx` — Server Component,
    reads `getLatestCalibrationRun()` + `getCalibrationRunHistory()`
    directly (same pattern as the just-fixed `app/dashboard/page.tsx`
    — no separate GET API route)
  - A small Client Component "Re-run now" button — same Bearer-token
    fetch pattern the existing approve/reject buttons use, POSTing to
    the Step 6 route
  - Displays: findings grouped by hold reason with verdict/rate,
    suggestions with evidence, and Apply/Dismiss controls per
    suggestion (wired in Step 8)

- [ ] **8. Integration**
  - Wire "Re-run now" to the API route; show a loading state while the
    run is in progress (the real run can take minutes, same order of
    magnitude as the daily-digest cron — don't design the UI as if
    this completes instantly)
  - Wire each suggestion's Apply/Dismiss control to
    `updateSuggestionStatus` (also admin-authenticated, same dual
    pattern — though only the admin-token path makes sense here, no
    `CRON_SECRET` path needed for applying a suggestion)
  - Add a nav link to the new page in `app/admin/layout.tsx`'s header
    (currently only lists "Review Queue" and "Dashboard" — this is a
    real, small, easy-to-forget edit)

- [ ] **9. Self-review** — `FEATURE_LIFECYCLE.md` Step 4 checklist,
  adapted for this project's actual two-role model (`user`/`admin` —
  P-14/PDL-010, **no `super_admin` tier**; the generic Commander
  checklist mentions one, this project doesn't have it):
  - [ ] Matches `SPEC.md` exactly, including the automated
        false-positive judgment and the never-re-judge free-only
        constraint
  - [ ] Every async function has try/catch
  - [ ] All inputs validated with Zod (including the AI provider's
        response — not just the request body)
  - [ ] Every role/permission check in place (admin-only for view and
        apply; dual auth for the run trigger only)
  - [ ] No magic numbers — cadence, `maxTokens`, etc. named constants
  - [ ] No `any` / `@ts-ignore`
  - [ ] No business logic in the UI layer (grouping/rate/suggestion
        logic lives in `domain.ts`, not the page component)
  - [ ] No database query outside `repository.ts`
  - [ ] No Gemini/AI SDK call outside the `AIProvider` interface
  - [ ] Service role key doesn't appear anywhere inappropriate

- [ ] **10. Testing** — `FEATURE_LIFECYCLE.md` Step 5, end-to-end in
  the real browser/production, not just unit-level:
  - Happy path: on-demand trigger → real run against real held/
    published history → real findings and suggestions appear on the
    admin page
  - Both roles that actually exist here: `admin` sees the page and can
    trigger/apply; `user` is correctly blocked (no `super_admin` case,
    per this project's model)
  - Failure paths: invalid/missing auth (401), a run triggered while
    one is already `'running'` (decide and test the actual behavior —
    `PLAN.md` doesn't specify concurrent-run handling; resolve this
    during implementation, don't leave it undefined), an AI response
    that fails Zod validation (logged/counted, not silently dropped,
    per E-5's AUDIT-003 addendum)
  - The scheduled path: trigger the real GitHub Actions workflow via
    `workflow_dispatch` (same technique used earlier this session for
    the daily-digest cron) and confirm a real run completes
  - The free-only constraint, live-verified: run once, confirm
    findings are created; run again immediately with no new held
    reports since — confirm **zero** new AI calls happen and this is
    treated as a normal, non-error outcome, not confirmed only from
    reading the code
  - Mobile viewport for the admin page
  - Loading state while a run is in progress; error state if a run
    fails
  - Not applicable: date-math edge cases (no month/year date
    arithmetic in this feature)

- [ ] **11. Documentation** — `FEATURE_LIFECYCLE.md` Step 6
  - [ ] JSDoc on all new exported functions (`repository.ts`,
        `domain.ts`, `gemini-provider.ts`'s new method)
  - [ ] JSDoc block on the new API route
  - [ ] `.env.example` — no new env var expected (CRON_SECRET reused
        per `PLAN.md`'s resolved decision); confirm nothing new was
        actually added before skipping this
  - [ ] `DECISION_LOG.md` — record the free-only/never-re-judge
        decision and the P-11-doesn't-exist-yet finding as their own
        entries, not just left inside `PLAN.md`
  - [ ] `CHANGELOG.md` one-liner

- [ ] **12. Commit and handoff** — `FEATURE_LIFECYCLE.md` Step 7
  - Separate commits per this project's own established discipline
    this whole session: migration, code, and any governance/decision-log
    updates as distinct commits — not one giant commit
  - Naming-discipline audit (the project's own literal-string check)
    before every commit, no exception
  - Handoff note (either a new `HANDOFF_HOLD_GATE_CALIBRATION.md`,
    matching the `HANDOFF_CONTENT_PIPELINE_FIX.md` precedent for
    out-of-sprint feature work, or folded into a `SPRINT_XX` document
    if this ends up scheduled as part of a numbered sprint — not
    decided here, a call to make when this is actually scheduled)
