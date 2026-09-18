-- Migration: 020_admin_users_and_lifecycle
-- Date: 2026-09-16
-- Author: ACA (Claude)
-- Description: Admin Console & Subscription Lifecycle
--   (specs/admin-console-and-subscription-lifecycle/). Adds account
--   blocking, an audit trail for admin-created accounts, and idempotency
--   tracking for the 7-day/2-day expiry-warning emails.
-- Rollback:
--   alter table user_profiles drop column is_blocked, drop column created_by_admin_id;
--   drop table subscription_expiry_notifications;

alter table user_profiles
  -- Separate boolean, not a new subscription_status value -- blocking is
  -- orthogonal to trial/active/expired (a blocked Premium subscriber is
  -- still "active" tier-wise but blocked; folding it into the enum would
  -- make that combination unrepresentable). Checked in
  -- features/onboarding/domain.ts evaluateSubscriptionAccess() -- the
  -- single source of truth every existing guard already flows through.
  add column is_blocked boolean not null default false,
  -- Audit trail: who created this account, when it was an admin (not
  -- self-registration). Deliberately no explicit `on delete` -- a
  -- permanent audit fact that must not silently vanish or cascade if the
  -- creating admin's account is ever removed (A-10).
  add column created_by_admin_id uuid references user_profiles(id);

-- Idempotency for the daily expiry-check cron (app/api/cron/
-- subscription-expiry-check). Keyed to the SPECIFIC expiry timestamp
-- being warned about, not just (user_id, notification_type) -- a
-- renewal produces a NEW subscription_expires_at and must be able to
-- trigger the same two notifications again, not be permanently
-- "already sent" from a previous year.
create table subscription_expiry_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  notification_type text not null check (notification_type in ('7day', '2day')),
  subscription_expires_at timestamptz not null,
  sent_at timestamptz not null default now(),
  unique(user_id, notification_type, subscription_expires_at)
);

create index idx_expiry_notifications_user on subscription_expiry_notifications(user_id);

alter table subscription_expiry_notifications enable row level security;

-- Same RLS pattern as reward_events/prompt_blueprint_generations: a user
-- can read their own notification history; all writes go through
-- supabaseAdmin (service role) from the cron route.
create policy "Users can read their own expiry notifications"
  on subscription_expiry_notifications for select
  using (auth.uid() = user_id);
