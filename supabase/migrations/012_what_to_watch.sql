-- Phase 5 of specs/vibe-coding-intelligence-engine/ROADMAP.md
-- (Daily/Weekly Intelligence Format) -- restructures each digest item
-- into the mandate's WHAT HAPPENED / WHY IT MATTERS / EVIDENCE /
-- CONFIDENCE / WHAT TO WATCH shape. Four of those five map onto
-- existing columns (summary, why_it_matters/who_it_affects,
-- source+relevance_score+"also covered by", confidence_score) -- only
-- "what to watch" (a forward-looking note: what to look for next on
-- this story) has no home yet.
--
-- Folded into the EXISTING summarize() AI call (lib/ai/gemini-
-- provider.ts), not a new one -- same no-extra-AI-cost principle
-- already used for Phase 3's Evidence Framing (PDL-024).
--
-- Nullable: an article summarized before this migration shipped has no
-- value yet -- not an error state, same reasoning as relevance_score
-- (migration 011).
alter table articles
  add column what_to_watch text;
