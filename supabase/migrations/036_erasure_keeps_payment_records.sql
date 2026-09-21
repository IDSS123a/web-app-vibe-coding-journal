-- Deleting an account (GDPR erasure, PDL-079). Until now four foreign keys to user_profiles had no delete rule, so deleting a user who
-- had a payment (payment_events) failed outright. The payment record must stay (accounting and tax law), but it must no longer point
-- at the person, so these become "set null": the record is kept, the link to the deleted account is removed. Everything else that a
-- user owns already cascades away (bookmarks, progress, badges, history, rewards and so on).
alter table payment_events drop constraint payment_events_user_id_fkey;
alter table payment_events add constraint payment_events_user_id_fkey foreign key (user_id) references user_profiles(id) on delete set null;

alter table hold_gate_calibration_suggestions drop constraint hold_gate_calibration_suggestions_applied_by_fkey;
alter table hold_gate_calibration_suggestions add constraint hold_gate_calibration_suggestions_applied_by_fkey foreign key (applied_by) references user_profiles(id) on delete set null;

alter table lessons drop constraint lessons_reviewed_by_fkey;
alter table lessons add constraint lessons_reviewed_by_fkey foreign key (reviewed_by) references user_profiles(id) on delete set null;

alter table user_profiles drop constraint user_profiles_created_by_admin_id_fkey;
alter table user_profiles add constraint user_profiles_created_by_admin_id_fkey foreign key (created_by_admin_id) references user_profiles(id) on delete set null;
