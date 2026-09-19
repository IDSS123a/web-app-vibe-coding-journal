-- Dictionary expansion (specs/knowledge-growth-and-dictionary/, 2026-09-19).
-- The Dictionary grows from 13 terms to about 2,600 and starts to learn from the daily
-- articles, so a term now carries the facets a very large glossary needs to stay
-- usable (topic group, level, tier) and the counters that show it living in the
-- market (mentions, last seen).
--
-- category_group: one of about 13 top level topics (features/dictionary/domain.ts is the
--                 only place that lists them, M-7).
-- level:          beginner | intermediate | advanced
-- tier:           core     vibe-coding specific, shown by default
--                 related  everyday software engineering a vibe-coder meets, shown by default
--                 adjacent deep ML, infrastructure, compliance; behind a toggle (P-0)
-- origin:         book_a, book_b (the two supplied documents), lesson, discovered
-- status:         published | candidate (candidates live in term_candidates first; a row
--                 here is always published unless an admin unpublishes it)
alter table dictionary_terms
  add column if not exists slug text,
  add column if not exists category_group text,
  add column if not exists level text check (level in ('beginner', 'intermediate', 'advanced')),
  add column if not exists tier text check (tier in ('core', 'related', 'adjacent')),
  add column if not exists aliases text[] not null default '{}',
  add column if not exists related_terms text[] not null default '{}',
  add column if not exists origin text not null default 'lesson' check (origin in ('book_a', 'book_b', 'lesson', 'discovered')),
  add column if not exists status text not null default 'published' check (status in ('published', 'unpublished')),
  add column if not exists mention_count integer not null default 0,
  add column if not exists last_seen_at timestamptz,
  add column if not exists first_seen_at timestamptz default now();

create unique index if not exists idx_dictionary_terms_slug on dictionary_terms (slug) where slug is not null;
create index if not exists idx_dictionary_terms_group on dictionary_terms (category_group);
create index if not exists idx_dictionary_terms_last_seen on dictionary_terms (last_seen_at desc nulls last);

-- Terms noticed in daily articles that are not in the Dictionary yet. A candidate becomes
-- a published term only once it is established (several mentions from independent
-- sources inside a window), see features/dictionary/discovery.ts. Article ids are kept as
-- a plain array, no foreign key, because articles can be pruned by policy.
create table if not exists term_candidates (
  id uuid primary key default gen_random_uuid(),
  term text not null,
  slug text not null unique,
  definition text not null,
  category_group text,
  level text check (level in ('beginner', 'intermediate', 'advanced')),
  mention_count integer not null default 1,
  source_names text[] not null default '{}',
  article_ids uuid[] not null default '{}',
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  status text not null default 'candidate' check (status in ('candidate', 'promoted', 'rejected')),
  promoted_at timestamptz
);
alter table term_candidates enable row level security;
-- No policies: service role only.
