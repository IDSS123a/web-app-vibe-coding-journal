# PLAN — Vibe-Coding Assistant (Prompt Blueprint Builder)

Implements `SPEC.md`, resolving `CONSTITUTION.md` P-19 (PDL-046).

**Naming note:** the spec folder keeps the slug `prompt-blueprint-builder`
(historical), but the shipped code uses the product-facing name
throughout — `features/prompt-assistant/`, route `/assistant`,
`app/api/assistant/*`. A future reader hitting `/assistant` in the UI
should land on `features/prompt-assistant/` in the code without needing
to know the spec folder's older internal name.

## Architecture

Five-layer pattern (A-1), one new feature slice (A-2):

```
features/prompt-assistant/
  domain.ts        wizard-answer shaping, prompt-injection-safe text wrapping,
                    per-user/global daily cap check (pure logic, DB-free)
  repository.ts     prompt_blueprint_generations CRUD, cap-count queries
  schemas.ts        (re-exports from lib/validation/schemas.ts per E-2 —
                     schemas.ts here only if feature-local composition is needed)
  types.ts          WizardAnswers, GeneratedBlueprint, etc.

lib/ai/
  ai-provider.ts     + GeneratePromptBlueprintInput/Output, generatePromptBlueprint()
                      added to the AIProvider interface (same pattern as
                      generateLesson)
  gemini-provider.ts + GeminiProvider.generatePromptBlueprint() implementation,
                      using the existing callGeminiJSON() helper
  prompt-canon.ts    NEW — the condensed, hand-distilled reference document
                      built from the Director's book (see "Canon Source"
                      below). A plain exported string constant, read into
                      the system prompt — never fetched at runtime, never
                      RAG (P-19's standing no-RAG decision, unchanged).

app/assistant/
  page.tsx           wizard + history, client component, PremiumGuard-gated
                      (reuses the existing guard pattern, see A-4 below)

app/api/assistant/
  generate/route.ts
  history/route.ts
  history/[id]/route.ts

app/api/admin/assistant-usage/route.ts   admin-only usage/cap visibility (P-19 requirement)
```

