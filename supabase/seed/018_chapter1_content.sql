-- Chapter 1 (Foundations, Beginner) — remaining lessons 2-5 + 5 quiz questions.
-- specs/vibe-coding-university/CURRICULUM_DRAFT.md, hand-authored, P-3 editorial voice.

insert into lessons (course_id, chapter_id, slug, title, order_index, status, is_core, body)
select c.id, ch.id, 'vibe-coding-mindset', 'The Vibe-Coding Mindset: Judgment Over Typing', 2, 'published', true, $body$
## The Vibe-Coding Mindset: Judgment Over Typing

The biggest adjustment moving into vibe-coding isn't learning a new tool — it's learning where your attention should go. When you wrote every line yourself, most of your effort went into syntax: getting the language right, remembering an API, not making a typo. An AI assistant removes almost all of that. What's left is the part that actually mattered the whole time: deciding what to build, and judging whether what got built is right.

This is a real shift in skill, not a shortcut around having one. A developer who is good at judgment — spotting when a solution is fragile, when a shortcut will cause problems later, when the AI has quietly misunderstood the request — gets far more value from an AI assistant than one who accepts whatever comes back. The assistant is fast and confident whether it's right or wrong; confidence is not a signal you can trust on its own.

Practically, this means spending more time up front on describing the problem clearly, and more time at the end reviewing the result — not less time overall, just redistributed. The middle step, actually typing the implementation, shrinks. The thinking on either side of it doesn't.

**Worth trying today**: before your next task, write down in one or two sentences what "done" actually looks like — not just what to build, but how you'd know it's correct. Use that as your own checklist when reviewing what the AI produces, instead of judging by whether it runs.
$body$
from courses c join chapters ch on ch.course_id = c.id and ch.slug = 'foundations'
where c.slug = 'beginner';

insert into lessons (course_id, chapter_id, slug, title, order_index, status, is_core, body)
select c.id, ch.id, 'short-history-autocomplete-to-agents', 'A Short History: From Autocomplete to Agents', 3, 'published', true, $body$
## A Short History: From Autocomplete to Agents

AI-assisted coding didn't arrive all at once. Understanding the progression helps explain why today's tools work the way they do, and what "agentic" actually means compared to what came before.

The first widely-used step was autocomplete: a tool suggesting the rest of a line, or a small block, based on patterns in the surrounding code. It was fast and useful, but narrow — it extended what you were already typing, one small piece at a time. You stayed in control of every decision; the tool just saved keystrokes.

Next came chat-based assistance: describing a problem in a conversation and getting a full function, file, or explanation back. This was a bigger shift — you could delegate an entire piece of work, not just finish a line — but it was still fundamentally reactive. The assistant answered what you asked and stopped. Applying the change, checking it worked, and deciding the next step were still entirely on you.

Agentic tools are the current step: an assistant that can plan a sequence of actions, read and write multiple files, run commands, and check its own results — often completing a multi-step task from a single instruction, then reporting back rather than waiting to be walked through each step individually. This is what most of this curriculum focuses on, because it's where the most real capability (and the most real risk of unsupervised mistakes) currently lives.

Each step didn't replace the one before it — plain autocomplete is still useful for small edits, chat is still the right tool for a quick question. Knowing which mode you're actually using, and what it can and can't be trusted to do on its own, matters more than knowing the newest one exists.

**Worth trying today**: notice, over your next few AI-assisted tasks, which of these three modes you're actually using for each one — and whether that's the right fit for the task's size, or whether you reached for a bigger tool than the job needed.
$body$
from courses c join chapters ch on ch.course_id = c.id and ch.slug = 'foundations'
where c.slug = 'beginner';

insert into lessons (course_id, chapter_id, slug, title, order_index, status, is_core, body)
select c.id, ch.id, 'vibe-coding-vs-traditional-programming', 'Vibe-Coding vs. Traditional Programming: What Changes, What Doesn''t', 4, 'published', true, $body$
## Vibe-Coding vs. Traditional Programming: What Changes, What Doesn't

It's tempting to treat vibe-coding as a completely different discipline from traditional programming. It isn't — most of what makes software good or bad is exactly the same. What changes is where the effort goes, not what "good" means.

**What doesn't change:**
- The problem still needs to be understood correctly before it can be solved correctly. An AI assistant can't do this for you — it can only work from what you tell it.
- Correctness, security, and maintainability are still the actual goals. Code that runs is not the same as code that's right.
- Testing still matters. An AI assistant producing code quickly doesn't reduce the need to verify it does what it's supposed to; if anything, it increases it, since you didn't write it yourself and can't assume you already know every edge case it handles.
- Understanding your own system is still your responsibility. If you can't explain what a piece of AI-generated code does, you don't actually understand your own project.

