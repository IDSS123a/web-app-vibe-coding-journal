# SPRINT_20 — Vibe-Coding University + Dictionary (first version)
# Vibe-Coding Journal
# Status: COMPLETE 2026-09-14/15 — specs/vibe-coding-university/, DECISION_LOG.md PDL-032

---

## Origin

Director's request, same session as the design sprint: "Uvešćemo
riječnik za vibe-codere i napraviti vibe-coding university... curriculum
se sam unapređuje kako se baza članaka i znanja širi, iz dana u dan."
Given the scale, this went through the full FEATURE_LIFECYCLE
(`/specify` → `/plan-feature`) before any code — see
`specs/vibe-coding-university/SPEC.md` and `PLAN.md` for the resolved
open questions and the AI-cost budget reasoning.

## Scope — IN

- **Data model** (migrations 014/015): `courses`, `lessons` (stub →
  pending_review → published), `dictionary_terms`, `course_progress`
  (a track separate from Sprint 19's coin/level system, per the
  Director's explicit choice), `university_generation_runs`.
- **Curriculum outline** (`specs/vibe-coding-university/
  CURRICULUM_DRAFT.md`): 3 courses (beginner/intermediate/expert), 15
  lesson slots, proposed by this assistant per the confirmed authorship
  model — not yet reviewed by the Director in detail, only the shape
  (3 levels, weekly fill-in) was confirmed. Lesson 1 hand-written and
  published so the feature has real content on day one.
- **Weekly AI generation cron** (`/api/cron/university-generate`):
  fills in the next stub lesson from recent high-relevance articles,
  hard-capped at ~4 Gemini calls/run, own idempotency (ISO week), own
  schedule — deliberately NOT sharing the daily digest pipeline's
  budget, which was stabilized earlier the same day (PDL-027).
- **Review queue** (`/admin/university`): generated lessons land in
  `pending_review`, mirroring `/admin/review-queue`'s existing
  approve/reject pattern — nothing AI-generated reaches a subscriber
  unreviewed.
- **Public UI**: `/university` (course list + per-lesson completion
  tracking), `/university/[course]/[lesson]` (reader), `/dictionary`
  (searchable terms) — all Premium-gated (`PremiumGuard`, a new
  tier-specific guard distinct from `SubscriptionGuard`'s general
  access check) and Swiss-styled from the start.
- **Admin payment visibility carried over from Sprint 19** was already
  live; this sprint added the University nav link to the shared admin
  layout.

## Real bug caught before shipping

An earlier draft would have added a generated lesson's candidate
Dictionary terms to the public dictionary at GENERATION time, before
admin review. A rejected lesson would then leave an orphaned term
citing content that never actually published. Fixed (migration 015):
terms travel with the lesson row (`candidate_terms`) and only reach
`dictionary_terms` when the admin approves that specific lesson.

## Scope — OUT (deliberate, not forgotten)

- Curriculum topics beyond the 15 seeded slots — the generation job
  fills existing slots only; proposing NEW topics once all 15 are full
  is explicitly future work (PLAN.md)
- Any UI for the Director to reorder/edit the curriculum outline
  directly — corrections go through normal code changes for now
- Folding University XP into the Sprint 19 coin/level system — kept
  separate per the Director's explicit choice

## Verification — honest account

- [x] `tsc --noEmit` / `npx vitest run` (101/101, 7 new) / `npm run
      build` all clean
- [x] Naming-discipline audit clean on every new/changed file
- [x] Both migrations + the curriculum seed applied directly to
      production, verified via `information_schema` and row counts
      (3 courses, 15 lessons, 1 published, 5 starter dictionary terms)
- [x] Visually verified locally (PremiumGuard's anon state, both new
      pages render) before deploying
- [x] Weekly trigger wired (`.github/workflows/university-generate-
      trigger.yml`, Monday 06:00 UTC + manual `workflow_dispatch`) —
      simpler than the daily digest's hourly-poke pattern since this
      endpoint is idempotent per ISO week, not per local target hour,
      so a single weekly firing is sufficient.
- [ ] **NOT yet observed**: the weekly generation cron actually running
      against real production data — the trigger exists but has not
      fired yet (next Monday, or manually via `workflow_dispatch`).
- [ ] **NOT yet observed**: a Premium subscriber's real session hitting
      `/university` or `/dictionary` — verified the anonymous-guard
      path live, not the authenticated Premium path (this session had
      an admin session, which bypasses the tier check via
      `isBillingExempt`, not a genuine Premium-tier session).

## Handoff Note

```
HANDOFF NOTE — Sprint 20
Completed: full data model, weekly generation pipeline (untriggered so
  far), admin review queue, public University + Dictionary UI, all
  Premium-gated and Swiss-styled.
Not completed: no cron trigger wired up yet for
  /api/cron/university-generate (needs its own GitHub Actions workflow
  or similar, separate from hourly-digest-trigger.yml); curriculum
  outline (CURRICULUM_DRAFT.md) awaits the Director's detailed review,
  only the high-level shape was confirmed; real Premium-tier session
  and real generation-run behavior both unverified against live
  traffic.
Open risks: the AI-generated lesson quality is completely unproven —
  first real output should be read carefully in the admin review queue
  before assuming the prompt is well-calibrated, same caution as every
  other AI-generated content type in this project.
Technical debt: none new.
Next: wire the weekly cron trigger; Director reviews
  CURRICULUM_DRAFT.md in detail; watch the first real generation run.
```

---

*Vibe-Coding Journal — Sprint 20 — governed by Commander v1.4*
