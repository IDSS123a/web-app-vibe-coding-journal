-- Phase 1 of specs/vibe-coding-intelligence-engine/ROADMAP.md (Source
-- Directory & Trust Score) -- adds the metadata needed to evaluate each
-- source deliberately (per that document's "every source must earn its
-- place") rather than treating every source as equally authoritative.
--
-- source_class mirrors the mandate's six categories, kept as simple
-- single letters rather than a lookup table -- there are only ever six
-- values and they don't need their own metadata (name/description live
-- in the ROADMAP doc, not the DB):
--   A = Primary/official (vendor blogs, official docs)
--   B = Research/academic
--   C = Independent technical analysis (curated community: HN, Lobsters)
--   D = Security/quality/reliability
--   E = Developer reality/empirical evidence (Reddit, surveys, telemetry)
--   F = Serious industry/business press
--
-- trust_score is a deliberate judgment call per source (0-100, not a
-- computed metric) -- see ROADMAP.md for the scoring rationale and the
-- backfilled values applied immediately after this migration.
--
-- topics is a free-form tag array (not a foreign-keyed taxonomy table
-- yet -- P-1 Almost-Zero-Maintenance: a fixed lookup table is more
-- machinery than 14 sources currently justify; revisit if/when the
-- topic list itself needs its own lifecycle).
alter table sources
  add column source_class text check (source_class in ('A', 'B', 'C', 'D', 'E', 'F')),
  add column trust_score integer check (trust_score >= 0 and trust_score <= 100),
  add column topics text[] not null default '{}';

create index idx_sources_class on sources(source_class);
