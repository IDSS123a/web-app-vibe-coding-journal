-- Badges (PDL-075, 2026-09-21): milestones awarded once per user, next to the coins. The catalogue of badges lives in code
-- (features/badges/domain.ts); this table only records who earned which one and when. Like every table since
-- migration 022 it is default deny: row level security on, no policies, read and written only through the service role
-- in API routes that check the caller first.
create table user_badges (
  user_id uuid not null references user_profiles(id) on delete cascade,
  badge_id text not null,
  awarded_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);
create index idx_user_badges_user on user_badges (user_id, awarded_at);

alter table user_badges enable row level security;
