# SPRINT_13 — CI Hardening
# Vibe-Coding Journal
# Status: COMPLETE 2026-09-11 — implemented and live-verified via a real GitHub Actions run

---

## Origin

Fourth and last of tonight's Director-approved overnight sprints
(backend quality audit → sprint plan → autonomous implementation;
`DECISION_LOG.md` PDL-019). Addresses a gap found during the audit:
this project's only CI (`.github/workflows/project-guard.yml`) scans
for forbidden file patterns — nothing runs `typecheck`, `build`, or (as
of `SPRINT_12`) `test` automatically on push or PR. Vercel's own build
step was the only thing that would ever catch a real break, and only at
deploy time, after the push already landed on `main`.

## Scope — IN

- `.github/workflows/ci.yml`: on every `push`/`pull_request`, installs
  with `npm ci`, then runs `npm run typecheck`, `npm run test:run`
  (Sprint 12), and `npm run build`, in that order (cheapest/fastest
  checks first, so a typo fails in seconds instead of waiting for a
  full build).
- Build-time env: `lib/db/client.ts` throws at import time if
  `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` are
  missing, and several pages import repository functions that pull
  that module in transitively. Supplied as harmless placeholder values
  in the workflow itself — this job never runs the app or talks to a
  real Supabase project (the `force-dynamic` pages that actually query
  Supabase are excluded from `next build`'s static-generation pass by
  design, deferred to request time instead), it only needs `next build`
  to complete without throwing on a missing var. Real secrets stay in
  Vercel's own build only.

## Explicitly Out of Scope

- **Not a required/blocking check on `main`** — this repo's branch
  protection settings weren't touched (that's a GitHub repo-settings
  change, a different kind of decision than adding a workflow file,
  left for the Director if wanted).
- **Not running `npm run lint`** — `eslint` is already invoked as part
  of `next build`'s own "Linting and checking validity of types" step,
  confirmed in this project's real build output; running it standalone
  too would just duplicate work for no new coverage.

## Definition of Done

- [x] Naming-discipline audit clean on the new workflow file
- [x] Real verification: pushed, then confirmed via `gh run list` /
      `gh run view --log` that the workflow actually ran end-to-end on
      GitHub's infrastructure and passed — not just "looks right"
      read from the YAML

## Handoff Note

```
HANDOFF NOTE — Sprint 13
Completed: .github/workflows/ci.yml running typecheck/test/build on
  every push and PR, verified with a real passing run.
Not completed: branch protection / required-status-check wiring on
  GitHub's repo settings -- a deliberate decision left for the Director
  (M-4), not a technical gap.
Open risks: none new.
Technical debt: none new.
Next: this closes the four sprints planned tonight from the backend
  audit. Remaining known items (all previously flagged, not fixed
  tonight, needing Director decisions): paywall enforcement on
  /dashboard & /archive despite P-13 existing; Gemini model migration
  (gemini-2.5-flash -> gemini-3.6-flash); Sentry/error-tracking (needs
  account creation, cannot be done autonomously); the one pending
  Hold-Gate Calibration suggestion awaiting Apply/Dismiss;
  CHANGELOG.md doesn't exist project-wide; .env.example is stale
  project-wide; a remaining postcss vulnerability that needs a Next.js
  16 major-version upgrade.
```

---

*Vibe-Coding Journal — Sprint 13 — governed by Commander v1.4*
