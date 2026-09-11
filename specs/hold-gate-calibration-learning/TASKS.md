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

- [x] **4. Repository functions** — `features/hold-gate-calibration/repository.ts`
  (commit `4521910`) — **all 10 functions live-tested against the real
  applied tables** via a temp route (commits `869da34` fix, `294ce60`
  removal): insert/update run, `getReportsNotYetJudged` (54 real
  historical reports correctly returned), insert finding, get all
  findings, insert suggestion, get pending suggestions, update
  suggestion status (real FK to a real `user_profiles` row), get
  latest/history run. Cleanup verified with a direct count query
  afterward (0/0/0), not assumed from the test route's own "cleaned
  up" claim.
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

- [x] **5. Domain logic** — `features/hold-gate-calibration/domain.ts`
  (commit `445d3b4`; temp-route verification `1868b07`)
  - `groupFindingsByHoldReason`, `deriveSuggestions` (with named
    constants `MIN_OCCURRENCES_FOR_SUGGESTION`/
    `FALSE_POSITIVE_RATE_THRESHOLD`, per E-11), `buildSummaryMarkdown`
    — all live-tested with synthetic finding data, correct aggregation
    and suggestion output confirmed
  - **Real gap found and closed while implementing:** `PLAN.md` assumed
    per-occurrence hold-reason granularity existed already; it didn't
    — `containsHypeWords()` (features/pipeline/quality-engine.ts) only
    ever returned a boolean. Added `detectHypeWordsInReport()`,
    re-scanning a report's already-stored markdown against the
    existing `HYPE_WORDS` list (imported, not duplicated) to recover
    which specific word(s) matched. **Live-tested against 5 real
    reports — found real matches**, including "revolutionary" matching
    "Iran's *Revolutionary* Guard Corps," a genuine false-positive
    example that is itself a small piece of evidence this feature is
    solving a real problem.
  - One false alarm chased down and resolved: local `python3 -m
    json.tool` display showed mojibake on em-dash characters; verified
    via raw response bytes (`e2 80 94`, correct UTF-8) that this was a
    local terminal display artifact, not a real bug — no code change
    needed, noted so it isn't re-investigated later.

- [x] **5a. AI Provider interface extension** (commit `e918886`; temp
  live-test against the real Gemini API `d94f935`) *(added beyond the
  standard 8 steps — `PLAN.md` calls for this as its own piece of
  Infrastructure work, distinct from the repository/domain layers)*
  - `lib/ai/ai-provider.ts`: added `JudgeHoldReasonInput`,
    `JudgeHoldReasonOutput`, `judgeHoldReason()` to the `AIProvider`
    interface, plus a `NoOpProvider` stub
  - `lib/ai/gemini-provider.ts`: implemented, same pattern as
    `summarize`/`classify` — extended the shared `callGeminiJSON`
    helper with an optional `maxOutputTokens` param (existing calls
    unaffected, no regression — confirmed via full `next build`, not
    just `tsc`)
  - `maxTokens` = 512, confirmed sufficient against **real** Gemini
    output, not assumed: live-tested two real cases (a genuine
    false-positive — "Revolutionary Guard Corps" — and genuine hype
    marketing language) — both correctly classified with sensible
    one-sentence reasoning, well under the token budget

- [x] **6. API route** — `app/api/admin/hold-gate-calibration/run/route.ts`
  (completed earlier this project, checkbox was simply never updated —
  found live-running successfully via real GitHub Actions history when
  Sprint 11 resumed this feature 2026-09-11)
  - E-6 five-step exactly as detailed in `PLAN.md`, JSDoc block
    included
  - Dual auth: `CRON_SECRET` header first, `verifyAdminToken` fallback
    (same helper `approve`/`reject` already use)
  - Calls repository → domain → AI provider per the Execute sequence
    in `PLAN.md`
  - A run that fails partway updates its own row to `status: 'failed'`
    with `error_message` — never left stuck at `'running'`
  - Concurrent-run handling resolved during implementation: a second
    trigger while one is `'running'` gets `409`, not a race

