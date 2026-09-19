-- Migration: 021_drop_self_update_policy_on_user_profiles
-- Date: 2026-09-18
-- Author: ACA (Claude)
-- Description: SECURITY (critical). The policy "Users can update own profile"
--   (USING auth.uid() = id, no column restriction) let ANY signed-in user PATCH
--   their own user_profiles row directly through Supabase's always-on REST API
--   and set ANY column -- role ('admin'), subscription_tier, subscription_status,
--   subscription_expires_at, is_blocked, coin_balance -- bypassing the app and
--   payment entirely. Proven live 2026-09-18 with a real non-admin session
--   (self-promoted to admin; reverted immediately). See DECISION_LOG.md PDL-051.
--
--   No application code needs this policy: every write to user_profiles in the
--   app goes through server routes using the service role, which bypasses RLS.
--   With no UPDATE policy left, a signed-in user cannot modify any user_profiles
--   row via the API (RLS default-deny); reads of the own row are unchanged.
-- Rollback (NOT recommended -- reintroduces the privilege escalation):
--   create policy "Users can update own profile" on user_profiles
--     for update using (auth.uid() = id);

drop policy if exists "Users can update own profile" on user_profiles;
