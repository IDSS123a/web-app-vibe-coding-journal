-- Gamification layer (Director's 2026-09-14 brief, DECISION_LOG.md
-- PDL-030, CONSTITUTION.md P-20). Phase 1 (Foundation) data model.
--
-- user_profiles gets the per-user reward state (balance, streak,
-- level) -- extends the existing table rather than a new one, same
-- pattern already used for subscription fields (migration 001).
alter table user_profiles
  add column coin_balance integer not null default 0,
  add column current_streak integer not null default 0,
  add column longest_streak integer not null default 0,
  add column level integer not null default 1,
  add column last_active_date date;

-- Append-only audit log of every reward-granting event. Two jobs:
-- (1) history/transparency (a user can eventually see "why did I get
-- this"), (2) idempotency -- the domain layer checks here before
-- awarding the SAME action twice (e.g. a duplicate bookmark toggle
-- request must not double-pay coins).
create table if not exists reward_events (
  id uuid primary key default gen_random_uuid(),
  -- Matches bookmarks' existing FK convention (001_initial_schema.sql):
  -- references user_profiles, not auth.users directly.
  user_id uuid not null references user_profiles(id) on delete cascade,
  event_type text not null,
  coins_awarded integer not null,
  -- Free-form context (e.g. { "article_id": "..." }) -- lets an
  -- idempotency check ask "did THIS user already get THIS exact
  -- event for THIS article", not just "any event of this type ever".
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_reward_events_user_id on reward_events(user_id);
create index if not exists idx_reward_events_user_event on reward_events(user_id, event_type);

alter table reward_events enable row level security;

-- Same RLS pattern as bookmarks (001_initial_schema.sql): a user can
-- read their own reward history; all writes go through supabaseAdmin
-- (service role, bypasses RLS) from server-side domain logic, never
-- directly from the client.
create policy "Users can read their own reward events"
  on reward_events for select
  using (auth.uid() = user_id);
