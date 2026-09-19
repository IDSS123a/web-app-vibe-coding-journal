# PLAN: Prompt School

Follows ARCHITECTURE_PATTERNS A-1 to A-10 and ENGINEERING_RULES E-1 to E-13. No em dashes.

## Architecture (layers, A-1)

**Domain** `features/prompt-school/domain.ts`: exercise types, pure grading per kind, answer stripping,
pass rule. No I/O, fully unit tested. **Content** `features/prompt-school/content/`: the outline of the whole
course and the authored lessons and exercises as typed data (version controlled, reviewed like code).
**Infrastructure** `features/prompt-school/repository.ts` and `scripts/seed-prompt-school.ts` (idempotent
upsert by slug). **Application** API routes. **Presentation** pages and `components/prompt-school/`.

## Data model (migration 030, all default deny, service role only, like migration 022)

- `ps_chapters(id, level, slug, title, summary, order_index, published, book_ref)`
- `ps_lessons(id, chapter_id, slug, title, order_index, minutes, body, published)`
- `ps_exercises(id, chapter_id, order_index, kind, title, prompt_text, public jsonb, answer jsonb, explanation)`:
  `public` is what the learner sees, `answer` (correct values and rubrics) never leaves the server.
- `ps_lesson_progress(user_id, lesson_id, completed_at)`, primary key both
- `ps_exercise_results(user_id, exercise_id, best_score, attempts, last_answer jsonb, updated_at)`, primary key both

Deletion: exercises and lessons cascade from their chapter; progress cascades from user and content.
Level is text with a check (beginner, intermediate, advanced) matching the Dictionary level vocabulary.

## API (E-6 five steps on every route; access via one helper, M-7)

- `GET /api/prompt-school` overview with progress
- `GET /api/prompt-school/chapters/[slug]` lessons and exercise list (public part only)
- `GET /api/prompt-school/lessons/[chapterSlug]/[lessonSlug]` body, neighbours, done flag
- `POST /api/prompt-school/lessons/[chapterSlug]/[lessonSlug]/complete`
- `POST /api/prompt-school/exercises/[id]/check` body `{ answer }`, zod validated per kind; returns the graded
  result, feedback and, only now, the explanation and the correct answer; stores best score

Access: `canAccessPromptSchool` in `lib/permissions.ts` (same rule as the University), `hasPromptSchoolAccess`
in `/api/me`, `PremiumGuard` and `PremiumPitch` get the new feature.

## Grading rules (deterministic, no AI)

- choice: chosen index equals the correct one.
- fill: every blank has a list of choices; score is the fraction of blanks correct.
- order: the submitted order of block ids; score is the fraction of blocks in the right position.
- spot: the set of segments picked; score is 1 for an exact match, partial credit is not given.
- repair (rubric): each criterion is a list of alternative patterns (any one may match); score is the weighted
  fraction of criteria met; feedback names the missed criteria with a hint. An exercise passes at 0.75.
- A chapter is passed when the average of the best scores over its exercises is at least 0.75.

## Rule constraints applied

E-2 zod at every boundary; E-4 answers never sent early; M-7 one access function, one exercise vocabulary;
P-19 the book is the only canon; P-20 Swiss style; no AI cost (PDL-021, PDL-058 budget untouched).

## Risks

- A rubric of patterns can accept a bad answer or reject a good one; each rubric is tested with good and bad
  samples, and feedback tells the learner which criterion was missed so a wrong verdict is visible.
- Typed content is a lot of text; it is authored in batches and validated by a content test (every exercise
  well formed, every blank answerable, no dashes).
