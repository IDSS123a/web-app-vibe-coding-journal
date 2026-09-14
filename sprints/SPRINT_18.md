# SPRINT_18 — Daily Intelligence Format (Phase 5, part 1 of 2)
# Vibe-Coding Journal
# Status: COMPLETE 2026-09-14 — Phase 5 of specs/vibe-coding-intelligence-engine/ROADMAP.md (report-format half only; weekly rollup deferred, see Handoff)

---

## Origin

Fifth and final phased-roadmap item. Director's words this session:
*"Idi dalje naredni zadatak"* — after PDL-027's outage response and the
auto-deploy/backlog follow-up work, Phase 5 was the only unstarted item
left on `specs/vibe-coding-intelligence-engine/ROADMAP.md`.

## Scope — IN

Restructured every digest entry into the mandate's WHAT HAPPENED / WHY
IT MATTERS / EVIDENCE / CONFIDENCE / WHAT TO WATCH shape, replacing the
original "simple aggregation for MVP" markdown
(`app/api/cron/daily-digest/route.ts`'s old `generateDailyReport()`
body, unchanged since Sprint 1).

- **Migration 012** (`supabase/migrations/012_what_to_watch.sql`):
  `articles.what_to_watch` — the only genuinely new field the format
  needs; the other four map onto columns that already existed
  (`summary`/`raw_summary`, `why_it_matters`/`who_it_affects`, `source`
  + `relevance_score` + `getRelatedSourcesForArticles()`,
  `confidence_score`). Applied directly to production via the Supabase
  Management API (same mechanism as prior migrations), verified via
  `information_schema.columns` before use.
- `lib/ai/ai-provider.ts` / `lib/ai/gemini-provider.ts`: `what_to_watch`
  folded into the **existing** `summarize()` call and its JSON schema —
  no new AI call, no new Gemini quota cost, same principle as Phase 3's
  Evidence Framing (PDL-024).
- `lib/validation/schemas.ts`: `articleSchema` extended.
- `features/pipeline/repository.ts`: `updateArticleSummary()` persists
  the new field.
- `app/api/cron/daily-digest/route.ts`: new `formatDigestEntry()`
  builds the five-part markdown per article, including "also covered
  by" (Phase 4) folded into the EVIDENCE line as real corroborating
  signal, not just a UI nicety.
- `components/ArticleListWithBookmarks.tsx`: same fields added to the
  **primary** user-facing rendering (`/dashboard`, `/archive/[date]`)
  — the report's raw `markdown` is only ever a fallback for reports
  predating Sprint 10's per-article linking, so the format upgrade had
  to land here too, not just in the markdown generator.

## Real, pre-existing gap found and fixed along the way

`who_it_affects` and `worth_trying` — both required P-3 judgment
fields, both collected by `summarize()` since Sprint 05 — were **never
actually rendered anywhere**, not in the old markdown, not in
`ArticleListWithBookmarks`. They were computed, persisted, and then
silently unused for four months. Both are now shown (why_it_matters's
parenthetical, and a colored Yes/No/Maybe badge respectively).

## Scope — OUT (deferred, not forgotten)

The roadmap's Phase 5 also specifies a **weekly rollup** (major shifts,
reality check, tools to watch) as a new, lower-frequency report type.
Not done here — it needs its own schedule/trigger, a `report_type`
distinction on `daily_reports` (or a new table; that table's `date`
column is currently unique per single date, one row per day), and a
new UI surface, which is meaningfully more architectural surface area
than the format restructure above. Splitting it out matches
`corrections/SPRINT_04_LESSONS.md` finding #15 (no batch-approval
without its own verification gate) rather than bundling two
differently-sized changes into one sprint. Tracked as the next item —
see Handoff.

## Verification — honest account

- [x] `tsc --noEmit` / `npx vitest run` (80/80) / `npm run build` all
      clean
- [x] Naming-discipline audit clean on every changed file
- [x] Migration applied directly to production, column existence
      re-queried and confirmed via `information_schema.columns`
- [ ] **NOT yet observed**: a real cron run producing a report with the
      new format end-to-end. This endpoint runs once per calendar day
      (see PDL-027's same-day follow-up) and today's report already
      exists — the first real proof is tomorrow's natural run, same
      constraint as the `MAX_ARTICLES_PER_QUALITY_RUN` raise earlier
      today. Both should be checked together against the same run.

## Handoff Note

```
HANDOFF NOTE — Sprint 18
Completed: report-format restructure (WHAT HAPPENED/WHY IT MATTERS/
  EVIDENCE/CONFIDENCE/WHAT TO WATCH), in both the digest markdown and
  the primary dashboard/archive UI; a real pre-existing gap
  (who_it_affects/worth_trying never rendered) fixed as part of this.
Not completed: the roadmap's weekly rollup report type -- deliberately
  scoped out, real architectural surface area (schedule, data model,
  UI), not done without its own explicit go-ahead.
Open risks: what_to_watch is new AI-generated content with no
  calibration history yet (unlike relevance_score, which had real
  examples to check against during Phase 2) -- watch its first few
  days of real output for quality before treating it as reliable.
Technical debt: none new.
Next: either the weekly rollup (Phase 5 part 2), or confirm today's
  two pending same-day-unverifiable changes (this sprint + the
  MAX_ARTICLES_PER_QUALITY_RUN raise) against tomorrow's real run
  before building further on top of either.
```

---

*Vibe-Coding Journal — Sprint 18 — governed by Commander v1.4*
