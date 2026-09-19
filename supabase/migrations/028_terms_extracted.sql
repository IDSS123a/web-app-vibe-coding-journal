-- Marks the articles already read by dictionary term discovery, so each article is sent to
-- the AI once (the free tier allows very few requests per day, see PDL-058).
alter table articles add column if not exists terms_extracted_at timestamptz;
create index if not exists idx_articles_terms_pending
  on articles (published_at desc)
  where terms_extracted_at is null and relevance_score >= 60 and duplicate_of is null;
