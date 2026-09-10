# HANDOFF — Content Pipeline Fix (unbounded report growth + dashboard never wired)

**Scope:** two related, serious bugs found and fixed while investigating
"why does the live site always show empty content" — both root-caused to
real production impact, both live-verified fixed, not assumed from code
review. **Not a new sprint** — a direct fix on top of already-closed
Sprints 1-6 (the content pipeline) and Sprint 07 (the dashboard/paywall
UI), discovered 2026-09-10.

**Date:** 2026-09-10
**Commits:** `a345084` (date-scoping fix), `108f530` (dashboard wiring
fix), temp diagnostic routes created and removed same session.

---

## What was actually wrong

### 1. `getArticlesForDailyReport()` had no date window at all

Every cron run re-pulled the **entire all-time article history** — no
`WHERE created_at >= ...`, no limit. By 2026-09-10 this had grown to 937
articles / 1874 minutes (31+ hours) reading time / 745 KB of markdown
per "daily" report. With that much accumulated content, *some* article
somewhere in the ever-growing pile essentially always triggered the P-3
hype-word hold gate — **51 consecutive days held for review**, going
back to at least September 1st (probably earlier), with zero
auto-published reports in that entire window.

**Fix (`features/pipeline/repository.ts`):** scope to articles collected
since the most recent prior report (falls back to a 48h window if none
exists yet). The cron's own schedule-gate already guarantees this only
runs once no report exists for today, so "the latest report" is always
the correct prior boundary.

### 2. `app/dashboard/page.tsx` never queried the database — at all

Even a perfectly-generated report would never have been visible: the
dashboard page rendered a hardcoded `SEED_DAILY_REPORT` constant
unconditionally, shipped in Sprint 1 with an explicit comment — *"Real
pipeline comes Sprint 2+"* — that was simply never acted on once Sprints
2-6 built that real pipeline. Every visitor, this entire project's life,
saw the identical Sprint-1 placeholder regardless of what was actually in
`daily_reports`.

**Fix:** the page now fetches today's report (if
`auto_published`/`manually_approved`), falls back to the most recent
published report if today's isn't ready, and only shows a genuine empty
state if nothing has ever published — held_for_review/rejected reports
are never shown (P-6's entire point). Also added
`export const dynamic = "force-dynamic"` — without it, Next.js
statically pre-renders the page at *build* time, which would have served
one permanently-stale snapshot instead of live per-request data (caught
via the build output still showing `○ Static` after the initial fix,
before this was added).

---

## How this was found (not guessed)

1. Director asked for an honest project status check. Live-checking the
   production dashboard showed "0 articles, empty-state" — same as every
   prior check this session.
2. Checked the real GitHub Actions `hourly-digest-trigger.yml` run
   history (`gh run list`/`gh run view --log`) across ~40 recent
   invocations — found the actual (non-skipped) pipeline runs and their
   real JSON response bodies, showing `article_count` climbing by ~20
   every single day and `review_status: held_for_review` every time.
3. A temporary diagnostic route (created, used, deleted same session)
   read the `sources` and `daily_reports` tables directly — confirmed
   `heldCount: 51`, and that `markdown_length`/`reading_time_minutes`
   were growing without bound.
4. Traced to `getArticlesForDailyReport()`'s missing date filter by
   reading the function directly.
5. Fixed, deployed, then **proved** the fix live: manually triggered the
   real GitHub Actions workflow (`gh workflow run` /
   `workflow_dispatch`) after resetting today's stale report row, waited
   for the real ~3.5-minute pipeline run to complete, and confirmed via
   the real response: `articleCount: 22`, `reviewStatus:
   "auto_published"`.
6. That still didn't show up on the dashboard — traced to finding #2
   above (page never wired to real data at all), fixed, redeployed.
7. Final proof: registered a fresh trial account, logged in, loaded
   `/dashboard` for real, and read the actual rendered page — 22 real
   articles with real summaries, sources, categories, and "why it
   matters" reasoning, correct `22 articles • 44 min read`,
   "Auto-published" badge. This is the first time in this project's
   history the real product has been confirmed working end-to-end for an
   actual visitor.

---

## Known follow-ups, not addressed here

- **51 historical bloated reports remain in the database** — Director's
  explicit decision: keep as historical record, not delete. Director
  also raised interest in eventually using this history to improve the
  pipeline over time (e.g. feeding past reports/decisions back into
  quality tuning) — **not scoped or designed here**, a distinct future
  feature idea, not invented into an implementation.
- **Only 2 real sources are active** (Hacker News Front Page, GitHub
  Blog) — thin but not itself broken; a placeholder test feed and one
  failed query-based HN feed are disabled. Expanding source coverage is
  a separate, not-yet-scoped decision.
- **One transient Gemini `HTTP 503`** appeared during the verification
  run (a single article failed to summarize) — did not block
  auto-publish, not investigated further; worth watching if it recurs
  more than occasionally.
- The `article_count` field name reads oddly for what's actually a
  per-report count now that the fix is in (it was effectively a
  cumulative counter before) — no longer a bug, just noting the name
  wasn't misleading by design, it was a symptom of the underlying issue.

---

## DONE_CHECKLIST

- [x] Root cause of unbounded report growth identified and fixed
      (`features/pipeline/repository.ts`)
- [x] Root cause of dashboard never showing real content identified and
      fixed (`app/dashboard/page.tsx`)
- [x] Both fixes live-verified against real production data, not
      assumed from code review — a real cron run producing a real,
      correctly-sized, auto-published report; a real authenticated
      pageview showing that report's actual content
- [x] `tsc --noEmit` / `next build` clean, `/dashboard` confirmed
      dynamically rendered (not statically cached at build time)
- [x] Naming-discipline audit clean on every new/changed file
- [x] All temp diagnostic routes and the throwaway test account created
      during this investigation removed/deleted

---

*Vibe-Coding Journal — governed by Commander v1.4.*
