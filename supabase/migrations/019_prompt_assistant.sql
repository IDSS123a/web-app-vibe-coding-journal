-- Migration: 019_prompt_assistant
-- Date: 2026-09-16
-- Author: ACA (Claude)
-- Description: Vibe-Coding Assistant (specs/prompt-blueprint-builder/,
--   resolves CONSTITUTION.md P-19, DECISION_LOG.md PDL-046). Stores each
--   Premium subscriber's generated initial-project prompt ("Blueprint"),
--   following the Director's book's Appendix B format.
-- Rollback: DROP TABLE prompt_blueprint_generations;

create table prompt_blueprint_generations (
  id uuid primary key default gen_random_uuid(),
  -- Matches reward_events / course_progress's existing FK convention:
  -- references user_profiles, on delete cascade -- this is the user's
  -- own directly-requested content, not an audit trail (A-10).
  user_id uuid not null references user_profiles(id) on delete cascade,
  wizard_answers jsonb not null,
  domain text not null,
  scenario text not null,
  goal text not null,
  explanation text not null,
  prompt_blueprint text not null,
  mermaid_diagram text not null,
  next_steps text not null,
  created_at timestamptz not null default now()
);

-- (user_id, created_at) and (created_at) exist specifically for the
-- per-user and global daily generation-cap COUNT queries
-- (features/prompt-assistant/repository.ts).
create index idx_prompt_blueprint_generations_user_id on prompt_blueprint_generations(user_id);
create index idx_prompt_blueprint_generations_user_created on prompt_blueprint_generations(user_id, created_at);
create index idx_prompt_blueprint_generations_created on prompt_blueprint_generations(created_at);

alter table prompt_blueprint_generations enable row level security;

-- Same RLS pattern as reward_events/course_progress: a user can read
-- their own generations; all writes go through supabaseAdmin
-- (service role, bypasses RLS) from server-side domain logic.
create policy "Users can read their own prompt blueprint generations"
  on prompt_blueprint_generations for select
  using (auth.uid() = user_id);
