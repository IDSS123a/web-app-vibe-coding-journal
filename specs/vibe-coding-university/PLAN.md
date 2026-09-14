# PLAN — Vibe-Coding University (+ Vibe-Coding Dictionary)

## Architecture

Two new feature slices, following the existing five-layer pattern
(A-1):

- `features/university/` — courses, lessons, course_progress (domain +
  repository), the AI lesson-generation logic
- `features/dictionary/` — terms (domain + repository)

**New cron endpoint**, separate from the daily digest pipeline:
`app/api/cron/university-generate/route.ts`. Deliberately its OWN
endpoint, own trigger, own budget — not folded into
`app/api/cron/daily-digest/route.ts`. That pipeline was just stabilized
after a real multi-layer outage this same day (PDL-027); adding more AI
call volume to it would reintroduce exactly the risk just closed.

**Presentation**: `/university` (course list, Premium-gated via
`SubscriptionGuard`-style check but for `tier === "premium"`
specifically, not just any active subscription — `lib/permissions.ts`
needs a new `requiresPremium` check alongside the existing role checks),
`/university/[courseSlug]/[lessonSlug]` (lesson reader), `/dictionary`
(searchable term list).

## AI Cost Budget — the highest-risk part of this feature

Confirmed live (PDL-027): Gemini free-tier is ~160 calls/day
theoretical ceiling (8 keys × `GenerateRequestsPerDayPerProjectPerModel-
FreeTier` quota 20/day/key). The daily digest pipeline alone can already
use up to ~80 calls on a busy day (relevance + summarize, up to
`MAX_ARTICLES_PER_QUALITY_RUN` = 40 articles × up to 2 calls each).

**Proposed budget: WEEKLY generation, not daily, hard-capped per run:**
- `UNIVERSITY_GENERATION_CADENCE`: once per calendar week (own
  idempotency check, same pattern as the daily digest's
  `getDailyReportByDate` — a `university_generation_runs` table tracks
  the last run's ISO week, skips if already run this week)
- Per run: generate **at most 1 new lesson**, from the highest-
  relevance-score articles collected in the past 7 days that haven't
  already been used as lesson source material (tracked via a
  `source_article_ids` array column on the lesson row, same
  idempotency principle as `reward_events`' dedupeKey)
- Per-run Gemini call budget: **≤ 4 calls** — (1) classify which
  course/level the new lesson belongs in, (2) synthesize the lesson
  body from the source articles, (3) extract 1-5 new Dictionary terms
  introduced by the lesson, (4) one retry/fallback budget reserved, not
  a guaranteed 4th call
- **Worst case addition to the weekly Gemini budget: ~4 calls/week**,
  negligible against the ~1120/week theoretical ceiling (160×7) — even
  generous safety margin versus the daily pipeline's own variable load
- Runs at a schedule-gate target hour DISTINCT from the daily digest's
  own target hour (reuse `lib/cron/schedule-gate.ts`'s pattern, new
  constant), so the two pipelines' AI calls never contend for the same
  per-minute rate limit window even in the worst case

**Explicit non-goal**: this is not "the curriculum grows every day" in
the literal sense the Director's phrasing suggested — it grows every
WEEK, deliberately, to stay inside the free-tier constraint (P-18/
PDL-021, a standing accepted-risk decision this plan does not reopen).
If the Director wants faster growth, that is a paid-AI-budget decision
(P-18 already flags this as the eventual real constraint) — not
something to solve by quietly increasing call volume against the free
tier again.

## Data Model

- `courses` — id, slug, title, level (`beginner`/`intermediate`/
  `expert`), description, order_index
- `lessons` — id, course_id (FK), slug, title, body (markdown, P-3
  editorial voice rules apply — no hype words here either), order_index,
  source_article_ids (uuid[], the articles this lesson was generated
  from — audit trail + idempotency), created_at
- `dictionary_terms` — id, term, definition, source_lesson_id (FK,
  nullable — a term can predate any specific lesson if the Director
  seeds an initial list)
- `course_progress` — user_id (FK), course_id (FK), lessons_completed
  (uuid[] or a join table), status (`not_started`/`in_progress`/
  `completed`) — the SEPARATE track from Sprint 19's coin/level system,
  per the Director's explicit choice
- `university_generation_runs` — id, iso_week (text, e.g. "2026-W38"),
  status, lesson_id (FK, nullable if the run failed), created_at — the
  idempotency/audit table for the weekly generation cron

## API / Server Actions

- `GET /api/university/courses` — list courses + the caller's progress
  (Premium-gated)
- `GET /api/university/courses/[slug]/lessons/[slug]` — one lesson
  (Premium-gated)
- `POST /api/university/progress` — mark a lesson complete
  (authenticated, Premium-gated)
- `GET /api/dictionary` — list/search terms (Premium-gated)
- `POST /api/cron/university-generate` — the weekly generation job
  (CRON_SECRET-authenticated, same pattern as the daily digest)

## Rule Constraints Applied

- **E-6**: every route above follows authenticate → authorize →
  validate → execute → return
- **P-3**: lesson body text follows the same editorial-voice rules
  (no hype words, actionable judgment) as Daily Report summaries — the
  `P3_SYSTEM_RULES` prompt block in `lib/ai/gemini-provider.ts` is
  reused, not reinvented
- **P-18/PDL-021**: this plan explicitly stays inside the free-tier
  constraint via the weekly cadence above — does not reopen that
  standing decision
- **P-20**: `/university` and `/dictionary` ship Swiss-styled from the
  start (this session's retrofit precedent), not built plain and
  retrofitted later
- **M-4**: the first-pass curriculum outline is proposed by this
  assistant and requires Director review/correction before being
  treated as final — not invented and shipped silently

## Risks / Deviations

- **New failure mode**: a bad AI-generated lesson (factually wrong,
  off-topic, or hype-word-violating) reaching a real subscriber. Same
  mitigation as the Daily Report: reuse the existing hype-word hold
  logic (`features/pipeline/quality-engine.ts`'s hold-gate pattern) —
  a newly-generated lesson is NOT auto-published, it lands in a
  `pending_review` status for the Director to approve via
  `/admin/university`, mirroring `/admin/review-queue`'s existing
  pattern exactly rather than inventing a new one.
- **Deviation from the Director's literal "grows day by day" phrasing**
  — deliberate, justified above by the AI cost budget; flagged clearly
  rather than silently reinterpreted.
