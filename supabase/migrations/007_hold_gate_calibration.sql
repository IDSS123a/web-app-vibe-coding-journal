-- Hold-Gate Calibration Learning (specs/hold-gate-calibration-learning/)
-- Phase 1 of the Director's continuous-learning idea, scoped to the P-3/P-6
-- hold gate specifically -- see SPEC.md/PLAN.md for full reasoning.

-- One row per analysis run (on-demand or the monthly scheduled trigger).
create table hold_gate_calibration_runs (
  id uuid primary key default gen_random_uuid(),
  triggered_by text not null check (triggered_by in ('manual', 'scheduled')),
  status text not null check (status in ('running', 'completed', 'failed')),
  reports_analyzed_count integer,
  summary_markdown text,
  error_message text, -- set only when status = 'failed', so a stuck/dead
                       -- run is never silently invisible on the admin page
  created_at timestamp with time zone not null default now(),
  completed_at timestamp with time zone
);

-- One row per hype-word/hold-reason occurrence actually judged by the AI
-- provider against a specific report. A report_id already covered here is
-- never re-judged by a later run (the Director's explicit free-only
-- constraint) -- this table IS the "have we already judged this" record.
--
-- FK deletion (A-10): CASCADE on both FKs is the *correct* direction here,
-- not the AUDIT-003 trap. Findings are regenerable by re-running the
-- analysis against remaining history; they are not themselves irreplaceable
-- generated content the way e.g. quiz_questions were in that example. If a
-- run or its source report is ever deleted, the findings about it are
-- meaningless on their own and should go too. report_date is denormalized
-- specifically so a finding still displays meaningfully even if report_id
-- ever cascades away.
create table hold_gate_calibration_findings (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references hold_gate_calibration_runs(id) on delete cascade,
  report_id uuid references daily_reports(id) on delete cascade,
  report_date date not null,
  hold_reason text not null,
  verdict text not null check (verdict in ('genuine_hype', 'false_positive', 'uncertain')),
  ai_reasoning text not null,
  created_at timestamp with time zone not null default now()
);

-- Candidate changes derived from findings, with explicit Director
-- apply-tracking -- the system never modifies the hype-word list or hold
-- thresholds itself; a suggestion only ever changes status when the
-- Director explicitly applies or dismisses it.
create table hold_gate_calibration_suggestions (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references hold_gate_calibration_runs(id) on delete cascade,
  suggestion_text text not null,
  rationale text not null,
  status text not null default 'pending' check (status in ('pending', 'applied', 'dismissed')),
  applied_by uuid references user_profiles(id),
  applied_at timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

create index idx_hold_gate_findings_run_id on hold_gate_calibration_findings(run_id);
create index idx_hold_gate_findings_report_id on hold_gate_calibration_findings(report_id);
create index idx_hold_gate_suggestions_run_id on hold_gate_calibration_suggestions(run_id);
create index idx_hold_gate_suggestions_status on hold_gate_calibration_suggestions(status);

-- Row-level security: deny-by-default on every table (DONE_CHECKLIST.md).
-- Unlike sources/articles/daily_reports, nothing here is ever read
-- client-side by an authenticated user -- the admin page reads these
-- exclusively through server-side repository functions using the
-- service-role client (same access pattern as payment_events). So,
-- unlike the "authenticated users can read" policies on those tables,
-- these three are service_role-only for every operation, no exceptions.
alter table hold_gate_calibration_runs enable row level security;
alter table hold_gate_calibration_findings enable row level security;
alter table hold_gate_calibration_suggestions enable row level security;

create policy "Service role only" on hold_gate_calibration_runs
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "Service role only" on hold_gate_calibration_findings
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "Service role only" on hold_gate_calibration_suggestions
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
