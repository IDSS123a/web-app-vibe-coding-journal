-- Vibe-Coding University curriculum seed
-- specs/vibe-coding-university/CURRICULUM_DRAFT.md, confirmed with the
-- Director 2026-09-14. Three courses (one per level), fifteen lesson
-- stubs. Lesson 1 is hand-written and published immediately so the
-- University has real content on day one; the rest are 'stub' status,
-- filled in one at a time by the weekly generation cron (PLAN.md).

insert into courses (slug, title, level, description, order_index) values
  ('beginner', 'Beginner', 'beginner', 'Start here if you are new to building software with AI. Covers the mindset, the tools, and the fundamentals of working with an AI coding assistant.', 1),
  ('intermediate', 'Intermediate', 'intermediate', 'For vibe-coders comfortable with the basics, ready to work with agentic workflows, context management, and real production practices.', 2),
  ('expert', 'Expert', 'expert', 'Advanced topics: multi-agent systems, architecture decisions, cost management, and shaping how AI-assisted development is done.', 3);

-- Beginner
insert into lessons (course_id, slug, title, order_index, status, body)
select id, 'what-is-vibe-coding', 'What Is Vibe-Coding?', 1, 'published', $body$
## What Is Vibe-Coding?

Vibe-coding is building software primarily through natural-language collaboration with an AI coding assistant, rather than writing every line by hand. You describe what you want, review what the assistant produces, and iterate — the AI handles more of the mechanical work of writing code, while you handle judgment: is this correct, is this the right approach, does this actually solve the problem.

It is not "the AI writes the app and you do nothing." The assistant can generate code far faster than a human can type it, but it cannot verify intent, catch a subtly wrong assumption, or decide whether a shortcut is acceptable for this specific project. That judgment stays with you. A vibe-coder who never reads the generated code is trusting a tool that has no way to know if it misunderstood the request.

The shift this represents: less time on syntax and boilerplate, more time on describing the problem clearly and evaluating the result. Prompting well and reviewing critically are the actual skills — not memorizing a framework's API surface.

**Worth trying today**: pick a small, real task you'd normally do by hand, describe it to an AI coding assistant in a few sentences, and read every line it produces before accepting it. Notice where it guessed correctly and where it needed more context from you.
$body$
from courses where slug = 'beginner';

insert into lessons (course_id, slug, title, order_index, status) select id, 'choosing-your-ai-coding-tool', 'Choosing Your AI Coding Tool', 2, 'stub' from courses where slug = 'beginner';
insert into lessons (course_id, slug, title, order_index, status) select id, 'writing-effective-prompts', 'Writing Effective Prompts for Code Generation', 3, 'stub' from courses where slug = 'beginner';
insert into lessons (course_id, slug, title, order_index, status) select id, 'reading-ai-generated-code', 'Reading AI-Generated Code', 4, 'stub' from courses where slug = 'beginner';
insert into lessons (course_id, slug, title, order_index, status) select id, 'basic-debugging-with-ai', 'Basic Debugging with AI Assistance', 5, 'stub' from courses where slug = 'beginner';

-- Intermediate
insert into lessons (course_id, slug, title, order_index, status) select id, 'agentic-coding-workflows', 'Agentic Coding Workflows', 1, 'stub' from courses where slug = 'intermediate';
insert into lessons (course_id, slug, title, order_index, status) select id, 'context-management', 'Context Management', 2, 'stub' from courses where slug = 'intermediate';
insert into lessons (course_id, slug, title, order_index, status) select id, 'code-review-ai-workflow', 'Code Review in an AI-Assisted Workflow', 3, 'stub' from courses where slug = 'intermediate';
insert into lessons (course_id, slug, title, order_index, status) select id, 'testing-ai-generated-code', 'Testing Strategies for AI-Generated Code', 4, 'stub' from courses where slug = 'intermediate';
insert into lessons (course_id, slug, title, order_index, status) select id, 'mcp-and-tool-integrations', 'Working with MCP and Tool Integrations', 5, 'stub' from courses where slug = 'intermediate';

-- Expert
insert into lessons (course_id, slug, title, order_index, status) select id, 'multi-agent-systems', 'Building Multi-Agent Systems', 1, 'stub' from courses where slug = 'expert';
insert into lessons (course_id, slug, title, order_index, status) select id, 'ai-assisted-architecture', 'AI-Assisted Architecture Decisions', 2, 'stub' from courses where slug = 'expert';
insert into lessons (course_id, slug, title, order_index, status) select id, 'cost-and-quota-management', 'Cost and Quota Management for AI-Powered Products', 3, 'stub' from courses where slug = 'expert';
insert into lessons (course_id, slug, title, order_index, status) select id, 'evaluating-ai-coding-tools', 'Evaluating and Comparing AI Coding Tools', 4, 'stub' from courses where slug = 'expert';
insert into lessons (course_id, slug, title, order_index, status) select id, 'shaping-ai-dev-practices', 'Shaping AI-Assisted Development Practices', 5, 'stub' from courses where slug = 'expert';

-- Seed dictionary with a few starter terms (the AI generation pipeline
-- adds more as it publishes lessons, per PLAN.md).
insert into dictionary_terms (term, definition) values
  ('Vibe-coding', 'Building software primarily through natural-language collaboration with an AI coding assistant, with the developer reviewing and directing rather than typing every line by hand.'),
  ('Agentic coding', 'An AI-assisted workflow where the assistant can autonomously plan and execute multi-step tasks (reading files, running commands, writing code) rather than only responding to single prompts.'),
  ('Context window', 'The amount of text (measured in tokens) an AI model can process at once, including the conversation history, code, and instructions given to it.'),
  ('MCP (Model Context Protocol)', 'An open standard that lets an AI assistant connect to external tools and data sources in a consistent way, rather than each integration being custom-built.'),
  ('Prompt', 'The natural-language instruction given to an AI model to produce a specific output — in vibe-coding, typically a description of what code to write or what problem to solve.');
