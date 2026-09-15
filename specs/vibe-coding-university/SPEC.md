# SPEC — Vibe-Coding University (+ Vibe-Coding Dictionary)

**Status: AMENDED 2026-09-15 — new open questions, see Amendment
section below.** The original 2026-09-14 scope shipped and was
live-verified (PDL-032/033); the Director's 2026-09-15 structural
requirements (chapters, quizzes, a 60-lesson core, level tests) are a
real expansion, not a bug fix, and need their own resolution before
`/plan-feature` is updated.

## Purpose

Director's own words: introduce a **Vibe-Coding Dictionary** (a glossary
for vibe-coders) and a **Vibe-Coding University** — a classroom where
fully-subscribed vibe-coders learn vibe-coding from scratch to expert
level, via a curriculum that keeps improving as the article/knowledge
base grows daily. Gamification (coins, streaks, levels — Sprint 19,
PDL-030) is meant to reach "full expression" here — the University is
where the reward system's actual substance lives, not just isolated
delight moments on existing pages.

Ties to M-1 (CTO Principle): this is not just "more content," it is the
product's second real pillar alongside the Daily Digest — a structured
learning path, not another feed.

## User Stories

- As a **Premium subscriber**, I can access the University and work
  through a curriculum from beginner to expert, so that I have a
  structured path instead of only ad-hoc daily articles.
- As a **Premium subscriber**, I can look up an unfamiliar term in the
  Dictionary while reading any article or lesson, so that jargon never
  blocks understanding.
- As a **Basic subscriber**, I do NOT have access to either the
  University or the Dictionary — both are Premium-exclusive (confirmed
  2026-09-14), a clear tier line and an upgrade incentive.
- As the **Director/admin**, I can see how the curriculum is structured
  and what "self-improves" actually means before it ships, so a vague
  promise doesn't become an uncontrolled AI-content-generation cost.

## Acceptance Criteria

- [ ] Dictionary: a browsable/searchable list of vibe-coding terms, each
      with a plain-language definition
- [ ] University: a structured curriculum with distinct levels
      (beginner → expert), each level containing lessons/modules
- [ ] Curriculum content connects to gamification (levels/streaks tie to
      actual course progress, not just app-wide engagement)
- [ ] Access gated to the confirmed tier(s) — see Open Questions
- [ ] Curriculum "self-improves" via a mechanism that is explicit and
      cost-bounded, not an open-ended promise — see Open Questions

## Explicitly Out of Scope (for this first version)

- Certificates, grading, or any formal credentialing
- Live/cohort-based teaching (this is self-paced, async)
- The chatbot (P-19) answering curriculum questions directly — P-19 is
  its own separately-scoped future sprint; not assumed folded in here

## Open Questions — all resolved 2026-09-14

1. **Self-improvement mechanism**: a real AI pipeline periodically
   GENERATES new lesson content from newly-ingested articles. This is a
   real, ongoing Gemini cost on top of the existing daily pipeline's
   already-strained free-tier budget (P-18/PDL-021; the daily quota is
   already the active bottleneck, see DECISION_LOG.md PDL-027 — that
   outage was caused in part by underestimating exactly this kind of
   AI-call volume). `/plan-feature` MUST size this against the
   confirmed ~160/day theoretical ceiling (8 keys × 20/day) and decide
   a generation cadence that leaves headroom for the main pipeline —
   the single highest-risk part of this feature, needs its own explicit
   budget line, not an assumption.
2. **Dictionary term source**: not asked directly, but AI-extraction
   from article/lesson text is the consistent default given decision 1
   (the same generation pipeline can reasonably emit both a lesson and
   the terms it introduces) — flagged here explicitly so it can be
   corrected if that assumption is wrong, rather than silently baked
   into `/plan-feature`.
3. **Access tier**: both University and Dictionary are Premium-only —
   a clear tier line, no Dictionary access for Basic.
