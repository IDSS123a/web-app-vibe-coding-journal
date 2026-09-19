-- Prompt School (specs/prompt-school/, 2026-09-20): a second learning card next to the
-- University, built from the Director's book "Mastering Prompt Engineering".
--
-- ps_exercises keeps what the learner sees (`public`) apart from what grades the attempt
-- (`answer`: correct values and rubrics). Only the server reads `answer`; it is sent back
-- only after an attempt has been graded. All tables are default deny (row level security
-- on, no policies), like every table since migration 022: the app reads them through the
-- service role in API routes that check Premium access first.
create table ps_chapters (
  id uuid primary key default gen_random_uuid(),
  level text not null check (level in ('beginner', 'intermediate', 'advanced')),
  slug text not null unique,
  title text not null,
  summary text not null,
  order_index integer not null,
  published boolean not null default false,
  book_ref text,
  created_at timestamptz not null default now()
);

create table ps_lessons (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references ps_chapters(id) on delete cascade,
  slug text not null,
  title text not null,
  order_index integer not null,
  minutes integer not null default 5,
  body text not null,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  unique (chapter_id, slug)
);
create index idx_ps_lessons_chapter on ps_lessons (chapter_id, order_index);

create table ps_exercises (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references ps_chapters(id) on delete cascade,
  slug text not null,
  order_index integer not null,
  kind text not null check (kind in ('choice', 'fill', 'order', 'spot', 'repair')),
  title text not null,
  prompt_text text not null,
  public jsonb not null,
  answer jsonb not null,
  explanation text not null,
  created_at timestamptz not null default now(),
  unique (chapter_id, slug)
);
create index idx_ps_exercises_chapter on ps_exercises (chapter_id, order_index);

create table ps_lesson_progress (
  user_id uuid not null references user_profiles(id) on delete cascade,
  lesson_id uuid not null references ps_lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table ps_exercise_results (
  user_id uuid not null references user_profiles(id) on delete cascade,
  exercise_id uuid not null references ps_exercises(id) on delete cascade,
  best_score numeric not null check (best_score >= 0 and best_score <= 1),
  attempts integer not null default 1,
  last_answer jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, exercise_id)
);

alter table ps_chapters enable row level security;
alter table ps_lessons enable row level security;
alter table ps_exercises enable row level security;
alter table ps_lesson_progress enable row level security;
alter table ps_exercise_results enable row level security;
