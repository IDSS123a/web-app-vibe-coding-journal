# SPRINT_02 — Source Collector, Duplicate Engine
# Vibe-Coding Journal
# Status: IN PROGRESS

---

## Scope — IN

### 1. Source Collector (`features/sources/`)
   - **Domain model:** Source registry (title, url, type: RSS|API, enabled, last_polled)
   - **Database:** sources table (Supabase migration)
   - **Repository:** CRUD operations, query by type, filter by enabled status
   - **Actions:** Fetch & parse RSS feeds + API endpoints
   - **P-7 Compliance:** Health checks per source
     - Reachability test (HTTP HEAD before full fetch)
     - Staleness detection (last_updated vs. expected cadence)
     - Auto-disable on 3× consecutive failures
     - Fallback source selection (if primary source down, use backup)

### 2. Duplicate Engine (`features/pipeline/`)
   - **Hash-based deduplication:** MD5/SHA256 of (title + url) identifies exact duplicates
   - **Similarity-based deduplication:** Cosine similarity on article summary vectors
   - **Domain logic:** 
     - Hash matching: O(1) lookup via article.hash field (P-4)
     - Similarity threshold: P-5 decision (to be configured this sprint)
     - Conflict resolution: newer article wins, old marked with `duplicate_of` reference
   - **Repository functions:**
     - `getArticleByHash(hash: string)` → Article | null
     - `findSimilarArticles(text: string, threshold: number)` → Article[]
     - `markAsDuplicate(articleId: string, duplicateOfId: string)` → void
   - **Threshold decision:** 
     - Cosine similarity threshold (0.0-1.0) — value to be logged in DECISION_LOG.md PDL-003
     - Default starting point: 0.85 (tunable, not hardcoded)

### 3. Cron Integration (minimal for Sprint 02)
   - **Route:** `/api/cron/daily-digest` (POST, authenticated via secret header)
   - **Orchestration logic:** 
     - Fetch all enabled sources
     - For each source: poll, parse, store raw articles
     - Deduplicate (hash + similarity)
     - Store deduplicated articles with `quality_score = null` (Quality Engine sets this, Sprint 3)
   - **Trigger:** Manual via curl for testing (e.g., `curl -X POST http://localhost:3000/api/cron/daily-digest -H "Authorization: Bearer $CRON_SECRET"`)
   - **No scheduler yet:** Vercel Crons / external scheduler decision deferred to Sprint 3 (when pipeline is stable)
   - **Logging:** Each stage logs to stdout/Sentry with timestamps (E-8 monitoring)

### 4. Supabase Schema Extension (Migrations)
   - **sources table:**
     ```
     id, name, url, type (RSS|API), enabled, 
     last_polled, last_success, failure_count, 
     created_at, updated_at
     ```
   - **Update articles table:**
     - Add `source_id` FK reference to sources
     - Hash is already present (Sprint 1)
     - `duplicate_of` is already present (Sprint 1)

### 5. Zod Schemas (E-2: All inputs validated)
   - Source creation/update validation
   - Article creation validation (ensure hash is set)
   - Cron endpoint authentication validation

---

## Scope — OUT (explicitly, do not build)

- Quality Engine (confidence scoring, filtering) — Sprint 3
- AI Summary generation — Sprint 3+
- Classifier (category assignment) — Sprint 3+
- Scheduler setup (Vercel Crons, external service) — Sprint 3+
- Email notifications (requires Resend setup) — Sprint 3+
- Review queue UI/notifications — Sprint 3+
- Bookmarks, Archive, Admin panels — Sprints 4+
- Personalization — Sprint 5+ (after engagement data available)

---

## Constitution References

- **P-1** (Almost-Zero-Maintenance): Pipeline stages must fail loudly (sources auto-disable on 3× failures, not silently retry forever)
- **P-4** (Content Domain Model): Article schema with `source_id`, `hash`, `duplicate_of` fields
- **P-5** (Quality Thresholds): Similarity threshold is a decision (PDL-003), not a guess
- **P-6** (Review Queue): Not implemented yet; deferred to Sprint 3
- **P-7** (Source Health Monitoring): Health checks, auto-disable on failure
- **P-9** (Stack — Pipeline/Jobs layer): This sprint builds the first two stages (Source Collector → Duplicate Engine)

---

## Definition of Done

Full Commander DONE_CHECKLIST.md applies, plus Sprint 02 specifics:

- [ ] `npx tsc --noEmit` zero errors
- [ ] Sources can be created/read/updated via Repository functions (not UI yet)
- [ ] Source health check tested: reachability, staleness, auto-disable on 3× failures
- [ ] `/api/cron/daily-digest` endpoint accepts request and logs execution
- [ ] Duplicate detection (hash + similarity) tested with sample data
- [ ] Similarity threshold logged in DECISION_LOG.md PDL-003
- [ ] All duplicate_of references correctly set on matched articles
- [ ] Hash field populated on all articles from Source Collector
- [ ] No hardcoded thresholds; all in constants or Zod schemas
- [ ] Error handling: P-1.1 (failures don't silently degrade) verified
- [ ] corrections/SPRINT_02_LESSONS.md created with learnings

---

## Handoff Note Template (fill at sprint end)

```
HANDOFF NOTE — Sprint 02
Completed: [...]
Not completed: [...]
Open risks: [...]
Technical debt: [...]
Next sprint: [recommended: Sprint 03 — Quality Engine + Classifier]
```

---

*Vibe-Coding Journal — Sprint 02 — governed by Commander v1.2*
