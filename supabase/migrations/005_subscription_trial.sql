-- Sprint 07: subscription/trial fields (P-13, P-4)
-- Matches the CONSTITUTION.md P-4 UserProfile schema block exactly.
alter table user_profiles
add column subscription_status text not null default 'trial'
  check (subscription_status in ('trial', 'active', 'expired')),
add column trial_started_at timestamp with time zone,
add column trial_ends_at timestamp with time zone,
add column subscription_expires_at timestamp with time zone,
add column subscription_tier text not null default 'basic'
  check (subscription_tier in ('basic', 'premium'));

-- Backfill rows that existed before this migration: active, premium, never
-- expires. Director-confirmed (sprints/SPRINT_07.md, Decision 3,
-- 2026-07-23) -- avoids silently hard-blocking pre-existing accounts (e.g.
-- admin@test.local) under a default trial/expired state they never agreed
-- to. Every pre-existing row was just set to 'trial' by the ADD COLUMN
-- DEFAULT above, so this WHERE clause correctly targets exactly those rows
-- and no others.
update user_profiles
set subscription_status = 'active',
    subscription_tier = 'premium',
    subscription_expires_at = null
where subscription_status = 'trial';
