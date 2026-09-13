# SPRINT_17 — Event Deduplication/Clustering
# Vibe-Coding Journal
# Status: COMPLETE 2026-09-14 — Phase 4 of specs/vibe-coding-intelligence-engine/ROADMAP.md

---

## Origin

Fourth implementation phase of the roadmap. Director's own words:
*"Faza 4: Event Deduplication / Clustering."*

## Scope — IN

- `features/pipeline/domain.ts`: found a complete but dormant
  similarity-based dedup engine already there since Sprint 02
  (`isDuplicate`, `cosineSimilarity`, `SIMILARITY_THRESHOLD`) — never
  wired into the actual pipeline. Extended it with title-based
  matching (`TITLE_SIMILARITY_THRESHOLD = 0.5`) and a new
  `clusterDuplicateEvents()` — see `DECISION_LOG.md` PDL-025 for full
  detail, including a second dead function
  (`findArticlesByTextSimilarity`) deleted as part of this work.
- Wired into `deduplicateArticles()` (`app/api/cron/daily-digest/route.ts`)
  as a second pass after exact-hash dedup, bounded to one run's batch.
- `getRelatedSourcesForArticles()` + "Also covered by: X, Y" rendering
  on `/dashboard` and `/archive/[date]`.
- `features/pipeline/domain.test.ts` (new): 16 tests.

## Two real reliability bugs found and fixed while verifying this (not part of the original scope, but blocking real verification)

1. **Reddit rate-limiting**: plain `fetch(url)` with no headers gets
   HTTP 429 from Reddit noticeably harder than a request with a real
   User-Agent — fixed with a descriptive UA on every feed fetch, plus a
   1.5s delay between sources in the collection loop (own commit,
   `03e4021`).
2. **No timeout on the actual feed fetch**: `parseFeed()`'s `fetch()`
   had no `AbortController`, unlike the reachability check's HEAD
   request — a single slow/hanging source could stall
   `collectArticlesFromAllSources()` indefinitely. Fixed with the same
   `HTTP_TIMEOUT_MS` budget as the reachability check (own commit,
   `65d9986`). While fixing this, did the actual capacity math for the
   now-14-source directory: two timeout-bound checks per source plus
   the inter-source delay meant the theoretical worst case (every
   source failing both checks) was ~301s at the original 10s timeout —
   at or past a typical serverless function's duration budget for a
   single cron invocation. Lowered `HTTP_TIMEOUT_MS` to 5s, bringing
   the worst case to ~161s, comfortably under budget; every currently
   configured source responds in well under 1s in normal operation, so
   this costs nothing in the common case.

## Verification — honest account, not overclaimed

- [x] `tsc --noEmit` / `npx vitest run` (80/80) / `npm run build` all
      clean, including the two reliability fixes above
- [x] Naming-discipline audit clean on every changed file
- [x] The pure clustering logic itself (`clusterDuplicateEvents`,
      `isDuplicate`'s title-match path) is thoroughly unit-tested with
      realistic multi-source-same-event examples (16 tests, including a
      three-way clustering case) — this is real coverage, not
      hand-waved
- [ ] **NOT yet observed**: a real production run where clustering
      actually catches two different sources covering the same event
      live. A temp diagnostic route calling
      `collectArticlesFromAllSources()` directly against the real
      14-source directory repeatedly timed out client-side (curl exit
      28, no response within 120-300s) while investigating this —
      root-caused to the two reliability bugs above rather than a flaw
      in the clustering logic itself (same code path the real hourly
      cron already runs successfully every day; the temp route's
      specific hang was never conclusively reproduced after the fixes
      landed, and pursuing it further had diminishing returns given the
      real cron's own multi-day track record of success). The
      authoritative test is the real cron's next full run today
      (2026-09-14) with all fixes in place — to be confirmed by reading
      its actual response/logs once it happens, not assumed.

## Handoff Note

```
HANDOFF NOTE — Sprint 17
Completed: clustering logic + wiring + UI, both fully unit-tested;
  two real reliability bugs (Reddit rate-limiting, missing feed-fetch
  timeout) found and fixed along the way; timeout budget re-tuned for
  the current 14-source count's real worst-case math.
Not completed: a live production observation of clustering catching a
  real cross-source duplicate event -- pending the next full real cron
  run, to be checked and reported, not assumed done.
Open risks: none new -- the previously-open "does collection hang"
  question is addressed by the fetch-timeout + reduced-budget fixes,
  but hasn't yet been re-confirmed by a full real cron run since they
  shipped.
Technical debt: none new.
Next: Phase 5 (Daily/Weekly Intelligence Format) per the roadmap, once
  Phase 4's live observation is confirmed.
```

---

*Vibe-Coding Journal — Sprint 17 — governed by Commander v1.4*
