-- Sprint 10 (Bookmarks & Archive) — links a daily_reports row to the
-- specific articles rows that were actually rendered into it.
--
-- Found missing 2026-09-11 while scoping Sprint 10: the pipeline has
-- always generated `daily_reports.markdown` from a time-windowed query
-- over `articles` (features/pipeline/repository.ts
-- getArticlesForDailyReport()) without ever recording WHICH article rows
-- ended up in WHICH report. That made a real "list today's articles
-- individually, with a bookmark button on each" UI impossible to build
-- reliably -- the only available signal (created_at time window) shifts
-- under re-scoring, re-runs, and does not exist at all for the ~50
-- historical reports kept as records (PDL: Director explicitly chose to
-- keep those as-is, not backfilled). Going forward, the digest job
-- writes one row here per (report, article) pair at generation time --
-- see app/api/cron/daily-digest/route.ts generateDailyReport().
create table daily_report_articles (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references daily_reports(id) on delete cascade,
  article_id uuid not null references articles(id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  unique(report_id, article_id)
);

-- FK deletion (A-10): CASCADE both directions is correct here, not the
-- AUDIT-003 trap -- this table is a pure link, not irreplaceable
-- generated content itself. If a report is deleted, its article links
-- are meaningless; if an article is ever deleted (nothing does this
-- today), the link to it is meaningless too.

create index idx_daily_report_articles_report_id on daily_report_articles(report_id);
create index idx_daily_report_articles_article_id on daily_report_articles(article_id);

-- Row-level security: same shape as articles/daily_reports (DONE_CHECKLIST.md)
-- -- authenticated users can read (this table is joined to build the
-- per-article dashboard/archive views), service role is the only writer
-- (populated exclusively by the digest cron job).
alter table daily_report_articles enable row level security;

create policy "Authenticated users can read report articles" on daily_report_articles
  for select using (auth.role() = 'authenticated');

create policy "Service role only for report article writes" on daily_report_articles
  for insert with check (auth.role() = 'service_role');
