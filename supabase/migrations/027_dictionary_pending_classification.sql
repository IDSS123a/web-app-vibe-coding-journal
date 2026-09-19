-- Terms are imported all at once, but filing them under a topic group, a level and a tier takes
-- AI calls (80 terms per call) and the free tier allows only a limited number per day. Terms
-- that have not been classified yet are stored with classified = false and a section hint, and
-- the hourly backlog cycle classifies them in small steps (features/dictionary/classify-pending.ts).
-- Existing rows and classified imports stay classified = true.
alter table dictionary_terms
  add column if not exists classified boolean not null default true,
  add column if not exists section_hint text;

create index if not exists idx_dictionary_terms_unclassified on dictionary_terms (created_at) where classified = false;
