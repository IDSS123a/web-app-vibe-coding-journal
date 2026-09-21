-- Assistant history: a learner may delete one of their own generated prompts (2026-09-21). It is a soft delete on purpose:
-- the daily limits (5 per learner, 30 overall, which protect the shared free AI pool, PDL-021 and PDL-058) are counted
-- from this table, so removing the row would hand the learner a free extra generation. A row with deleted_at set is
-- hidden from the history list and from reading, and still counts toward today's limit.
alter table prompt_blueprint_generations add column deleted_at timestamptz;
