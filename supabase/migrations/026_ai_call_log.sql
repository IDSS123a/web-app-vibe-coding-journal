-- Running count of AI requests by purpose, so background work can be held to a daily budget.
-- The free Gemini tier allows about 20 requests per day per key per model, and the daily
-- report, the University weekly job and the Assistant all draw on the same pool. Backlog
-- enrichment records its calls here and stops when its budget for the trailing 24 hours is
-- spent, so it can never starve the report.
create table if not exists ai_call_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  purpose text not null,
  calls integer not null check (calls >= 0)
);
create index if not exists idx_ai_call_log_purpose_time on ai_call_log (purpose, created_at desc);
alter table ai_call_log enable row level security;
-- No policies: service role only.
