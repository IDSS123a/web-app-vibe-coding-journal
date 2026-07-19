# HANDOFF — DST-Safe Hourly Cron Gate + Public Timestamp Display

**Scope:** "Option 2, permanent" — replaces the fixed-UTC daily cron (needed
manual biannual DST edits, see [[SPRINT_06_LESSONS]] finding #8) with an
hourly-triggered, IANA-timezone-aware gate, plus a timezone-correct public
display of report generation time. **Not a new sprint** — a direct
Director-requested fix on top of already-closed Sprint 06.

**Date:** 2026-07-19
**Commit:** `f5177ae` (code + DECISION_LOG entry, one commit — all three parts
of the Director's request are one coherent decision, not three unrelated
concerns)

---

## What was wrong

`vercel.json` declared a fixed UTC cron (`0 5 * * *`, fixed in Sprint 06 to
match 07:00 local at the time). Correct only while the operations timezone
stays on the same UTC offset — after the next DST transition it silently
becomes wrong until someone manually edits the schedule, twice a year,
forever. No automation existed for this. Separately, no UI anywhere showed
report freshness in the product's public-facing timezone.

## What changed

- **`vercel.json`** — Vercel's own `crons` block removed. **Discovered
  mid-task:** Vercel Hobby plan cron jobs can fire at most once per day;
  `0 * * * *` (hourly) would have failed deployment outright, not just been
  imprecise. Surfaced to the Director before writing any code around it —
  see the three-option question asked and answered (external scheduler
  chosen) earlier in this session.
- **`.github/workflows/hourly-digest-trigger.yml`** (new) — GitHub Actions,
  unaffected by the Hobby once-daily limit, calls the endpoint every hour.
- **`lib/cron/schedule-gate.ts`** (new) — `isTargetOperationsHour()` checks
  the real IANA-timezone local hour via `Intl.DateTimeFormat` before the
  cron route runs the pipeline. Reads the zone only from `OPERATIONS_TIMEZONE`
  (env var, never hardcoded); throws `OperationsTimezoneNotConfiguredError`
  if unset — no silent fallback (P-1.1).
- **`app/api/cron/daily-digest/route.ts`** — inserted the hour-gate check and
  an idempotency check (skip if today's `daily_reports` row already exists)
  ahead of the pipeline, to absorb both GitHub Actions' and Vercel's
  documented delivery imprecision without double-running the expensive
  pipeline.
- **`lib/time/format-public-timestamp.ts`** (new) — formats the report's real
  UTC `updated_at` into `Europe/London` local time via `Intl.DateTimeFormat`,
  GMT/BST label included automatically. `Europe/London` is hardcoded here —
  the intended public value, safe to hardcode per the Director's instruction.
- **`app/dashboard/page.tsx`** — wired the above in next to the existing
  report meta info ("Updated 19 Jul 2026, 23:24 BST").
- **`DECISION_LOG.md`** — PDL-015 records the operations-vs-public timezone
  split as a deliberate business-location-privacy decision. The specific
  operations IANA value is intentionally **not** written into this entry —
  this file is already pushed to a public GitHub repo, and spelling out the
  real value there would defeat the point of the decision. Flagged to the
  Director as a real tension before writing the entry, not resolved silently
  either direction.

## Concrete proof (this session, fresh)

- **DST auto-shift** — `isTargetOperationsHour()` tested against 5 injected
  timestamps via a temporary local test route (deleted immediately after):
  summer target-hour true/false boundary (05:30Z / 04:30Z / 06:30Z against
  UTC+2), winter target-hour true (06:30Z against UTC+1 — same `07` target
  hour, different UTC offset, zero code change), winter false boundary
  (05:30Z). All 5 matched expected.
- **Fail-loud path** — temporarily removed `OPERATIONS_TIMEZONE` from
  `.env.local`, restarted the dev server, confirmed the endpoint throws
  `OperationsTimezoneNotConfiguredError` / `"OPERATIONS_TIMEZONE is not
  configured"` rather than silently defaulting. Restored immediately after.
- **Idempotency** — confirmed against a real, pre-existing `daily_reports`
  row for today's date (not a synthetic insert) that `getDailyReportByDate()`
  correctly returns non-null, exactly the condition the route's skip branch
  checks.
- **London display** — live-rendered on `/dashboard` in an actual browser:
  "Updated 19 Jul 2026, 23:24 BST" for a July timestamp. Cross-checked the
  same formatter directly against a January timestamp → "GMT" — confirms the
  label switches automatically across the DST boundary, not hardcoded.
- **`tsc --noEmit`** and **`next build`**: both clean, both re-run after the
  frontend changes too (not just once at the start).
- **Naming audit** — commit `f5177ae` grepped (case-insensitive) for the two
  forbidden location terms from requirement 3: zero matches, in both the diff
  and the commit message. A small number of unrelated pre-existing hits
  elsewhere in `DECISION_LOG.md` — about language-content coverage for hype-word
  detection, not a location reference (see
  [[HANDOFF_HYPE_FILTER_AND_ADMIN_GUARD]]) — were confirmed via a diff-scoped
  grep to not be part of this change.

## GitHub Actions secrets — partially done

- `CRON_SECRET` — **set**, via `gh secret set`, value piped directly from a
  `vercel env pull` of the real Production value (not `.env.local`'s dev
  placeholder — caught and corrected same-session after initially piping the
  wrong one; see caveat below).
- `DIGEST_ENDPOINT_URL` — **not set**. No production deployment exists yet
  (`vercel ls` → "No deployments found"); `vercel --prod` was explicitly
  deferred to its own separate conversation (Sprint 06 handoff). Nothing in
  this workflow can be exercised end-to-end until that happens.

### ⚠ Caveat — first CRON_SECRET attempt used the wrong value

The first `gh secret set CRON_SECRET` call piped from `.env.local`'s
`CRON_SECRET=dev-test-secret-sprint-02` (a local dev placeholder) instead of
the real Vercel Production secret generated in Sprint 06. Caught immediately
in the same turn — before reporting the step done — by recognizing dev and
production `CRON_SECRET` are different values in this project. Corrected via
`vercel env pull` + `gh secret set` overwrite. Had this shipped uncaught,
every hourly GitHub Actions invocation would have received a silent 401 from
the production endpoint — the pipeline would never run, with no obvious
signal why.

---

## DONE_CHECKLIST

- [x] Backend: hourly external trigger + real IANA-timezone gate replaces
      the fixed-UTC cron requiring manual DST maintenance
- [x] Idempotency protection against duplicate same-day runs
- [x] `OPERATIONS_TIMEZONE` fails loudly if unconfigured — no hardcoded
      fallback anywhere
- [x] Frontend: public timestamp display converts real UTC → Europe/London
      via real timezone data, GMT/BST automatic
- [x] Naming discipline: zero occurrences of the two forbidden location
      terms (requirement 3) in code, comments, commit message, or env var
      *names* — verified via commit-scoped grep, not just working-tree
- [x] DECISION_LOG PDL-015 records the decision and rationale without the
      specific operations timezone value, after surfacing the tension to
      the Director rather than resolving it silently
- [x] DST auto-shift live-verified across summer/winter boundary (both the
      backend gate and the frontend display, independently)
- [x] Fail-loud path live-verified (not just read from source)
- [x] Idempotency live-verified against real data
- [x] `tsc --noEmit` and `next build` clean
- [x] Temporary test route fully removed before commit (confirmed via
      `git status` + rebuilt `.next` cache to catch stale references)
- [x] `CRON_SECRET` GitHub Actions secret set to the correct **production**
      value (after catching and fixing the dev-placeholder mistake above)
- [ ] `DIGEST_ENDPOINT_URL` GitHub Actions secret — blocked on `vercel --prod`
- [ ] End-to-end live cron firing — blocked on the same deploy
- [x] This handoff committed separately from the code/DECISION_LOG commit

**Legend:** two items open, both blocked on the same external event
(production deploy), not gaps in this handoff's own scope.

---

## Explicitly NOT done here (by design)

- `vercel --prod` itself — its own conversation, per the Director's standing
  request from Sprint 06.
- `DIGEST_ENDPOINT_URL` — cannot have a real value before the above.
- Verifying the GitHub Actions workflow actually fires on schedule — GitHub
  Actions `schedule` triggers only run on the default branch once pushed;
  this commit has **not** been pushed yet (Director asked to hold, pending
  confirmation on the `gh auth login` account below).

## One thing to confirm before pushing

`gh auth login` authenticated as the `IDSS123a` GitHub account/org — the same
one `origin` already points to. Flagged back to the Director for explicit
confirmation this is the intended identity for the `CRON_SECRET` /
`DIGEST_ENDPOINT_URL` secrets to be scoped under, before this commit is
pushed and the workflow goes live.

---

*Governed by Commander v1.2. Continuation of already-closed Sprint 06 —
tracked as its own handoff per the established pattern (see
[[HANDOFF_HYPE_FILTER_AND_ADMIN_GUARD]]), not a reopening of SPRINT_06.md.*
