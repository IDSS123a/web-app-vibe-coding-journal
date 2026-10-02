-- Top Tools to Try (Director-approved six-step feasibility study, 2026-10-02): a
-- "Tools" knowledge layer built on the exact same discovery/promotion cycle already
-- proven by the Dictionary (specs/knowledge-growth-and-dictionary/, PDL-exemplified in
-- features/dictionary/discovery.ts and run-learning.ts) -- never published straight
-- from one article, only once established (several mentions, independent sources,
-- inside a window). No RLS select policy, by design: the app reads this table only
-- from server code with the service role (M-7, same discipline migration 022 already
-- established for dictionary_terms -- no browser-side supabase.from() exists for it).
--
-- pricing: free | paid -- the two subscription-tier rubrics this feeds
--          ($10/year: paid tools; $50/year: free tools, alongside Ideas).
-- status:  published | unpublished (an admin can retire a tool without deleting its
--          history, same convention as dictionary_terms.status).
create table if not exists tools (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text not null,
  url text,
  pricing text not null check (pricing in ('free', 'paid')),
  origin text not null default 'discovered' check (origin in ('discovered')),
  status text not null default 'published' check (status in ('published', 'unpublished')),
  mention_count integer not null default 0,
  last_seen_at timestamptz,
  first_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_tools_pricing on tools (pricing) where status = 'published';
create index if not exists idx_tools_last_seen on tools (last_seen_at desc nulls last);

alter table tools enable row level security;
-- No policies: service role only (see header comment).

-- Candidates noticed in daily articles, mirroring term_candidates exactly. A candidate
-- becomes a published tool only once established -- see features/tools/discovery.ts.
create table if not exists tool_candidates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null,
  url text,
  pricing text not null check (pricing in ('free', 'paid')),
  mention_count integer not null default 1,
  source_names text[] not null default '{}',
  article_ids uuid[] not null default '{}',
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  status text not null default 'candidate' check (status in ('candidate', 'promoted', 'rejected')),
  promoted_at timestamptz
);
alter table tool_candidates enable row level security;
-- No policies: service role only.

-- Marks the articles already read by tool discovery, so each article is sent to the AI
-- once -- the exact same reasoning as migration 028's terms_extracted_at, but a
-- separate column: tool discovery and term discovery read the same article pool
-- independently and must not block each other.
alter table articles add column if not exists tools_extracted_at timestamptz;
create index if not exists idx_articles_tools_pending
  on articles (published_at desc)
  where tools_extracted_at is null and relevance_score >= 60 and duplicate_of is null;
