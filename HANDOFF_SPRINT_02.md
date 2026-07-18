# HANDOFF — Sprint 02 (Source Collector + Duplicate Engine)

**Written retroactively 2026-07-18** during the Sprint 04 close-out, reflecting
what was *actually* built and — importantly — two latent bugs that shipped in
this sprint and were only caught later (see "Open risks").

---

## Completed

- **Source Collector** (`features/sources/`)
  - `sources` table (migration 002) with health fields: `enabled`,
    `last_polled`, `last_success`, `failure_count`.
  - `domain.ts`: `SOURCE_HEALTH_CONFIG` (MAX_FAILURES=3, EXPECTED_CADENCE_HOURS=24,
    HTTP_TIMEOUT_MS=10000), `shouldAutoDisableSource`, `isSourceStale`.
  - `actions.ts`: `collectArticlesFromAllSources` — HEAD reachability check,
    RSS/API parse, upsert on `hash`, per-source failure tracking + auto-disable.
  - `repository.ts`: CRUD (`getEnabledSources`, `getAllSources`, `getSourceById`,
    `createSource`, `updateSource`, `deleteSource`).
- **Duplicate Engine** (`features/pipeline/`)
  - `domain.ts`: `SIMILARITY_THRESHOLD = 0.85` (PDL-003), hash + Jaccard similarity.
  - `repository.ts`: `getArticleByHash`, `markArticleAsDuplicate`,
    `getNonDuplicateArticles`, `getArticlesForDailyReport`.
- **Cron** `/api/cron/daily-digest` — Bearer-secret auth, Phase 1 (collect) +
  Phase 2 (dedup) orchestration with per-phase results.
- PDL-003 logged in DECISION_LOG.md.

## Not completed (correctly deferred)

- Quality Engine, Classifier, AI Summary → Sprint 03.
- Scheduler → Sprint 04 (Vercel Cron).
- Similarity/embedding dedup is a Jaccard approximation, not real vectors
  (documented as MVP).

## Open risks / technical debt

> These are the honest retroactive findings. Both shipped GREEN in Sprint 02 and
> were only discovered in Sprint 04 when the pipeline first ran on **real** RSS
> sources. See [[SPRINT_04_LESSONS]] and the batch-approval lesson.

1. **`getArticleByHash` self-match bug (shipped, fixed in Sprint 04).**
   Ingestion upserts on `hash`, so a hash is unique. `getArticleByHash(hash)`
   with no self-exclusion returned the article *itself*, so the dedup loop marked
   **every** article as a duplicate of itself. With test data this looked like
   "dedup works (found duplicates)"; on real data it zeroed out the whole
   pipeline. Fixed by adding `excludeId`. The Sprint 02 DoD item "Duplicate
   detection tested with sample data" was checked, but the test data masked the
   bug — a review gate should have caught this.

2. **`getEnabledSources` used the anon client (shipped, fixed in Sprint 04).**
   The `sources` table has RLS blocking anon reads; the cron runs server-side
   with no session, so it saw **zero** sources. Never surfaced in Sprint 02/03
   because no real sources were configured. Fixed to use `supabaseAdmin`.

3. **RSS parser is regex-based** and does not handle CDATA-wrapped titles or Atom
   `<entry>`/`<link href>`. Real feeds (e.g. hnrss under Node fetch) intermittently
   yield zero parsed items. GitHub Blog RSS parses fine. Consider a real XML parser.

## DONE_CHECKLIST (actual status)

- [x] `tsc --noEmit` zero errors
- [x] Sources CRUD via repository functions
- [x] Source health: reachability, staleness, auto-disable on 3× failures
- [x] `/api/cron/daily-digest` accepts request and logs execution
- [~] Duplicate detection tested with sample data — **tested but buggy**; the
      self-match defect passed because sample data hid it (fixed Sprint 04)
- [x] Similarity threshold logged in DECISION_LOG.md PDL-003
- [~] `duplicate_of` correctly set — **incorrect** in the shipped version
      (set to self); correct after Sprint 04 fix
- [x] Hash populated on all collected articles
- [x] No hardcoded thresholds (constants/Zod)
- [x] P-1.1 fail-loudly verified (per-source errors surfaced, not swallowed)
- [x] corrections/SPRINT_02_LESSONS.md created

**Legend:** [x] done · [~] done-but-defective / partial · [ ] not done

## Next sprint

Sprint 03 — Quality Engine + Classifier + Review Queue + Email.

---
*Retroactive handoff · governed by Commander v1.2*