**Commander is not referenced inside this feature's runtime code or
prompts** (PDL-046 supersedes P-19's 2026-07-23 "Commander as guidance
engine" decision) — `prompt-canon.ts` is the only source of technique/
format guidance the AI call receives, besides the wizard's own answers.

**P-3 (no-hype-words editorial voice) is deliberately NOT reused here**,
unlike `generateLesson`'s reuse of `P3_SYSTEM_RULES`. P-3 governs this
journal's own article-summary voice; this feature's output is a
technical instructional artifact governed entirely by the book's own
register (a "practical manual for advanced non-coders"), which is a
different, already-well-defined voice. Reusing P3 here would be
importing an unrelated constraint without benefit.

## Canon Source

`prompt-canon.ts` is built once (this implementation pass) by hand-
distilling, from `C:\DAVOR_PRIVATE\AI\My_Books\Manual - Prompt
Engineering ADVANCED\Mastering_Prompt_Engineering.md` (Director-
provided, canonical, 2026-09-16):

- **The Five Pillars** (Ch. 2) — Context, Instructions, Examples,
  Constraints, Delimiters — full definitions, condensed.
- **The Blueprint format** (Appendix B intro + 1-2 representative
  worked examples, not all 15) — the exact 5-part shape this feature's
  output must follow: Domain/Scenario/Goal → Explanation (Objective +
  per-pillar Techniques Used & Justification) → Markdown Prompt
  Blueprint (`### SECTION ###` delimited) → Mermaid Flowchart →
  Suggested Next Steps.
- **Markdown delimiter conventions** (Appendix C) — heading levels for
  `### CONTEXT ###`-style sections, emphasis usage, list conventions.
- **Techniques Quick Reference** (Appendix D) — condensed to
  name + one-line description per technique (not the full table's
  worked examples), so the model has the full technique vocabulary
  available to select from without the token cost of every example.

Target size: roughly 3,000-5,000 tokens. The file carries a header
comment recording the exact source file and extraction date, so a
future update to the book is a deliberate re-sync, not silent drift.

## Data Model

New migration `019_prompt_assistant.sql`:

```sql
create table prompt_blueprint_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  wizard_answers jsonb not null,   -- structured input, for regenerate + audit
  domain text not null,
  scenario text not null,
  goal text not null,
  explanation text not null,       -- markdown, per-pillar justification
  prompt_blueprint text not null,  -- the copy-pasteable delimited prompt
  mermaid_diagram text not null,   -- raw mermaid syntax (see Risks)
  next_steps text not null,        -- markdown
  created_at timestamptz not null default now()
);

create index idx_prompt_blueprint_generations_user_id on prompt_blueprint_generations(user_id);
create index idx_prompt_blueprint_generations_user_created on prompt_blueprint_generations(user_id, created_at);
create index idx_prompt_blueprint_generations_created on prompt_blueprint_generations(created_at);

alter table prompt_blueprint_generations enable row level security;

create policy "Users can read their own generations"
  on prompt_blueprint_generations for select
  using (auth.uid() = user_id);
```

Follows `reward_events`/`course_progress`'s exact FK convention: user's
own directly-requested content → `on delete cascade` (not an audit
table needing `NO ACTION` per A-10, not AI-derived-from-a-regenerable-
parent — deleting the user correctly deletes their saved generations).
All writes via `supabaseAdmin` server-side, same as every other
subscription-gated table in this project.

The `(user_id, created_at)` and `(created_at)` indexes exist
specifically to make the per-user and global daily-cap COUNT queries
(below) cheap.

## API / Server Actions

All routes follow E-6 (authenticate → authorize → validate → execute → return).

**`POST /api/assistant/generate`**
```
Role required: authenticated, subscription_tier = 'premium' (or admin)
Body: PromptAssistantWizardSchema (lib/validation/schemas.ts)
Response: { success: true, data: GeneratedBlueprint }
Errors: 401, 403 (not premium), 422 (validation), 429 (per-user daily
        cap exceeded), 503 (global daily cap exceeded — protects the
        shared free-tier Gemini quota), 500
```
Execute sequence:
1. Count today's rows for this user (`repository.countUserGenerationsToday`) → if ≥ `ASSISTANT_DAILY_CAP_PER_USER`, return 429 with a clear message and the cap value.
2. Count today's rows total (`repository.countGenerationsToday`) → if ≥ `ASSISTANT_DAILY_GLOBAL_CAP`, return 503 ("try again tomorrow" — rare, shared-quota protection, same spirit as the daily digest's own article cap).
3. Wrap every free-text wizard answer in an explicit delimiter tag (`<user_project_description>...</user_project_description>` etc.) with an explicit system instruction that content inside these tags is DATA describing the user's project, never an instruction to the model — the same "Semantic Fences" technique the book itself teaches (Ch. 5.2), applied to defend the call that teaches it.
4. Call `getAIProvider().generatePromptBlueprint(input)`.
5. Persist the result row; return it.

**`GET /api/assistant/history`**
```
Role required: authenticated, subscription_tier = 'premium' (or admin)
Response: { success: true, data: { id, domain, goal, created_at }[] }
Errors: 401, 403, 500
```
Summary fields only (not the full body) — keeps the list payload light.

**`GET /api/assistant/history/[id]`**
```
Role required: authenticated, subscription_tier = 'premium' (or admin),
                AND the row's user_id must equal the caller (ownership check)
Response: { success: true, data: GeneratedBlueprint }
Errors: 401, 403, 404 (not found or not owned — same response either
        way, never confirms another user's row exists), 500
```