**What changes:**
- Less time is spent on mechanical translation from idea to syntax.
- More of your skill shows up in how you describe problems and review output, rather than in memorized language/API details.
- The pace of iteration can be much faster, which changes how you plan work — smaller, more frequent checkpoints often work better than one long uninterrupted build.
- Reading code (yours and the AI's) becomes a bigger fraction of the job than writing it from scratch.

The engineering discipline doesn't get optional just because generation got faster. It gets more important, because the volume of code you're responsible for reviewing can grow faster than your ability to review it carefully — unless you're deliberate about pacing yourself.

**Worth trying today**: pick one piece of AI-generated code you've accepted recently without fully reading it, and read it properly now. Note anything you wouldn't have written that way yourself, and decide whether that's a real problem or just a different, equally valid choice.
$body$
from courses c join chapters ch on ch.course_id = c.id and ch.slug = 'foundations'
where c.slug = 'beginner';

insert into lessons (course_id, chapter_id, slug, title, order_index, status, is_core, body)
select c.id, ch.id, 'setting-realistic-expectations', 'Setting Realistic Expectations for AI-Assisted Development', 5, 'published', true, $body$
## Setting Realistic Expectations for AI-Assisted Development

Most frustration with AI coding tools comes from a mismatch between what the tool actually does and what the person using it expected it to do. Setting the right expectations early avoids a lot of wasted time and a lot of unfair blame placed on the tool for a task it was never suited for.

AI coding assistants are genuinely strong at: generating boilerplate and repetitive patterns quickly, producing a reasonable first draft of a well-specified task, explaining unfamiliar code, and suggesting approaches you might not have considered. They are genuinely weak at: understanding context you never gave them, catching business-logic mistakes that require knowledge specific to your product, and knowing when a technically-working answer is still the wrong one for your actual situation.

A common early mistake is treating a confident, well-formatted answer as a correct one. AI output can be fluent and wrong at the same time — fluency is not evidence of correctness, and it's easy to mistake one for the other, especially under time pressure.

Another common mistake is the opposite: distrusting AI output so much that it stops being useful, re-deriving everything from scratch anyway. The realistic middle ground is treating the assistant like a fast, knowledgeable collaborator who is sometimes wrong in ways a human collaborator usually wouldn't be — worth listening to, never worth trusting blindly.

Expect real productivity gains on well-defined, well-scoped tasks. Expect much smaller gains — sometimes none — on tasks that are genuinely novel, poorly specified, or require judgment calls specific to your project that no one has told the AI about.

**Worth trying today**: think of one task this week where an AI assistant surprised you (positively or negatively), and write one sentence about why. Over time, this kind of note builds a much more accurate personal sense of what to actually expect than any general rule can give you.
$body$
from courses c join chapters ch on ch.course_id = c.id and ch.slug = 'foundations'
where c.slug = 'beginner';

-- 5 quiz questions for Chapter 1 (Foundations), 4/5 to pass.
insert into quiz_questions (chapter_id, question, options, correct_option_index, order_index)
select id, 'According to this chapter, what is the developer''s core responsibility when using an AI coding assistant?',
  '["Typing code as fast as possible", "Judgment — deciding what to build and verifying the result is correct", "Memorizing the AI model''s training data", "Avoiding AI tools for anything beyond boilerplate"]'::jsonb,
  1, 1
from chapters where slug = 'foundations';

insert into quiz_questions (chapter_id, question, options, correct_option_index, order_index)
select id, 'What is the key difference between chat-based AI assistance and agentic coding tools?',
  '["Chat tools are newer than agentic tools", "Agentic tools can plan and execute multi-step tasks across files and commands, not just answer a single prompt", "There is no real difference, only branding", "Chat tools require a subscription and agentic tools do not"]'::jsonb,
  1, 2
from chapters where slug = 'foundations';

insert into quiz_questions (chapter_id, question, options, correct_option_index, order_index)
select id, 'Which of the following stays exactly the same in vibe-coding as in traditional programming?',
  '["The need to test and verify code actually does what it should", "The amount of syntax you need to memorize", "How much code you write by hand", "The pace at which you iterate"]'::jsonb,
  0, 3
from chapters where slug = 'foundations';

insert into quiz_questions (chapter_id, question, options, correct_option_index, order_index)
select id, 'Why is a confident, fluently-written AI response not necessarily a correct one?',
  '["AI models are incapable of writing fluent text", "Fluency and correctness are unrelated qualities of a response — confidence is not evidence", "Fluent answers are always shorter and therefore less complete", "This is not actually true; fluent answers are always correct"]'::jsonb,
  1, 4
from chapters where slug = 'foundations';

insert into quiz_questions (chapter_id, question, options, correct_option_index, order_index)
select id, 'What is the realistic middle ground the chapter recommends between blind trust and total distrust of an AI assistant?',
  '["Treat it as a fast, knowledgeable collaborator worth listening to but never worth trusting blindly", "Always re-derive every answer from scratch to be safe", "Only use AI tools for tasks you already know how to do yourself", "Trust every output that compiles or runs without errors"]'::jsonb,
  0, 5
from chapters where slug = 'foundations';
