# SPEC — Vibe-Coding University (+ Vibe-Coding Dictionary)

**Status: CONFIRMED 2026-09-14 — proceeding to `/plan-feature`.** Written
per Commander's FEATURE_LIFECYCLE Step 1 (`/specify`) before any code,
given the size of this request. All open questions below resolved with
the Director the same day.

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
