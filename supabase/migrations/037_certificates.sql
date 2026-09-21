-- Certificates of completion (PDL-080, 2026-09-21). One per person per programme, issued the first time the person's badges show
-- the programme is finished (Prompt School: every chapter and the three level tests; University: the three level tests). The
-- code is what a third party types into /verify/<code> to see that the certificate is real; it reveals the programme and the date
-- only, never the person. Default deny like every table since migration 022.
create table certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  kind text not null check (kind in ('prompt-school', 'university')),
  code text not null unique,
  issued_at timestamptz not null default now(),
  unique (user_id, kind)
);
create index idx_certificates_user on certificates (user_id);

alter table certificates enable row level security;
