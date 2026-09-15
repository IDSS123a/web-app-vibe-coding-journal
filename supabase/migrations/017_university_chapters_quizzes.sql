-- Vibe-Coding University structural expansion (Director, 2026-09-15):
-- chapters, chapter quizzes gating progression, a level final test,
-- and a core/supplementary distinction on lessons. Amends migration
-- 014's flat course->lesson model.

create table chapters (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  slug text not null,
  title text not null,
  order_index integer not null,
  created_at timestamptz not null default now(),
  unique(course_id, slug)
);

create index idx_chapters_course_id on chapters(course_id);

-- Lessons gain: which chapter they belong to (nullable -- supplementary
-- lessons, including everything the weekly generation cron produces
-- from now on, are NOT chaptered) and whether they count toward the
-- required 20-per-level core curriculum.
alter table lessons
  add column chapter_id uuid references chapters(id) on delete set null,
  add column is_core boolean not null default false;

create index idx_lessons_chapter_id on lessons(chapter_id);

-- One quiz question per row, 5 per chapter. Hand-authored (Director,
-- 2026-09-15: generated once, reused for every user's attempt -- no
-- AI cost, no per-attempt randomization).
create table quiz_questions (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references chapters(id) on delete cascade,
  question text not null,
  -- Four options, one correct -- simple multiple choice, matches the
  -- "5 questions, 4/5 to pass" spec without needing a more complex
  -- answer-format system for a first version.
  options jsonb not null, -- ["...", "...", "...", "..."]
  correct_option_index integer not null check (correct_option_index >= 0 and correct_option_index <= 3),
  order_index integer not null,
  created_at timestamptz not null default now()
);

create index idx_quiz_questions_chapter_id on quiz_questions(chapter_id);

-- One row per user attempt (not per-question) -- score is out of 5,
-- passed is score >= 4 (the confirmed threshold), computed at
-- submission time and stored rather than only derived, so a later
-- change to the passing threshold doesn't retroactively rewrite past
-- attempts' pass/fail history.
create table chapter_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  chapter_id uuid not null references chapters(id) on delete cascade,
  score integer not null check (score >= 0 and score <= 5),
  passed boolean not null,
  answers jsonb not null, -- [{question_id, selected_option_index}, ...] -- audit trail
  created_at timestamptz not null default now()
);

create index idx_chapter_quiz_attempts_user_chapter on chapter_quiz_attempts(user_id, chapter_id);

-- Cumulative test per level (beginner/intermediate/expert), unlocked
-- only once all 4 chapters + their quizzes in that level are passed.
create table level_test_questions (
  id uuid primary key default gen_random_uuid(),
  level text not null check (level in ('beginner', 'intermediate', 'expert')),
  question text not null,
  options jsonb not null,
  correct_option_index integer not null check (correct_option_index >= 0 and correct_option_index <= 3),
  order_index integer not null,
  created_at timestamptz not null default now()
);

create index idx_level_test_questions_level on level_test_questions(level);

create table level_test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  level text not null check (level in ('beginner', 'intermediate', 'expert')),
  score integer not null,
  total integer not null,
  passed boolean not null,
  answers jsonb not null,
  created_at timestamptz not null default now()
);

create index idx_level_test_attempts_user_level on level_test_attempts(user_id, level);

alter table chapters enable row level security;
alter table quiz_questions enable row level security;
alter table chapter_quiz_attempts enable row level security;
alter table level_test_questions enable row level security;
alter table level_test_attempts enable row level security;

create policy "Authenticated users can read chapters"
  on chapters for select using (auth.role() = 'authenticated');

create policy "Authenticated users can read quiz questions"
  on quiz_questions for select using (auth.role() = 'authenticated');

create policy "Users can read their own quiz attempts"
  on chapter_quiz_attempts for select using (auth.uid() = user_id);

create policy "Authenticated users can read level test questions"
  on level_test_questions for select using (auth.role() = 'authenticated');

create policy "Users can read their own level test attempts"
  on level_test_attempts for select using (auth.uid() = user_id);
