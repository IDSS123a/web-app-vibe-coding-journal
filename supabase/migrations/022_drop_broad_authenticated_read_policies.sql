-- Migration: 022_drop_broad_authenticated_read_policies
-- Date: 2026-09-19
-- Author: ACA (Claude)
-- Description: SECURITY (high). Ten policies of the form
--   `auth.role() = 'authenticated'` let ANY registered user -- including a
--   free-trial account -- read these tables directly through Supabase's
--   always-on REST API, bypassing the application's paywall and review gate.
--   Proven 2026-09-18 with an ordinary logged-in session: all 77 University
--   lessons, all 75 chapter-quiz + 36 level-test questions INCLUDING
--   correct_option_index, 55 held-for-review + 5 rejected Daily Reports,
--   1000+ articles. See DECISION_LOG.md PDL-052 and
--   sprints/STRESS_TEST_2026-09-18_AND_PLAN.md (S1).
--
--   The application reads all of these tables only from server code using the
--   service role, which bypasses RLS (verified: no browser-side supabase.from()
--   call exists). With no policy left, RLS default-denies every non-service
--   role. Per-user tables (own bookmarks, progress, rewards, attempts,
--   profile, generations) keep their own-row policies untouched.
-- Rollback (NOT recommended -- reopens the paywall/answer/review-gate bypass):
--   create policy "<name>" on <table> for select using (auth.role() = 'authenticated');
--   (lessons: ... and status = 'published')

drop policy if exists "Authenticated users can read articles" on articles;
drop policy if exists "Authenticated users can read chapters" on chapters;
drop policy if exists "Authenticated users can read courses" on courses;
drop policy if exists "Authenticated users can read report articles" on daily_report_articles;
drop policy if exists "Authenticated users can read daily reports" on daily_reports;
drop policy if exists "Authenticated users can read dictionary terms" on dictionary_terms;
drop policy if exists "Authenticated users can read published lessons" on lessons;
drop policy if exists "Authenticated users can read level test questions" on level_test_questions;
drop policy if exists "Authenticated users can read quiz questions" on quiz_questions;
drop policy if exists "Authenticated users can read sources" on sources;
