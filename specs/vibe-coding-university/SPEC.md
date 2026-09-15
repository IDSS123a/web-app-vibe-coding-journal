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

## Amendment — Scope correction + supplementary growth vision (2026-09-15, PDL-037)

**Scope correction:** "minimum 20 lessons per level" was being treated
as exactly 20, not a floor. Director corrected this — the count needs
to be large enough for real curriculum quality, not just clear the
minimum, for every level. Resolved via AskUserQuestion: **5 chapters
per level instead of 4 (~25 lessons/level, 75 total)**, applied
retroactively to Beginner (already complete at the old 20) as well as
Intermediate and Expert. See `CURRICULUM_DRAFT.md` v3 and PDL-037 for
the full record, including live re-verification that the chapter/level
gating logic re-locks correctly when a chapter is added (it was never
hardcoded to a fixed count).

**Supplementary growth vision (future, not scoped for build yet):**
Director's conclusion — as the article knowledge base grows through
this app's Daily Report pipeline, new lessons/chapters should be
created *autonomously* over time, organized by level according to
difficulty/complexity of the underlying material. Clarified via
AskUserQuestion:

- This applies to the **supplementary layer only** — the ~75-lesson
  hand-authored core (this Amendment + the previous one) stays fixed
  and does not get modified or extended automatically. This isn't a
  new concept — the original spec always described supplementary
  content as an "add-on for knowledge advancement" placed by level;
  what's new is the explicit direction that it should scale
  *organized by level/difficulty* as the article corpus grows, not stay
  a flat, ungated list the way it renders today (see `/university`,
  the "Supplementary" section under each level).
- Explicitly **not scoped for design or build right now** — recorded
  here as a roadmap item. Director confirmed: continue hand-authoring
  the remaining Intermediate/Expert core lessons; revisit this once
  the core is further along.
- **Directly touches standing AI-cost constraints already on record**:
  P-19 (chatbot/RAG — no paid AI budget without real traffic) and
  PDL-021 (free-only Gemini). Any real design for "autonomous,
  difficulty-classified lesson growth from a growing article corpus"
  needs to reconcile against those the same way
  `specs/vibe-coding-intelligence-engine/ROADMAP.md` already reconciled
  a similarly-shaped "Knowledge Engine" mandate — likely the right home
  for this item once it's actually picked up, rather than duplicating
  a second roadmap document for the same underlying cost tension.

## Amendment — Autonomous supplementary growth, picked up (2026-09-15, PDL-042)

Director picked up the PDL-038 roadmap item explicitly ("nastavi
kreirati naredne korake, samostalni rast dopunskog sloja iz sve većeg
broja članaka") before going offline for the night — this assistant
proceeds under the same autonomous-overnight-work precedent as
PDL-019 (Sprint 10-11), with the same discipline: real verification at
every step, decisions logged as they're made, nothing published to end
users without going through the existing human review gate.

**What actually changes, concretely:**

- The weekly generation cron (`app/api/cron/university-generate/route.ts`)
  no longer stops when there's no rejected/reset stub lesson to retry.
  It falls through to a NEW mode: propose an entirely new supplementary
  lesson topic from unused high-relevance articles, rather than only
  filling a pre-titled slot. This is a deliberate reversal of the
  original design comment in `lib/ai/ai-provider.ts`
  (`GenerateLessonInput`) — "deliberately not 'invent a lesson topic'…
  impossible to pre-review" — which was correct for the CORE curriculum
  (fixed, hand-authored, gated by Director review of the outline
  itself) but was never actually written with the supplementary layer
  in mind. Inventing a topic is safe here specifically because every
  generated lesson still lands in `pending_review`, same as before —
  nothing publishes without a human approving it in `/admin/university`.
- The same AI call that writes the lesson body also classifies which
  level (beginner/intermediate/expert) the topic actually fits, based
  on the complexity of the underlying concept — not which level the
  source article happened to be filed under. No second AI call, no
  extra cost: this is the "organized by level/difficulty instead of a
  flat list" requirement from PDL-038, resolved as one added field in
  the existing prompt/response shape.
- Existing lesson titles (the full 75-lesson core plus any prior
  supplementary lessons) are passed as context so the AI avoids
  proposing a topic that duplicates ground already taught.
- **No schema change** — reuses `lessons.is_core=false`,
  `lessons.chapter_id=null` (supplementary, unchaptered, per migration
  017), and the existing `pending_review` → admin-approve → `published`
  flow untouched since PDL-032/033.
- **No cost-budget change** — same weekly cadence, same
  `hasGenerationRunThisWeek` idempotency, same free-tier Gemini keys,
  same one-call-per-week ceiling. This is a routing/classification
  change to an existing budgeted call, not a new one.
- `/admin/university` now shows which level the AI proposed for each
  pending lesson (it previously showed no course/level context at
  all — a real pre-existing gap, worth closing regardless, but made
  load-bearing now that level classification is the actual point of
  the change).
