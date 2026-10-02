-- Top Profitable Ideas for Vibe-Coders (Director-approved six-step feasibility study,
-- step 5, 2026-10-02): "ista arhitektura -- zaseban cron, generise npr. 1 ideju sedmicno
-- iz trendova u clancima zadnjih dana, ide u red za tvoje odobrenje prije objave" -- its
-- own cron (app/api/cron/ideas-generate), own weekly idempotency key, same
-- pending_review -> admin-approve gate University already uses (migration 014), just
-- generative instead of extractive: there is no pre-seeded "stub" to fill in, every run
-- proposes a brand-new idea from recent article trends.
--
-- Premium-only ($50/year), same gate as University/Dictionary/Assistant/Prompt School
-- (lib/permissions.ts canAccessIdeas). No RLS select policy, by design: the app reads
-- this table only from server code with the service role (M-7, same discipline
-- migration 022 established for dictionary_terms and migration 038 for tools).
create table if not exists ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  pitch text not null, -- one-sentence hook, shown before the full write-up
  body text not null, -- the full markdown write-up: opportunity, who it's for, how to start, monetization angle
  status text not null default 'pending_review' check (status in ('pending_review', 'published', 'rejected')),
  source_article_ids uuid[] not null default '{}',
  reviewed_by uuid references user_profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ideas_status on ideas (status);
create index if not exists idx_ideas_published on ideas (created_at desc) where status = 'published';

alter table ideas enable row level security;
-- No policies: service role only (see header comment).

-- Append-only audit/idempotency log for the weekly generation cron, same lesson already
-- learned from university_generation_runs (migration 016: no unique constraint on the
-- period key, since a FAILED attempt must still allow a same-week retry; migration 018:
-- RLS enabled with zero policies from the start here, rather than added as a follow-up).
create table if not exists idea_generation_runs (
  id uuid primary key default gen_random_uuid(),
  iso_week text not null, -- e.g. "2026-W40"
  status text not null check (status in ('completed', 'failed', 'no_articles_available')),
  idea_id uuid references ideas(id),
  detail text,
  created_at timestamptz not null default now()
);
alter table idea_generation_runs enable row level security;
-- No policies: service role only.
