-- Hold-Gate Calibration Learning: fixes a real, confirmed unbounded-cost
-- bug found live 2026-09-11 in migration 007's design. Reports containing
-- zero hype words never produce a hold_gate_calibration_findings row, so
-- they were NEVER excluded from future "not yet judged" scans -- that
-- set only grows for the lifetime of the product (every day that
-- doesn't mention a hype word adds one more report re-scanned, forever).
-- Confirmed live: a no-op run (zero new findings) already took 23-28
-- seconds against just 33 accumulated reports, purely from the
-- pagination round-trips re-scanning them every single run.
--
-- This table records that a report was SCANNED, independent of whether
-- scanning it produced any finding -- the actual "not yet judged"
-- exclusion set going forward.
create table hold_gate_calibration_scanned_reports (
  report_id uuid primary key references daily_reports(id) on delete cascade,
  scanned_at timestamp with time zone not null default now()
);

-- Same A-10 reasoning as migration 007: CASCADE is correct here, not the
-- AUDIT-003 trap -- a scan record is regenerable (the report would
-- simply get re-scanned once more) and has no value independent of the
-- report it describes.

alter table hold_gate_calibration_scanned_reports enable row level security;

create policy "Service role only" on hold_gate_calibration_scanned_reports
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
