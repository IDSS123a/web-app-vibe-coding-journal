-- 12 chapters (4 per level), specs/vibe-coding-university/CURRICULUM_DRAFT.md v2.

insert into chapters (course_id, slug, title, order_index)
select id, 'foundations', 'Foundations', 1 from courses where slug = 'beginner';
insert into chapters (course_id, slug, title, order_index)
select id, 'choosing-and-setting-up-your-tools', 'Choosing and Setting Up Your Tools', 2 from courses where slug = 'beginner';
insert into chapters (course_id, slug, title, order_index)
select id, 'working-with-prompts', 'Working With Prompts', 3 from courses where slug = 'beginner';
insert into chapters (course_id, slug, title, order_index)
select id, 'reading-testing-and-trusting-output', 'Reading, Testing, and Trusting Output', 4 from courses where slug = 'beginner';

insert into chapters (course_id, slug, title, order_index)
select id, 'agentic-workflows', 'Agentic Workflows', 1 from courses where slug = 'intermediate';
insert into chapters (course_id, slug, title, order_index)
select id, 'context-and-memory', 'Context and Memory', 2 from courses where slug = 'intermediate';
insert into chapters (course_id, slug, title, order_index)
select id, 'quality-and-process', 'Quality and Process', 3 from courses where slug = 'intermediate';
insert into chapters (course_id, slug, title, order_index)
select id, 'tools-and-integration', 'Tools and Integration', 4 from courses where slug = 'intermediate';

insert into chapters (course_id, slug, title, order_index)
select id, 'advanced-agentic-systems', 'Advanced Agentic Systems', 1 from courses where slug = 'expert';
insert into chapters (course_id, slug, title, order_index)
select id, 'architecture-and-decisions', 'Architecture and Decisions', 2 from courses where slug = 'expert';
insert into chapters (course_id, slug, title, order_index)
select id, 'cost-scale-and-operations', 'Cost, Scale, and Operations', 3 from courses where slug = 'expert';
insert into chapters (course_id, slug, title, order_index)
select id, 'evaluation-and-leadership', 'Evaluation and Leadership', 4 from courses where slug = 'expert';

-- Reclassify existing lessons under the new core/chapter model.
-- Lesson 1 ("What Is Vibe-Coding?") becomes core, Chapter 1 lesson 1.
update lessons
set is_core = true,
    chapter_id = (select id from chapters where slug = 'foundations'),
    order_index = 1
where slug = 'what-is-vibe-coding';

-- The AI-generated "Agentic Coding Workflows" lesson (PDL-033) is
-- reclassified as the first real supplementary item, not core -- it
-- stays un-chaptered and does not block or gate anything. Already
-- reviewed and published (by admin@test.local, 2026-09-15 00:01 UTC,
-- independently of this seed) -- this update only changes its
-- core/chapter classification, not its publish status.
update lessons
set is_core = false
where slug = 'agentic-coding-workflows';

-- The remaining 4 original stub slots (choosing-your-ai-coding-tool,
-- writing-effective-prompts, reading-ai-generated-code,
-- basic-debugging-with-ai) map onto CORE lessons 6, 11, 16, 17 in the
-- new structure -- same topics, now properly chaptered instead of
-- flat stubs. Re-slugged to avoid colliding with any future
-- supplementary lesson that might independently cover the same
-- general topic.
update lessons set is_core = true, chapter_id = (select id from chapters where slug = 'choosing-and-setting-up-your-tools'), order_index = 1
  where slug = 'choosing-your-ai-coding-tool';
update lessons set is_core = true, chapter_id = (select id from chapters where slug = 'working-with-prompts'), order_index = 1
  where slug = 'writing-effective-prompts';
update lessons set is_core = true, chapter_id = (select id from chapters where slug = 'reading-testing-and-trusting-output'), order_index = 1
  where slug = 'reading-ai-generated-code';
update lessons set is_core = true, chapter_id = (select id from chapters where slug = 'reading-testing-and-trusting-output'), order_index = 2
  where slug = 'basic-debugging-with-ai';

-- Every other pre-existing stub (the original 15-slot draft's
-- remaining titles not reused above) is retired -- the new 60-lesson
-- structure replaces them outright rather than trying to reconcile
-- every old slug 1:1.
delete from lessons
where status = 'stub'
  and slug not in (
    'choosing-your-ai-coding-tool', 'writing-effective-prompts',
    'reading-ai-generated-code', 'basic-debugging-with-ai'
  );