- [x] **6a. External scheduled trigger** *(added beyond the standard 8
  steps — the monthly counterpart to Step 6's on-demand path)* —
  same status-checkbox correction as Step 6: `.github/workflows/
  monthly-hold-gate-calibration.yml` exists and its real run history
  (`gh run list`) shows repeated real `success` completions, confirmed
  2026-09-11.

- [x] **7. UI component** (Sprint 11, `sprints/SPRINT_11.md`)
  - `app/admin/hold-gate-calibration/page.tsx` — Client Component
    (not Server Component as originally planned here: this project's
    real established auth pattern is a browser-held Supabase session,
    same reason `app/admin/review-queue/page.tsx` is also a Client
    Component reading through a GET API route rather than calling
    repository functions directly from a Server Component — matching
    actual precedent over this task's original text)
  - New `GET /api/admin/hold-gate-calibration` route (admin-only)
    backs the page: latest run, full run history, pending suggestions
    in one call
  - "Re-run now" button, findings/suggestions summary, Apply/Dismiss
    per suggestion, run history table

- [x] **8. Integration** (Sprint 11)
  - "Re-run now" wired to the Step 6 route; button disables and shows
    "Running…" while a run is in progress or already `status:
    'running'`, and a 409 (concurrent run) surfaces as a visible error
    instead of silently doing nothing
  - Each suggestion's Apply/Dismiss wired to `updateSuggestionStatus`
    via the admin-only PATCH route (no `CRON_SECRET` path — correct,
    applying/dismissing is always an explicit Director action)
  - Nav link added to `app/admin/layout.tsx`'s header

- [x] **9. Self-review** — `FEATURE_LIFECYCLE.md` Step 4 checklist,
  adapted for this project's actual two-role model (`user`/`admin` —
  P-14/PDL-010, **no `super_admin` tier**; the generic Commander
  checklist mentions one, this project doesn't have it). Checked
  2026-09-11 against the actual code, not assumed:
  - [x] Matches `SPEC.md` exactly, including the automated
        false-positive judgment and the never-re-judge free-only
        constraint
  - [x] Every async function has try/catch (the new GET route, the
        PATCH route's existing try/catch now also branches on
        `SuggestionNotFoundError`, and every page.tsx fetch call)
  - [x] All inputs validated with Zod (unchanged from before Sprint 11
        — the PATCH body's `updateStatusSchema`; the AI provider's
        response via `judgeHoldReasonOutputSchema`)
  - [x] Every role/permission check in place (admin-only for the new
        GET route and the page itself; dual auth unchanged on the run
        trigger)
  - [x] No magic numbers introduced this sprint
  - [x] No `any` / `@ts-ignore` — grepped every new/changed file, zero
        matches (two false hits were the English word "any" in a
        comment, not the type)
  - [x] No business logic in the UI layer — the page only calls the
        API and renders; grouping/rate/suggestion logic still lives
        entirely in `domain.ts`
  - [x] No database query outside `repository.ts` — the new GET route
        calls only `getLatestCalibrationRun`/`getCalibrationRunHistory`/
        `getPendingSuggestions`
  - [x] No Gemini/AI SDK call outside the `AIProvider` interface —
        untouched this sprint
  - [x] Service role key doesn't appear anywhere inappropriate —
        untouched this sprint, no new client-side exposure

- [x] **10. Testing** — `FEATURE_LIFECYCLE.md` Step 5, end-to-end in
  the real browser/production, not just unit-level. Re-verified
  2026-09-11 for the new UI specifically (the underlying run/finding/
  suggestion mechanics were already live-tested repeatedly when Steps
  1-6a were built, per the run-history evidence itself):
  - [x] Happy path: `/admin/hold-gate-calibration` loaded with a real
        admin session, showed the real latest run + run history +
        the one real pending suggestion ("remove 'revolutionary'")
  - [x] "Re-run now" clicked for real — a genuine new run completed
        and appeared at the top of the history within seconds
        (`reports_analyzed: 0`, correct: nothing new since the last
        scan, the free-only constraint working as designed)
  - [x] Suggestion-status 404 fix re-verified against production with
        a bogus UUID: now a real `404` with a clear message, not the
        `200 {success:true}` it returned before this sprint
  - [x] Suggestion-status happy path re-verified: inserted a disposable
        `TEST --` suggestion row directly (not the real pending one --
        applying/dismissing the real "revolutionary" suggestion is the
        Director's call, not ACA's, per SPEC.md's own acceptance
        criterion), PATCHed it to `dismissed` through the real API,
        confirmed the DB actually changed (not just the response
        body), then deleted the test row and confirmed zero remain
  - [x] 401 without auth re-verified on the new GET route
  - [ ] `user`-role blocked — NOT independently retested tonight (no
        non-admin test account on hand); unchanged code path
        (`verifyAdminToken`) already covered when Steps 1-6a were
        built, not re-verified here for the new UI/route specifically
  - [x] The scheduled path — not re-triggered tonight, but its real run
        history (`gh run list`) already shows repeated genuine
        `success` completions, found while correcting Step 6a's
        checkbox above
  - [x] The free-only constraint — visible directly in tonight's
        "Re-run now" test (`reports_analyzed: 0`) and in the run
        history's earlier convergence (54→43→36→34→33→0)
  - [ ] Mobile viewport — not tested tonight
  - [x] Loading state while a run is in progress (button disables and
        reads "Running…"); error state surfaced for a `409` concurrent
        run (not actually triggered tonight — no concurrent run was
        in progress to test against, so this exercises the code path,
        not a real concurrent race)
  - Not applicable: date-math edge cases (no month/year date
    arithmetic in this feature)

- [x] **11. Documentation** — `FEATURE_LIFECYCLE.md` Step 6
  - [x] JSDoc on all new exported functions — `repository.ts`'s
        `SuggestionNotFoundError`, and the new
        `GET /api/admin/hold-gate-calibration` route; `domain.ts`/
        `gemini-provider.ts` unchanged this sprint (already documented
        when built)
  - [x] JSDoc block on both new/changed API routes (the new GET route,
        the PATCH route's updated error-response list)
  - [x] `.env.example` checked — confirmed no new env var was added
        this sprint (reuses the existing admin-token auth only, no
        `CRON_SECRET` path on the new routes at all). Separately: this
        file is itself already badly stale project-wide (missing
        `CRON_SECRET`, all 8 `GEMINI_API_KEY_*`, `GEMINI_MODEL`,
        `SUPABASE_ACCESS_TOKEN`, every PayPal var...) — real, but a
        pre-existing gap from long before this sprint, out of scope to
        fix here; flagged in tonight's handoff instead.
  - [x] `DECISION_LOG.md` — PDL-020 records the suggestion-status 404
        fix. The free-only/never-re-judge decision and the
        P-11-doesn't-exist finding were already resolved during Steps
        1-6a (2026-09-11, same day) but were never actually logged as
        their own `DECISION_LOG.md` entries as this task originally
        called for — genuinely missed, not just a checkbox correction;
        added retroactively as PDL-021/PDL-022 rather than left
        silently unrecorded now that it's noticed.
  - [ ] `CHANGELOG.md` — **this file does not exist anywhere in this
        project** (confirmed: no prior sprint created one despite
        `FEATURE_LIFECYCLE.md`'s generic template calling for one every
        time). Not started unilaterally tonight — starting a new
        project-wide tracked document is a bigger call than this one
        checkbox, left for the Director rather than invented (M-4).

- [x] **12. Commit and handoff** — `FEATURE_LIFECYCLE.md` Step 7
  - Separate commits per this project's own established discipline:
    code (`2b19fde`) and this docs/decision-log update as distinct
    commits, not one giant commit
  - Naming-discipline audit clean on every changed file before each
    commit, no exception
  - Handoff folded into `sprints/SPRINT_11.md` (this ended up scheduled
    as a numbered sprint once the Director approved an overnight sprint
    plan, not left as an undecided out-of-sprint HANDOFF file)
