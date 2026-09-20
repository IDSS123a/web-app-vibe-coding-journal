-- Prompt School level tests (specs/prompt-school/, phase B, 2026-09-20): the counterpart of the University's
-- level tests. One test per level (beginner, intermediate, advanced), made of exercises of the same five kinds
-- as the chapter practice, graded on the server, unlocked when every chapter of the level is complete.
--
-- As in migration 030, `public` (what the learner sees) is kept apart from `answer` (what grades), and both
-- tables are default deny: row level security on, no policies. The app reads them through the service role in
-- API routes that check Premium access and the unlock rule first.
create table ps_level_test_exercises (
  id uuid primary key default gen_random_uuid(),
  level text not null check (level in ('beginner', 'intermediate', 'advanced')),
  slug text not null,
  order_index integer not null,
  -- The chapter this question checks, so a missed question can point back to the right chapter.
  chapter_slug text not null,
  kind text not null check (kind in ('choice', 'fill', 'order', 'spot', 'repair')),
  title text not null,
  prompt_text text not null,
  public jsonb not null,
  answer jsonb not null,
  explanation text not null,
  created_at timestamptz not null default now(),
  unique (level, slug)
);
create index idx_ps_level_test_exercises_level on ps_level_test_exercises (level, order_index);

create table ps_level_test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  level text not null check (level in ('beginner', 'intermediate', 'advanced')),
  score numeric not null check (score >= 0 and score <= 1),
  passed boolean not null,
  -- Per question: { exerciseId, score } as graded, kept for review; the answers themselves are not stored.
  results jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index idx_ps_level_test_attempts_user_level on ps_level_test_attempts (user_id, level, created_at desc);

alter table ps_level_test_exercises enable row level security;
alter table ps_level_test_attempts enable row level security;
