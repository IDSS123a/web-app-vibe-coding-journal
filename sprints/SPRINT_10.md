# SPRINT_10 — Bookmarks & Archive
# Vibe-Coding Journal
# Status: COMPLETE 2026-09-11 — implemented and live-verified against production

---

## Origin

Written by ACA from a Director-requested backend quality audit
(2026-09-11), which found `features/bookmarks/repository.ts` and
`features/archive/repository.ts` existed only as empty file-header
stubs — no domain logic, no API route, no UI, unreachable by any user.
Director approved a sprint plan and full autonomous implementation
overnight: *"napravi plan sprintova i kreni sa implementacijom... Dajem
ti odobrenje."* Per `corrections/SPRINT_04_LESSONS.md` finding #15 (no
batch-approval of multiple sprints without an independent review gate
between them), each sprint tonight gets a real-data verification pass
before the next begins — the human sign-off half of that gate is
explicitly waived for tonight by the Director's own instruction, not
silently skipped; see `DECISION_LOG.md` PDL-019.

## Scope — IN

1. **Migration 009** (`daily_report_articles`): links a `daily_reports`
   row to the `articles` rows actually rendered into it. Did not exist
   before — the pipeline only ever computed a time-window over
   `articles` at generation time (`getArticlesForDailyReport()`) without
   recording the result, so no reliable per-article view of a
   *specific* report (current or historical) was possible. Populated
   going forward only, via `linkArticlesToReport()` called from
   `generateDailyReport()` right after the report itself is saved
   (best-effort — a link failure never fails report generation).
2. **Bookmarks** (`features/bookmarks/`): `addBookmark`,
   `removeBookmark`, `getUserBookmarks` (joined with article data),
   `getBookmarkedArticleIds`. API: `GET/POST /api/bookmarks`,
   `DELETE /api/bookmarks/[articleId]` — any authenticated user, scoped
   to their own `user_id` server-side, never trusting a client-supplied
   user id. UI: bookmark toggle on every article card
   (`components/ArticleListWithBookmarks.tsx`), and a dedicated
   `/bookmarks` page.
3. **Archive** (`features/archive/`): `getPublishedReportsPage`
   (paginated, P-6-filtered), `getPublishedReportByDate`,
   `getArticlesForReport`. UI: `/archive` (list) and `/archive/[date]`
   (detail, same article-card rendering as the dashboard).
4. **Dashboard updated** to render today's report as individual
   bookmarkable article cards (when migration-009 data exists for it)
   instead of only the raw markdown blob.

## Explicitly Out of Scope

- **No retroactive backfill** of `daily_report_articles` for the ~50
  historical reports predating this migration — the Director already
  decided (2026-09-10) to keep those as untouched historical records.
  Those reports show their raw markdown, same as before; only reports
  generated after this sprint get the per-article view.
- **No paywall/subscription gating added to `/dashboard` or
  `/archive`.** Both stay exactly as publicly viewable as `/dashboard`
  already was — found live, during this sprint, that despite P-13's
  full subscription/trial data model existing at the DB layer, nothing
  anywhere actually enforces it on a page. Extending or fixing that is
  a real product decision (does the Director want a paywall here at
  all?), not inferred here (M-4). Flagged in the handoff, not decided.
  `/bookmarks` IS effectively gated, but only because per-user data has
  no meaningful anonymous view, not as a deliberate subscription check.

## Definition of Done

- [x] `tsc --noEmit` / `next build` clean
- [x] Naming-discipline audit clean on every new/changed file
- [x] Migration 009 applied directly to production via the Supabase
      Management API (established capability, this session) and its
      RLS/columns verified with a live query, not assumed
- [x] Real-data verification: a genuine bookmark add/list/remove cycle
      exercised against production with a real user session (not
      synthetic/mocked), and a real report's linked articles confirmed
      to render correctly on `/dashboard`
- [x] Deployed to production, live URLs checked

## Handoff Note

```
HANDOFF NOTE — Sprint 10
Completed: migration 009 (daily_report_articles), bookmarks repository +
  API + UI, archive repository + API-free SSR pages, dashboard updated
  to render per-article cards with bookmark toggles.
Not completed: n/a — full scope shipped.
Open risks: dashboard/archive have no paywall enforcement (pre-existing,
  not introduced by this sprint) -- needs a Director product decision.
Technical debt: none new; migration 009 only covers reports generated
  from this sprint forward, by design (see Explicitly Out of Scope).
Next sprint: SPRINT_11 (resume the paused Hold-Gate Calibration UI +
  fix the known suggestion-status 404 bug).
```

---

*Vibe-Coding Journal — Sprint 10 — governed by Commander v1.4*
