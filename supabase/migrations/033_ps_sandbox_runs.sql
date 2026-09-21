-- Prompt School live sandbox (PDL-077, 2026-09-21): one row per run of a learner's own prompt on a real model, so the daily
-- limit (3 per learner, and a global cap that protects the shared free Gemini pool, PDL-021 and PDL-058) can be counted.
-- Only the fact of a run is stored: no prompt text and no model reply, so nothing a learner typed is kept.
-- Like every table since migration 022 it is default deny: row level security on, no policies, read and written only through
-- the service role in API routes that check the caller first.
create table ps_sandbox_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  task_id text not null,
  prompt_chars integer not null,
  created_at timestamptz not null default now()
);
create index idx_ps_sandbox_runs_user_day on ps_sandbox_runs (user_id, created_at);
create index idx_ps_sandbox_runs_day on ps_sandbox_runs (created_at);

alter table ps_sandbox_runs enable row level security;
