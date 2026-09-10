# PLAN — Hold-Gate Calibration Learning

## Architecture

All five layers (A-1), following this project's actual established
precedent (not just the generic template) — matched against
`app/admin/reports/[date]/approve/route.ts` (the closest existing
analog: an admin-triggered action against `daily_reports`) and
`app/dashboard/page.tsx` (the just-fixed pattern for a Server Component
reading real data directly, per E-7's state-management priority order).

```
Presentation:    app/admin/hold-gate-calibration/page.tsx (Server
                 Component — reads latest run + history directly,
                 same pattern as the fixed /dashboard page) + a small
                 Client Component "Re-run now" button (admin session
                 required, same Bearer-token pattern as the existing
                 approve/reject buttons)
Application:     app/api/admin/hold-gate-calibration/run/route.ts
                 (E-6 five-step; dual auth — see below)
Domain:          features/hold-gate-calibration/domain.ts (pure:
                 grouping findings, deriving suggestions from verdict
                 counts — no I/O, no AI calls)
Infrastructure:  features/hold-gate-calibration/repository.ts (all DB
                 queries) + a new method on the existing AIProvider
                 interface (lib/ai/ai-provider.ts) for the judgment
                 call — never call the Gemini SDK directly (A-5)
External:        Supabase (existing), Gemini (existing, via the
                 provider interface — no new external service)
```

**Trigger paths (both call the same Application-layer route, per M-7 —
one execute path, not two):**
1. **On demand:** Director clicks "Re-run now" on the admin page →
   Client Component POSTs with the admin's Bearer session token.
2. **Scheduled:** a new GitHub Actions workflow
   (`.github/workflows/monthly-hold-gate-calibration.yml`), same
   pattern as the proven `hourly-digest-trigger.yml`, but monthly
   cadence — POSTs with `CRON_SECRET` (reused, not a new secret; see
   Risks/Deviations).

## Data Model

Three new tables (migration `supabase/migrations/00X_hold_gate_calibration.sql`,
following A-6's numbered-file + header-comment pattern):

```sql
-- hold_gate_calibration_runs: one row per analysis run
CREATE TABLE hold_gate_calibration_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_by TEXT NOT NULL CHECK (triggered_by IN ('manual', 'scheduled')),
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  reports_analyzed_count INT,
  summary_markdown TEXT,           -- the human-readable admin-page summary
  error_message TEXT,              -- set only if status = 'failed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- hold_gate_calibration_findings: one row per hype-word/hold-reason
-- occurrence actually judged against a specific report
CREATE TABLE hold_gate_calibration_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES hold_gate_calibration_runs(id) ON DELETE CASCADE,
  report_id UUID REFERENCES daily_reports(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,       -- denormalized; survives independently of report_id for display
  hold_reason TEXT NOT NULL,       -- the specific hype word / hold trigger
  verdict TEXT NOT NULL CHECK (verdict IN ('genuine_hype', 'false_positive', 'uncertain')),
  ai_reasoning TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- hold_gate_calibration_suggestions: candidate changes derived from
-- findings, with explicit Director apply-tracking
CREATE TABLE hold_gate_calibration_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES hold_gate_calibration_runs(id) ON DELETE CASCADE,
  suggestion_text TEXT NOT NULL,   -- e.g. "remove 'revolutionary' from hype list"
  rationale TEXT NOT NULL,         -- evidence summary backing this suggestion
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'dismissed')),
  applied_by UUID REFERENCES user_profiles(id),
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**FK deletion reasoning, explicit per A-10:** `findings.report_id` and
both tables' `run_id` are `ON DELETE CASCADE`. This is the *safe*
direction, not the AUDIT-003 trap — findings/suggestions are
**regenerable** by re-running the analysis; they are not themselves
irreplaceable generated content the way `quiz_questions` were in the
AUDIT-003 example. `report_date` is denormalized specifically so a
finding still displays meaningfully even in the (currently
Director-committed-against) event a report row is ever removed. This
migration does not touch `daily_reports` itself — Director's explicit
instruction is to keep all 51+ historical reports permanently.

## API / Server Actions

```
/**
 * POST /api/admin/hold-gate-calibration/run
 * Role required: admin (on-demand) OR valid CRON_SECRET (scheduled)
 * Body: none required
 * Response: { success: true, runId: string, reportsAnalyzed: number }
 * Errors: 401 (neither admin session nor CRON_SECRET valid),
 *         500 (analysis failed — recorded on the run row, not just
 *         thrown, so the admin page shows *why* the last run failed
 *         rather than silently having no new run appear)
 */
```

E-6 five-step, with the dual-auth step 1 spelled out:

1. **Authenticate** — check `CRON_SECRET` header first (same header
   name/scheme as `/api/cron/daily-digest`); if absent or wrong, fall
   back to `verifyAdminToken` (the same helper `approve`/`reject`
   already use). Either one succeeding authenticates the request; both
   failing returns 401.
2. **Authorize** — the CRON_SECRET path is inherently authorized (same
   trust boundary as the existing cron endpoint); the admin-token path
   authorizes via the token's role claim exactly as `approve`/`reject`
   do.
3. **Validate** — no meaningful request body; nothing to Zod-validate
   on the way in beyond confirming it's a POST.
4. **Execute:**
   a. Insert a `hold_gate_calibration_runs` row, `status: 'running'`.
   b. Repository: fetch every `daily_reports` row (all `review_status`
      values, per SPEC's requirement to cover both held and published
      history), **excluding any `report_id` that already has a
      `hold_gate_calibration_findings` row from a prior run** (free-only
      constraint, resolved 2026-09-11 — see Risks/Deviations: never
      re-judge an occurrence already judged).
   c. For each *newly-covered* hold reason from that filtered set only,
      call the AIProvider's new judgment method (see below) to classify
      `genuine_hype | false_positive | uncertain`, with reasoning.
      Insert one `hold_gate_calibration_findings` row per occurrence,
      validated with a new Zod schema (E-2) before insert — an
      unparseable AI response is logged and counted as a finding-level
      failure (E-5's AUDIT-003 addendum: a successful HTTP call is not
      a successful result), never silently dropped. On a run with
      nothing new to judge, this step makes zero AI calls — not an
      error, a normal no-op outcome.
   d. Domain layer (`features/hold-gate-calibration/domain.ts`, pure):
      group **all findings to date** (this run's new ones plus every
      prior run's) by hold reason, compute false-positive rates, and
      derive `hold_gate_calibration_suggestions` rows from the full
      accumulated evidence — the free-only constraint limits new AI
      calls, not the evidence base a suggestion draws from.
   e. Update the run row: `status: 'completed'`, `completed_at`,
      `reports_analyzed_count`, `summary_markdown` (human-readable
      rollup for the admin page). On any unrecoverable failure inside
      this step, update the row to `status: 'failed'` with
      `error_message` instead of leaving it stuck at `'running'`
      forever.
5. **Return** — `{ success: true, runId, reportsAnalyzed }` per the
   standard shape (E-5).

**New AIProvider interface method** (`lib/ai/ai-provider.ts`, A-5 — the
business logic never calls Gemini directly):

```typescript
export interface JudgeHoldReasonInput {
  reportExcerpt: string;   // the specific article/content that triggered the hold reason
  holdReason: string;      // the specific hype word / trigger phrase
}

export interface JudgeHoldReasonOutput {
  verdict: "genuine_hype" | "false_positive" | "uncertain";
  reasoning: string;
}

// Added to AIProvider:
judgeHoldReason(input: JudgeHoldReasonInput): Promise<JudgeHoldReasonOutput>;
```

Implemented in `GeminiProvider`, same pattern as the existing
`summarize`/`classify` methods. **`maxTokens` sizing (A-5/AUDIT-003):**
512 is almost certainly sufficient for a verdict + short reasoning per
occurrence — confirm against the actual longest real reasoning text
during `/tasks` implementation, not assumed here.

**Presentation reads directly** (no separate GET API route, matching
the pattern just established in `app/dashboard/page.tsx`): the admin
page Server Component calls repository functions
(`getLatestCalibrationRun()`, `getCalibrationRunHistory()`) directly.

## Rule Constraints Applied

- **A-1 (Five Layers):** admin page never queries Supabase directly;
  everything flows through repository.ts, matching the exact violation
  the fixed `/dashboard` page had before this session's fix.
- **A-2 (Feature folders):** new `features/hold-gate-calibration/`
  with `repository.ts`, `domain.ts`, `actions.ts` if a Client Component
  ends up needing a Server Action wrapper (TBD at `/tasks`) —
  `schemas.ts` deliberately omitted in favor of the project's actual
  established convention (all Zod schemas centralized in
  `lib/validation/schemas.ts`, confirmed against every existing feature
  in this codebase — E-2's literal instruction, which this project
  follows more consistently than A-2's generic per-feature template).
- **A-5 (AI Provider Interface):** new `judgeHoldReason` method added
  to the existing interface, not a direct Gemini SDK call from
  domain/route code. `maxTokens` sized per AUDIT-003's "longest
  expected output" rule, confirmed empirically at `/tasks`.
- **A-6 (Migrations):** new numbered migration file, header comment,
  explicit rollback comment, per pattern.
- **A-10 (FK deletion):** `ON DELETE CASCADE` on findings/suggestions →
  runs and findings → daily_reports, reasoned explicitly above — this
  data is regenerable, not irreplaceable generated content.
- **E-2 (Zod):** new `judgeHoldReasonOutputSchema` in
  `lib/validation/schemas.ts`, validating the AI response before any
  DB write — an external API response is a claim, not a fact, until
  parsed.
- **E-4 (Security/RBAC):** admin-only, resolved server-side via
  `verifyAdminToken` — never a client-supplied role claim. `CRON_SECRET`
  reused (see Risks/Deviations) rather than trusted from any other
  source.
- **E-5 (Error handling):** every async step wrapped; a failed run
  updates its own row to `status: 'failed'` with a real error message,
  never leaves a `'running'` row stuck forever with no signal to the
  Director.
- **E-6 (Route sequence):** the API route follows the exact five-step
  order, JSDoc block included.
- **E-9 (Naming):** `hold_gate_calibration_*` table names (snake_case),
  `hold-gate-calibration` feature folder (kebab-case), matching
  conventions exactly.
- **E-14 (Consumer enumeration):** the only structure extended here is
  the `AIProvider` interface (one new method) — its sole consumer is
  this feature's own execute step; no other pipeline stage needs to
  change to accommodate it.

## Risks / Deviations

- **P-11's "Monthly Self-Audit" doesn't actually exist yet.** Checked
  this session: no code anywhere implements P-11 (source usage,
  review-queue volume, engagement signals, monthly cadence) — it's
  Constitution text with no implementation, the same class of gap as
  the dashboard-wiring bug found and fixed earlier this session. The
  Director's own phrasing ("tied to the existing Monthly Self-Audit
  cadence") assumed this exists. **This plan does not attempt to build
  P-11 broadly** — that's out of this SPEC's explicit scope. Instead,
  it adds one narrow, independent monthly GitHub Actions trigger for
  calibration specifically, reusing the exact pattern already proven
  reliable for the daily digest. If/when P-11 itself gets built, that
  trigger can be folded into it rather than staying a separate
  workflow file — noted here so that consolidation isn't forgotten,
  not decided now.
- **`CRON_SECRET` reuse — RESOLVED 2026-09-11 (default accepted, no
  objection raised):** reuses the existing `CRON_SECRET` rather than
  minting a new one (M-7: one "is this a legitimate scheduled job"
  fact, one place). No cost or security difference either way; if a
  dedicated secret is wanted later, that's a one-line change, not
  structural.
- **Gemini call volume — RESOLVED 2026-09-11 (Director): only a free
  solution is acceptable.** The system **never re-judges a hold-reason
  occurrence already judged by a prior run.** Each run only calls
  `judgeHoldReason` for occurrences from reports added since the
  *last* run (tracked via `hold_gate_calibration_findings.report_id` —
  a report already covered by an existing finding row is skipped).
  This bounds Gemini usage to genuinely new content only, keeping this
  feature inside the existing PDL-012 free-tier key rotation rather
  than adding meaningful incremental cost. Direct consequence, stated
  explicitly rather than left implicit: a finding's verdict is
  permanent once made — if the hype-word list or hold logic itself
  later changes, old findings do **not** get re-evaluated
  retroactively under the new rules. Acceptable given the "free only"
  constraint; noted here so it's a known tradeoff, not a surprise
  later.
- **No UI mockup/wireframe** — per FEATURE_LIFECYCLE's "no UI-first"
  principle (M-2), Presentation is planned last and only structurally
  (Server Component + one Client button) here; exact page layout is a
  `/tasks`-time or implementation-time detail, not a plan-level
  decision.
