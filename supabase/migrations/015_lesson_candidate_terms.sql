-- Found while implementing the review flow (same day as migration 014):
-- storing a generated lesson's candidate Dictionary terms in
-- university_generation_runs.detail (a JSON blob) meant the admin
-- review UI would need to join back to the run log to show them, and
-- worse, an earlier draft of this cron added terms to the public
-- Dictionary at GENERATION time, before the admin approved the lesson
-- they came from -- a rejected lesson would leave an orphaned term
-- citing content that was never published. Terms now travel WITH the
-- lesson row and are only added to dictionary_terms when the admin
-- approves (features/university/repository.ts reviewLesson).
alter table lessons
  add column candidate_terms jsonb not null default '[]'::jsonb;
