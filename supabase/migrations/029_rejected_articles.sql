-- Tombstones for articles removed because they are off topic (P-0). Without them the
-- collector would simply fetch the same item from the same feed on the next poll, store it
-- again as new, and spend AI budget judging it a second time. Only the hash and a few
-- identifying facts are kept, never the article text.
create table if not exists rejected_articles (
  hash text primary key,
  url text,
  title text,
  source text,
  relevance_score integer,
  reason text not null default 'off_topic',
  rejected_at timestamptz not null default now()
);
alter table rejected_articles enable row level security;
-- No policies: service role only.
