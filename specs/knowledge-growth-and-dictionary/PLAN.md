# PLAN: Knowledge Growth, Dictionary Expansion and the No-AI-Tells Writing Rule

Follows ARCHITECTURE_PATTERNS A-1 to A-10 and ENGINEERING_RULES E-1 to E-13. No em dashes here.

## Root causes found before planning (2026-09-19, read only against production)

| Finding | Evidence |
|---|---|
| The daily run times out at 300 s again (third time) | Run 35444198913 at 12:54 UTC, HTTP 504, no report for 09-19 |
| Collection is O(feed length), one DB call per item, re-upserting every item every hour | Vercel atom feed holds about 1,500 entries; 5 sources took about 4 minutes; `last_success` gaps of 10 s to 2 min |
| 9 of 14 sources are disabled forever after 3 failures; today all of them answer HTTP 200 | `sources.enabled=false`, `failure_count=3`, live curl 200 for HN and Reddit |
| Quality engine is sequential, up to 4 Gemini calls per article, 20 articles per run | route.ts MAX_ARTICLES_PER_QUALITY_RUN, free tier 5 RPM per key |
| 3,793 of 4,037 articles never got a relevance score | 2,905 articles arrived on 2026-09-13 as a source backfill and were never processed |
| Only 1 report was ever published, 55 held, 5 rejected; two reports hold 900+ articles | daily_reports |
| Dictionary is 13 rows, grows only when an admin approves a weekly lesson | dictionary_terms, PDL-042 |
| Supplementary lessons: 2 total, one per week at most, last run 2026-W38 | lessons is_core=false |

## Architecture (layers per A-1)

**Domain (pure, tested)**
- `lib/text/no-ai-tells.ts`: `stripAiTells(text)` and `stripAiTellsDeep(value)`.
- `features/dictionary/domain.ts`: slug, normalisation, alias and group tables, level and tier
  types, `mergeTermSources`, `rankTerms` (search scoring), trending window maths.
- `features/pipeline/triage.ts`: `preRelevance(article, source)` heuristic, no AI.
- `features/pipeline/term-discovery.ts` (domain part): candidate extraction post-processing,
  `shouldPromote(candidate)` (3 or more mentions, 2 or more independent sources, inside 14 days).

**Infrastructure**
- Migration 023: extend `dictionary_terms` (slug, category_group, level, tier, aliases,
  related_terms, origin, status, mention counters, first_seen_at, last_seen_at); new
  `term_candidates`; `articles.relevance_source`; `sources.disabled_at`, `sources.retry_after`.
  RLS: default deny, service role only (matches migration 022 policy).
- Batch relevance in `lib/ai/gemini-provider.ts` (`assessRelevanceBatch`, 15 items per call),
  key cursor so calls start on different keys, `stripAiTellsDeep` on every parsed response.
- Collector rewrite in `features/sources/actions.ts`: parallel polling (concurrency 4), newest
  40 items per feed, ignore items older than 30 days, single batched insert with
  `ignoreDuplicates`, real `AbortController` per source, cool-down recovery for failing sources.

**Application**
- `daily-digest` route: wall-clock budget object passed to every phase; report step always
  gets its slice; at non-target hours the hourly poke drains the enrichment backlog instead of
  returning "skipped".
- New cron `/api/cron/term-discovery` and a section in the enrichment step.
- Dictionary API returns compact JSON with cache headers; new admin candidate review endpoint.
- University generation cadence and candidate flow reviewed in TASKS.

**Presentation**
- `/dictionary` rebuilt: search first, topic tiles, A to Z rail, level chips, essential toggle,
  related terms, new and trending badges, incremental rendering (50 at a time) so 2,600 rows
  never render at once.

## Data model decisions (A-10)

- `dictionary_terms.source_lesson_id` stays `on delete set null` (already).
- `term_candidates.term` unique; deleting an article never deletes a candidate (they keep
  article ids as a plain array, no FK, because articles are pruned by policy).
- Article deletion: `daily_report_articles.article_id` is `on delete cascade` (join rows only).
  Reports are regenerated from surviving links; the two 900 article reports are removed.

## API (E-6 five steps on every route)

- `GET /api/dictionary`: authenticate, authorise (Premium), execute, return terms + facets.
- `POST /api/cron/term-discovery`, `/api/cron/enrich`: cron secret (fail closed helper).
- `GET/PATCH /api/admin/dictionary-candidates`: admin only, zod validated.

## Rule constraints applied

- P-0: relevance below 60 is excluded everywhere, including the Dictionary default view.
- P-6: only reviewed or auto-published reports are shown; unchanged.
- PDL-021 free Gemini only: heuristic triage before AI, batch calls, budget guard.
- P-19: no RAG; term discovery is plain extraction plus counting.
- E-4: destructive step (article removal) preceded by a full JSON backup outside the repo and
  a dry run count; deletion is scripted, idempotent and logged.
- M-7: the levels/tier vocabulary lives only in `features/dictionary/domain.ts`.

## Risks and deviations

- Imported definitions come from two external documents and cannot be individually verified;
  they are marked origin `book_a` or `book_b` and can be corrected in place.
- Heuristic triage can skip a relevant article with no keywords. Mitigation: class A sources
  bypass triage; skipped items keep `relevance_source='triage'` so they can be re-scored.
- Gemini quota is shared by daily digest, University, Assistant and the new work. Backfill runs
  are rate limited and check key health first.
- Backup files hold only public news text but are still kept out of git.
