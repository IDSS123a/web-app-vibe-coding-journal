-- Knowledge growth work (specs/knowledge-growth-and-dictionary/, 2026-09-19).
--
-- 1. Sources no longer disable forever. A source that fails three times used to be
--    switched off permanently: 9 of 14 sources were dark although every one of them
--    answers HTTP 200 today. retry_after lets the collector try a disabled source
--    again after a growing cool-down; a success re-enables it.
-- 2. articles.relevance_source records HOW an article was judged relevant or not:
--      'ai'        one Gemini call for this article (the original path)
--      'ai_batch'  scored as part of a batch of articles in one call
--      'triage'    dropped by the free keyword triage, no AI spent (score 0)
--    so a later re-score can target exactly the triage skips if the lexicon changes.
alter table sources
  add column if not exists retry_after timestamptz,
  add column if not exists disabled_at timestamptz;

alter table articles
  add column if not exists relevance_source text
    check (relevance_source in ('ai', 'ai_batch', 'triage'));

create index if not exists idx_articles_unscored
  on articles (published_at desc)
  where confidence_score is null and duplicate_of is null;