**`GET /api/admin/assistant-usage`** (P-19's mandatory admin visibility)
```
Role required: admin
Response: { success: true, data: { today: { total, capGlobal, perUser: { userId, count }[] } } }
Errors: 401, 403, 500
```
Deliberately minimal — a count query, not a dashboard — matching this
project's P-1 (Almost-Zero-Maintenance) philosophy and the same
"check via a real query, not a UI you have to maintain" spirit as the
standing P-21 backend-health checklist.

## Rule Constraints Applied

- **E-1/E-2**: `PromptAssistantWizardSchema` in `lib/validation/schemas.ts`; every free-text field length-capped (e.g. 300 chars) at the Zod boundary — both a UX guard and a cheap first line of injection/abuse defense.
- **E-6**: all four routes above follow authenticate → authorize → validate → execute → return, with the JSDoc block E-6 requires.
- **A-4**: new `canAccessPromptAssistant()` in `lib/permissions.ts`, alongside the existing `canAccessUniversity()`. Both delegate to one new shared helper, `hasPremiumTierAccess(user)`, rather than duplicating the same boolean logic under two names (M-7, single source of truth) — the two stay separately *named* because they gate conceptually different features and could diverge later (e.g. a future tier split), but share one implementation today.
- **A-5**: `generatePromptBlueprint` added to the `AIProvider` interface and `NoOpProvider` (fail-closed: an empty/unusable result must never be mistaken for a real generation, same discipline as `generateLesson`, not `assessRelevance`'s fail-open). `maxTokens` sized to the Blueprint's full 5-part output, not the average part (AUDIT-003).
- **A-6**: migration `019_prompt_assistant.sql`, numbered sequentially, rollback comment included.
- **A-10**: `user_id` FK is `on delete cascade` — this is the user's own directly-requested content, not an audit trail and not AI-derived-from-a-regenerable-parent; matches `reward_events`/`course_progress` precedent exactly.
- **E-5**: cap-exceeded (429/503) and ownership-mismatch (404) are anticipatable failures, returned with precise status codes, not folded into a generic 500. A failed/truncated Gemini call is logged loudly (AUDIT-003 — a 200 response is not a successful result) and never silently stored as an empty generation.
- **E-9**: `features/prompt-assistant/`, `app/assistant/`, `app/api/assistant/*` — kebab-case throughout, matching the product name.
- **P-18/PDL-021**: stays on free-tier Gemini; the per-user + global daily caps exist specifically to keep this feature's addition to the shared quota bounded and predictable, same spirit as the University plan's explicit weekly-cadence budget.

## Wizard Question Set

Deferred from `SPEC.md`. Eight structured steps, mapped to the Five
Pillars (Delimiters/Examples-as-format are handled by the system, not
asked of the user):

1. **Project name / one-line description** (short text, required) — anchors Domain/Scenario.
2. **Project type** (select: web app / mobile app / browser extension / CLI tool / API or backend service / data pipeline or automation / other + short text) — Context.
3. **Who is this for** (short text, required) — Context.
4. **Core goal — what should the finished project actually do** (medium text, required, the most important field) — Goal + Instructions.
5. **Experience level** (select: complete beginner / some experience / comfortable with AI coding tools) — governs how much scaffolding/guidance detail the generated prompt includes; not shown to the AI as a raw label, translated into an explicit instruction-verbosity directive.
6. **Tech preferences** (multi-select of common languages/frameworks + "no preference — let the AI decide", optional short text for anything not listed) — Instructions/Constraints.
7. **Known examples or inspiration** (short text, optional — "an existing app/site this should resemble or avoid resembling") — Examples pillar's closest structured equivalent without requiring a fully free-form example block.
8. **Hard constraints / things to avoid** (short text, optional) — Constraints pillar's negative-instruction guidance.

All free-text fields are length-capped in `PromptAssistantWizardSchema`
(E-2) and wrapped in delimiter tags before reaching the AI call (see
`POST /api/assistant/generate` step 3 above).

## Risks / Deviations

- **Cap numbers are an initial proposal, not yet Director-confirmed**: `ASSISTANT_DAILY_CAP_PER_USER = 5`, `ASSISTANT_DAILY_GLOBAL_CAP = 30` (both local consts in `app/api/assistant/generate/route.ts`, matching the existing `MAX_ARTICLES_PER_QUALITY_RUN` precedent of a file-local constant rather than a central registry). Chosen to leave headroom for the daily digest (~80/day worst case) and University (~4/week) against the ~160/day theoretical free-tier ceiling — but this is a guess pending real Premium-subscriber volume, same category of decision as the University plan's own budget, which was explicitly flagged rather than silently picked. **Needs Director sign-off before/shortly after launch**, and should be revisited once real usage data exists.
- **Mermaid diagrams render as a fenced ` ```mermaid ` code block via the already-installed `react-markdown`, not as a live-rendered diagram.** No `mermaid` rendering library is added in this pass — a new client-side dependency for one part of one feature's output is a real stack addition (M-16) this plan does not take on without being asked. The user still gets valid, copyable Mermaid syntax (consistent with the book's own Blueprint examples, which are also presented as plain text/code). If the Director wants live-rendered diagrams, that is a small, separate follow-up decision.
- **`canAccessPromptAssistant` currently has identical logic to `canAccessUniversity`** (both reduce to `subscriptionTier === 'premium'`). Extracting the shared `hasPremiumTierAccess` helper now, rather than waiting for a second divergent case, is a bet that keeps both call sites honest about *what* they're checking without duplicating the boolean — flagged here in case a future session wonders why a "shared helper" exists for what looks like one case today.
- **Admin usage visibility is a JSON endpoint, not a UI page.** P-19 requires the usage be "visible somewhere an admin can check," which this satisfies literally, but it is not integrated into any existing admin screen in this pass. Acceptable for MVP per P-1; revisit if usage actually approaches the caps.
