-- Vibe-Coding University + Dictionary
-- specs/vibe-coding-university/SPEC.md + PLAN.md, confirmed with the
-- Director 2026-09-14. Premium-only feature (P-16 tier gate, enforced
-- in application code, not RLS -- same pattern as the rest of the
-- subscription system, see components/SubscriptionGuard.tsx).

create table courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  level text not null check (level in ('beginner', 'intermediate', 'expert')),
  description text not null,
  order_index integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Lessons are seeded as 'stub' (title/order only, no body) and filled
-- in one at a time by the weekly generation cron -- see PLAN.md's AI
-- Cost Budget section for why this is weekly, not daily, and why a
-- lesson lands in 'pending_review' rather than publishing directly.
create table lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  slug text not null,
  title text not null,
  order_index integer not null,
  body text, -- null while status = 'stub'
  status text not null default 'stub' check (status in ('stub', 'pending_review', 'published')),
  -- Which articles this lesson's body was generated from -- audit
  -- trail + prevents the same articles being reused as source
  -- material for a second lesson (same idempotency principle as
  -- reward_events.metadata->>dedupeKey).
  source_article_ids uuid[] not null default '{}',
  reviewed_by uuid references user_profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(course_id, slug)
);

create index idx_lessons_course_id on lessons(course_id);
create index idx_lessons_status on lessons(status);

create table dictionary_terms (
  id uuid primary key default gen_random_uuid(),
  term text not null unique,
  definition text not null,
  source_lesson_id uuid references lessons(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Deliberately separate from Sprint 19's user_profiles coin/level
-- columns -- confirmed with the Director as its own "course progress"
-- track, not folded into the app-wide Vibe Coins balance.
create table course_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  lessons_completed uuid[] not null default '{}',
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  updated_at timestamptz not null default now(),
  unique(user_id, course_id)
);

create index idx_course_progress_user_id on course_progress(user_id);

-- Idempotency/audit for the weekly generation cron -- same pattern as
-- daily_reports' date-uniqueness, keyed to an ISO week instead of a day.
create table university_generation_runs (
  id uuid primary key default gen_random_uuid(),
  iso_week text not null unique, -- e.g. "2026-W38"
  status text not null check (status in ('completed', 'failed', 'no_stub_available')),
  lesson_id uuid references lessons(id),
  detail text,
  created_at timestamptz not null default now()
);

alter table courses enable row level security;
alter table lessons enable row level security;
alter table dictionary_terms enable row level security;
alter table course_progress enable row level security;

-- Courses/published lessons/dictionary are readable by any authenticated
-- user at the RLS layer -- the actual Premium-tier gate is enforced in
-- application code (features/university/repository.ts checking
-- subscription_tier), same pattern as every other subscription-gated
-- page in this project (P-13's known client-side-only enforcement,
-- DECISION_LOG.md PDL-026's paywall-leak correction -- not solved here,
-- not this feature's problem to fix).
create policy "Authenticated users can read courses"
  on courses for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can read published lessons"
  on lessons for select
  using (auth.role() = 'authenticated' and status = 'published');

create policy "Authenticated users can read dictionary terms"
  on dictionary_terms for select
  using (auth.role() = 'authenticated');

create policy "Users can read their own course progress"
  on course_progress for select
  using (auth.uid() = user_id);
