# SPRINT_12 — Testing Infrastructure
# Vibe-Coding Journal
# Status: COMPLETE 2026-09-11 — implemented and verified against production

---

## Origin

Third of the Director-approved overnight sprints (backend quality audit
→ sprint plan → autonomous implementation; see `DECISION_LOG.md`
PDL-019 for the batch-approval process waiver this falls under).
Addresses the single largest gap the audit found: **zero automated test
files existed anywhere in this project**, confirmed by a direct
filesystem search before this sprint started.

## Scope — IN

1. **Vitest** added as a dev dependency (`vitest@3.2.7`, pinned below
   `4.x`/`5.x` deliberately — those require `@types/node@^22`, and
   bumping that project-wide is a separate, bigger call not made here,
   see Explicitly Out of Scope). `vitest.config.ts` mirrors
   `tsconfig.json`'s `@/*` path alias exactly. `npm run test` (watch)
   and `npm run test:run` (CI-style single run) added to `package.json`.
2. **64 tests across 5 files**, scoped entirely to pure functions with
   no I/O (no Supabase, no Gemini, no network) — deliberately the
   highest-value, lowest-effort starting point:
   - `features/pipeline/quality-engine.test.ts` (20 tests) — confidence
     scoring, hype-word detection (including the real
     "Revolutionary Guard Corps"-style false-positive class this
     project has actually hit in production), hold decisions, and the
     classifier's "return null rather than guess" rule (M-4)
   - `features/hold-gate-calibration/domain.test.ts` (12 tests) —
     hype-word re-detection with excerpts, false-positive-rate
     aggregation, suggestion derivation's two-threshold gate, summary
     markdown formatting
   - `features/onboarding/domain.test.ts` (6 tests) — P-13 subscription/
     trial access evaluation, including the exact-boundary-instant edge
     case
   - `lib/permissions.test.ts` (16 tests) — every role-gated permission
     check, plus the P-13 billing-exemption check
   - `lib/cron/schedule-gate.test.ts` (10 tests) — target-hour and
     catch-up-deadline math, including a regression test for the real
     local-midnight wraparound bug fixed in
     `corrections/SPRINT_06_LESSONS.md` finding #14. Uses `"UTC"` as
     the test timezone specifically to avoid ever putting the real
     configured `OPERATIONS_TIMEZONE` value in committed code (the
     project's own business-location-privacy rule) — genuinely just a
     convenient DST-free test fixture, not the real value.
3. Correction to an earlier status report: this project already had
   `lint`/`typecheck` npm scripts (found while adding `test`/`test:run`
   next to them) — an earlier same-day audit incorrectly stated neither
   existed, from truncated command output. Noted here so it isn't
   repeated.

## Explicitly Out of Scope

- **Not testing anything that touches Supabase, Gemini, or another
  network dependency** — that needs a mocking strategy or a test
  database, a bigger decision than "add a test runner," left for a
  future sprint if the Director wants it.
- **Not bumping `@types/node`** to unlock `vitest@5` (which fixes a
  moderate `@vitest/mocker` path-traversal advisory, dev-only, never
  reaches production) — a project-wide Node-types version change is a
  separate call with its own blast radius, not folded into "add a test
  runner" tonight.
- **No CI wiring yet** — `npm run test:run` exists and passes, but
  nothing runs it automatically on push. That's `SPRINT_13`.

## Definition of Done

- [x] `tsc --noEmit` / `next build` clean, including the new test files
- [x] Naming-discipline audit clean on every new file
- [x] Real verification: `npx vitest run` executed for real, 64/64
      tests passing, not assumed from reading the test code
- [x] `npm audit` checked after adding vitest; a **CRITICAL**
      unrelated Next.js RCE was found this way and patched immediately
      as its own dedicated commit (`53d944a`) ahead of this sprint's
      own work — see that commit message for full detail
- [x] No deploy needed for this sprint's own changes (test files and
      config never ship to the Vercel runtime — Next.js's own build
      already confirmed they aren't bundled, and `npm run build`'s
      route table is unchanged)

## Handoff Note

```
HANDOFF NOTE — Sprint 12
Completed: Vitest installed and configured, 64 passing tests across 5
  pure-function files, npm run test / test:run scripts.
Not completed: nothing DB/network-touching is tested yet (deliberately
  out of scope -- needs a mocking/test-DB decision first).
Open risks: none new. A CRITICAL Next.js RCE was found and patched
  while doing this work (unrelated to testing itself) -- see the
  security commit for detail, already deployed and verified live.
Technical debt: @types/node pinned to ^20 blocks vitest@5 (dev-only,
  moderate severity, no production impact) -- a future, separate call.
Next sprint: SPRINT_13 (CI: run npm run typecheck / build / test:run
  automatically on every push).
```

---

*Vibe-Coding Journal — Sprint 12 — governed by Commander v1.4*
