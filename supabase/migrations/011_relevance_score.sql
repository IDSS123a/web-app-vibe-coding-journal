-- Phase 2 of specs/vibe-coding-intelligence-engine/ROADMAP.md
-- (Relevance Score Upgrade) -- replaces the P-0 relevance gate's
-- boolean isRelevant with a graded 0-100 score.
--
-- The graded score itself is now persisted (previously only the
-- boolean's downstream effect -- confidence_score forced to 0 -- was
-- ever recorded, the actual AI judgment value was discarded after the
-- request/response). Keeping it supports future calibration work in
-- the same spirit as Hold-Gate Calibration (features/hold-gate-
-- calibration/) -- e.g. eventually reviewing which relevance_scores
-- near the threshold turned out to be judged correctly -- without
-- needing another migration to add it retroactively.
--
-- Nullable: an article scored before this migration shipped, or one
-- whose relevance assessment failed and fell through the fail-open
-- path (see lib/ai/gemini-provider.ts assessRelevance), legitimately
-- has no score yet -- not an error state.
alter table articles
  add column relevance_score integer check (relevance_score >= 0 and relevance_score <= 100);
