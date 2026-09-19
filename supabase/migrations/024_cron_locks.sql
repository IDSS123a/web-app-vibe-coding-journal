-- A tiny lease lock so two hourly triggers that fire at almost the same moment (GitHub
-- Actions and cron-job.org both poke the digest endpoint) cannot run the same
-- pipeline twice at once. Before this, two overlapping runs could each spend the
-- free Gemini quota on the same articles. A run takes the lease with one conditional
-- update; if the lease is still valid, the second caller stands down.
create table if not exists cron_locks (
  name text primary key,
  locked_until timestamptz not null default 'epoch'
);
alter table cron_locks enable row level security;
-- No policies on purpose: default deny for every role except the service role.
insert into cron_locks (name) values ('digest') on conflict do nothing;
