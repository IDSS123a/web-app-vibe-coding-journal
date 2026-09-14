-- Found live 2026-09-14/15, second bug in the same real test session:
-- university_generation_runs.iso_week was UNIQUE (migration 014),
-- which meant even after fixing hasGenerationRunThisWeek() to allow a
-- retry past a FAILED attempt (features/university/repository.ts),
-- the retry's own INSERT then failed with a duplicate-key violation --
-- confirmed live via a real 500 response, "duplicate key value
-- violates unique constraint university_generation_runs_iso_week_key".
--
-- This table is an append-only audit log of every attempt, not a
-- one-row-per-week record -- idempotency is already correctly enforced
-- at the application layer (hasGenerationRunThisWeek only treats a
-- COMPLETED row as "done"), so the DB-level uniqueness was redundant
-- and, worse, actively blocked the exact retry behavior the
-- application-layer fix was meant to allow.
alter table university_generation_runs
  drop constraint university_generation_runs_iso_week_key;