4. **Curriculum authorship**: this assistant drafts a first-pass
   curriculum outline (levels, topics, ordering) from the existing
   article corpus; the Director reviews and corrects before it's
   treated as final — not invented unilaterally and shipped without
   review (M-4).
5. **Gamification relationship**: University progress is a **separate
   "course progress" track** (e.g. Beginner/Intermediate/Expert), not
   folded into the app-wide Vibe Coins/level balance from Sprint 19.
   Two distinct progress systems, related in spirit but independent in
   data model and UI.

## Amendment — Curriculum Structure (2026-09-15), following live verification of the generation pipeline (PDL-033)

The Director specified real structural requirements, materially larger
than the first version's flat "15 stub lessons, no gating" shape. This
supersedes the informal `CURRICULUM_DRAFT.md` outline where the two
conflict.

- **Minimum 20 lessons per level** (beginner/intermediate/expert) —
  **60 total core lessons**, not 15.
- **Chapters**: lessons are grouped into chapters within a level. A
  new organizational layer between level and lesson (not in the
  original migration 014 schema).
- **Chapter quiz gate**: after finishing a chapter's lessons, the user
  must answer 5 questions about that chapter before the next chapter
  unlocks. Passing threshold and question-regeneration strategy —
  see Open Questions below.
- **Level final test**: after all core lessons AND all chapter quizzes
  in a level are done, a cumulative test for the whole level.
- **Core vs. supplementary**: the 60 lessons above are the **core**
  curriculum — deliberately curated, not the product of the weekly
  drip-feed generator. Everything the weekly generation cron
  (PLAN.md, PDL-032/033) produces from here on is **supplementary**
  content layered on top of a complete core, not part of it. This is
  a meaningful reordering from the original plan, where the 15 stub
  slots effectively WERE the whole curriculum, filled in gradually —
  see Open Questions below for why generating the new 60-lesson core
  on the existing weekly cadence is not viable as specified.
- **"Top-tier gamification" at every step**: chapter completion, quiz
  passes, and the level final test each need their own visible
  celebration moment (Sprint 19's `CelebrationOverlay`/`ConfettiSystem`
  components, extended with new trigger points) — not just the
  existing single "lesson complete" toast.

### Open Questions — must be resolved before `/plan-feature`

1. **Core-curriculum generation pacing — the critical one.** The
   existing weekly cadence (PLAN.md, ~1 lesson/week, sized to protect
   the daily digest pipeline's Gemini budget per PDL-027) was designed
   for slow, ongoing supplementary growth on top of an already-complete
   curriculum. Generating 60 CORE lessons at 1/week would take over a
   year before the University has its stated minimum content — clearly
   not what "minimum 20 lessons per level" means as a launch
   requirement. This needs its own, separate decision:
   - **(a) Burst-generate the core now**, as a one-time, larger AI-call
     batch (e.g. spread across several triggered runs over days, not
     weeks) — real, one-time cost against the free-tier daily quota,
     needs its own explicit sizing (60 lessons × ~2-3 calls each ≈
     150-180 calls, roughly a full day's free-tier ceiling on its own
     — would need to run across several days' quota, or accept a paid
     burst).
   - **(b) This assistant hand-writes some/all of the 60 core lessons**
     directly (like Lesson 1 already was), no generation cost at all,
     slower for this assistant to produce but zero AI-budget risk and
     immediately reviewable.
   - **(c) A hybrid**: this assistant drafts real lesson bodies for
     Director review in this same conversation (fast, no cron
     involved), rather than either the weekly cron or a bulk unattended
     burst.
2. **Chapter quiz questions**: generated ONCE per chapter (when its
   lessons are finalized) and reused for every user's attempt, or
   freshly AI-generated per user attempt (real per-user ongoing cost,
   much larger scale implication — this is the same category of
   decision as #1)?
3. **Passing threshold**: how many of the 5 chapter-quiz questions
   must be correct to unlock the next chapter? How many attempts are
   allowed, and is there a cooldown or unlimited immediate retry?
4. **Level final test**: how many questions, and what passing bar?
   Same retry-policy question as #3.
