-- P-21 backend-health audit (PDL-043 follow-up), 2026-09-16: found via
-- a direct query (pg_tables.rowsecurity) that university_generation_runs
-- was the only public table without RLS enabled -- migration 014
-- enabled it on courses/lessons/dictionary_terms/course_progress but
-- this table was simply left out. No policies needed: it's an
-- audit-log table written only by the service-role key
-- (supabaseAdmin, which bypasses RLS entirely), never read or written
-- by any client-facing route -- enabling RLS with zero policies just
-- closes off anon/authenticated access that was never supposed to
-- exist, a pure hardening with no behavior change for the actual
-- (service-role-only) access path.

alter table university_generation_runs enable row level security;
