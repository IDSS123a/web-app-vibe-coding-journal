-- Add admin role to user_profiles
alter table user_profiles
add column role text not null default 'user' check (role in ('user', 'admin'));

-- Create index for admin queries
create index idx_user_profiles_role on user_profiles(role);

-- Update RLS policy: admins can update daily_reports review_status
create policy "admins_can_update_daily_reports" on daily_reports
  for update
  using (
    exists (
      select 1 from user_profiles
      where user_profiles.id = auth.uid()
      and user_profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from user_profiles
      where user_profiles.id = auth.uid()
      and user_profiles.role = 'admin'
    )
  );

-- Add audit columns to daily_reports (optional, but useful for tracking approvals)
alter table daily_reports
add column approved_by text,
add column approved_at timestamp with time zone,
add column rejected_by text,
add column rejected_at timestamp with time zone;
