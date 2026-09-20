# Vibe-Coding Journal

A daily intelligence digest, a University, a Dictionary, a prompt Assistant and a Prompt School for vibe-coders:
people who build software by directing AI coding tools (Cursor, Claude Code, GitHub Copilot,
Bolt, Lovable, Replit, v0 and similar).

Next.js 15 (App Router) and TypeScript, Supabase (Postgres, Auth, RLS), Vercel, PayPal (sandbox),
Gemini on the free tier, Resend. Governed by [Commander](https://github.com/IDSS123a/commander)
v1.4 (IDSS123a Organisation).

## Before doing anything in this repo

Read, in order:

1. `CLAUDE.md`, the governance entry point, tells you what to read next
2. `CONSTITUTION.md`, project rules (they win over Commander for this project)
3. `sprints/STRESS_TEST_2026-09-18_AND_PLAN.md`, the open plan and its status
4. `specs/knowledge-growth-and-dictionary/LEARNING_LOOPS.md`, how the content system grows

Any AI coding assistant picking up this repo should read these before writing code (Commander M-14,
"GitHub is the Runtime"). Decisions are in `DECISION_LOG.md`, changes in `CHANGELOG.md`.

## Product

| Plan | Price | Includes |
|---|---|---|
| Basic | $10 a year | Daily Report, Archive, Bookmarks |
| Premium | $50 a year (or $40 to upgrade from Basic) | Basic plus University, Dictionary, Assistant, Prompt School |

A 3 day trial gives Basic access. Admins are exempt from billing. Prices live in `lib/pricing.ts`.

## Run it

```bash
npm install
cp .env.example .env.local     # fill in the values, see OPERATIONS_ACCOUNTS.md
npm run dev                    # http://localhost:3000
```

| Command | What it does |
|---|---|
| `npm run typecheck` | TypeScript, strict |
| `npm run lint` | ESLint (Next.js core web vitals and TypeScript rules) |
| `npm run test:run` | Unit tests (Vitest), including the "no em dash in user-facing source" guard |
| `npm run build` | Production build |
| `npm run audit:responsive` | Real Chrome at 11 screen sizes plus OS dark mode against a running app |
| `npm run probe:security` | Attacks a running app: forged tokens, tier matrix, database exposure, cron secrets |
| `npm run smoke:e2e` | Main user and admin journeys in a real Chrome |
| `npm run check:integrity` | Read-only pass over the production database: pipeline, Dictionary, University, Prompt School |
| `npm run book:coverage` | How much of the book "Mastering Prompt Engineering" the Prompt School covers, chapter by chapter |

The last three take a base URL, for example `npm run probe:security -- https://web-app-vibe-coding-journal.vercel.app`,
and need `.env.local` (they use the two test accounts). Do not run `next build` while `next dev` is running.

## How the content system works

Sources (32 feeds) are collected every hour, judged for relevance to vibe-coding, summarised and
published as one Daily Report per day; the Dictionary and the University learn from the same articles.
Everything is sized to the free Gemini quota (about 20 requests per day per key per model). The full
picture, including which feedback loops are closed and which are open, is in
`specs/knowledge-growth-and-dictionary/LEARNING_LOOPS.md`.

## Prompt School

A hands-on course built from the Director's book, covering the WHOLE book (`specs/prompt-school/`). The
authored text lives in `features/prompt-school/content/` and is loaded into the database with
`npx tsx --env-file=.env.local scripts/seed-prompt-school.ts` (idempotent). `content/book-map.ts` lists every
section of the book and each lesson declares the sections it covers; the content test fails when an authored
chapter skips one. Chapters open one after another like the University's. All exercises are graded on the
server without AI.

## Repository map

- `app/` pages and API routes, `components/` UI, `features/` domain logic by feature, `lib/` shared code
- `supabase/migrations/` numbered SQL, applied with `scripts/apply-migration.mjs`
- `scripts/` operational tools (imports, clean-ups, audits); each documents itself in its header
- `specs/`, `sprints/`, `corrections/` the Commander paper trail
- `HANDOFF_*.md` and `SPRINT_04_*` in the root are dated historical records that other documents link to

## Writing rule

No em dash, en dash used as punctuation, or other recognisable AI writing tells may appear anywhere a
reader can see them. Use a comma and a space. It is enforced for AI output, source and stored content
(`lib/text/no-ai-tells.ts`).
