-- Allow 'rejected' as a review_status value (Sprint 04 reject flow)
alter table daily_reports drop constraint daily_reports_review_status_check;

alter table daily_reports add constraint daily_reports_review_status_check
  check (review_status in ('auto_published', 'held_for_review', 'manually_approved', 'rejected'));
