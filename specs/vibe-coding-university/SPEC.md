# SPEC — Vibe-Coding University (+ Vibe-Coding Dictionary)

**Status: DRAFT — not yet confirmed by the Director.** Written per
Commander's FEATURE_LIFECYCLE Step 1 (`/specify`) before any code, given
the size of this request (2026-09-14). Do not implement against this
document until the open questions below are resolved and the Director
confirms the shape.

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
- As a **Basic subscriber**, [ACCESS LEVEL NOT YET CONFIRMED — see Open
  Questions] — does Basic get the Dictionary but not the University, or
  neither?
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

## Open Questions — must be resolved before `/plan-feature`

1. **What does "self-improving" mean, mechanically?** Two very
   different systems, very different cost/risk:
   - (a) An AI pipeline periodically GENERATES new lesson content from
     newly-ingested articles (real, ongoing Gemini cost on top of the
     existing daily pipeline's already-strained free-tier budget,
     P-18/PDL-021 — the daily quota is already the active bottleneck,
     see DECISION_LOG.md PDL-027).
   - (b) The curriculum stays hand-authored/curated (by the Director,
     or drafted once by an ACA and refined), and "improves" only in the
     sense that individual lessons LINK OUT to relevant recent articles
     as supplementary reading — no new AI generation cost, much
     smaller build.
2. **Term source for the Dictionary** — AI-extracted from article text
   automatically, or a starting list the Director provides/approves?
3. **Access tier** — University + Dictionary both Premium-only, or does
   Basic get the Dictionary (lighter-weight) while University stays
   Premium-only?
4. **Curriculum authorship** — does the Director want to provide the
   actual syllabus/topic list, or is drafting a first-pass curriculum
   outline (topics, ordering, beginner→expert progression) part of what
   this assistant should propose?
5. **Relationship to gamification** — should XP/levels earned INSIDE
   the University be the SAME coin/level system as the rest of the app
   (Sprint 19), or a separate "course progress" track that's related
   but distinct (e.g. "Level 3 course progress" vs. "Level 3 overall")?
