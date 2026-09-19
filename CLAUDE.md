# CLAUDE.md — Vibe-Coding Journal
# Commander-Governed Project

---

## GOVERNANCE — TIERED LOADING (M-21)

This project is governed by **Commander v1.4**
(github.com/IDSS123a/commander). The 🔴 CRITICAL rules are inlined
below and always apply — do NOT bulk-load full Commander documents at
session start. Read a full document only when the task enters its
domain:

| Read on demand | When |
|---|---|
| ENGINEERING_RULES.md | before implementation work (Tier 2) |
| ARCHITECTURE_PATTERNS.md | before structural/schema decisions (Tier 2) |
| ACA_COMMUNICATION_PROTOCOL.md (C-1–C-5) | output/format questions (Tier 2) |
| FEATURE_LIFECYCLE.md + DONE_CHECKLIST.md | at sprint close |
| PROMPT_LIBRARY/* | when the Director invokes that ritual |

Base URL: `https://raw.githubusercontent.com/IDSS123a/commander/main/`

**Always read (small, project-specific):**
- Project Constitution: `web-app-vibe-coding-journal/CONSTITUTION.md` — wins over Commander for this project
- Current sprint: `web-app-vibe-coding-journal/sprints/SPRINT_XX.md`

---

## 🔴 READ FIRST — open stress-test plan (2026-09-18)

`sprints/STRESS_TEST_2026-09-18_AND_PLAN.md` holds the full stress-test
findings and the agreed order of work (two critical security holes were
fixed that night; further HIGH items — content readable by any registered
user, no database backups, Gemini key rotation — are still open). Read it
before starting; update or remove items as they are closed.

## 🔴 SESSION START — BACKEND HEALTH FIRST (P-21, Director directive 2026-09-16)

Backend is priority zero. Before starting any feature/content work
this session, run a real backend-health check — evidence, not memory
of a prior session's summary (that's exactly the gap P-21/PDL-043
exist to close):

1. `gh run list --workflow=hourly-digest-trigger.yml --limit 10` — any
   `FUNCTION_INVOCATION_TIMEOUT` or repeated failures?
2. Direct SQL: does `daily_reports` have a row for every recent
   calendar day? Any `article_count=0` anomalies?
3. `git status` — anything deployed via `vercel --prod` but never
   committed?
4. `gh run list` on the other workflows (`ci.yml`, `project-guard.yml`,
   `university-generate-trigger.yml`, `monthly-hold-gate-
   calibration.yml`) — all green, none silently stale?
5. Anything flagged "not yet confirmed" in `DECISION_LOG.md`'s most
   recent PDL entries — check whether it's since resolved.

Found a real issue → fix it with the same real-evidence discipline as
everything else in `DECISION_LOG.md` (root-cause, fix, verify live,
log as a new PDL entry) before moving to whatever else the session was
for. Nothing found → say so briefly and proceed; this is a check, not
a ritual that has to produce a finding every time.

---

## 🔴 CRITICAL RULES — ALWAYS IN FORCE

Compressed here for zero-fetch loading; full text in CONSTITUTION.md /
ENGINEERING_RULES.md governs on any doubt.

**Mindset (M):**
- **M-1 CTO Principle** — act as CTO, not task-executor; every decision must survive: "maintainable and understandable by the next ACA with no extra context?"
- **M-2 Thinking Order** — vision → architecture → domain → data → API → feature → component → code. Never UI-first, never skip.
- **M-3 Decision Hierarchy** — institution rules > security > data integrity > architecture consistency > performance > developer convenience > UI > visuals.
- **M-4 Anti-Hallucination** — never invent endpoints, tables, env vars, services, roles, or policies. Not specified → STOP and ask.
- **M-5 Layered Architecture** — exact layer order, never mix, never skip.
- **M-7 Single Source of Truth** — every fact lives in exactly one place.
- **M-10 Context Insufficiency** — missing context is stated, never guessed around.
- **M-15 Confidentiality Propagation** — secrecy/anonymity rules apply to EVERY surface: code, comments, commits, logs, filenames, docs.
- **M-21 Tiered Loading** — this file implements it; reference docs (DECISION_LOG, ACA_MANAGEMENT_GUIDE, CLAUDE_CODE_OPERATIONS) are never session-start reads.
- **M-22 KRAJ Protocol** — on "KRAJ": collect corrections → analyse → propose COMMANDER_UPDATE_PROPOSAL.md → wait for approval → only then touch the commander repo.
- **M-23 Destructive-Action Confirmation** — history rewrites and external-state claims require explicit prior approval and live verification; no low-risk exception.

**Engineering (E) — read the full rules before heavy code work:**
- **E-1 TypeScript** — strict, no `any`, no `@ts-ignore`.
- **E-2 Zod** — validate every boundary; schemas only in `lib/validation/schemas.ts`.
- **E-4 Security** — bcrypt ≥12; HTTP-only SameSite=Strict sessions; RBAC resolved server-side from DB, never from token claims; uploads MIME+magic-byte verified; user text HTML-escaped in emails; secrets only in `.env`.
- **E-5 Error Handling** — every async op in try/catch; no silent failures; standard `{ success, ... }` response shapes; specific status codes before generic 500; a "successful" external/AI call is not proof the payload was usable.
- **E-6 Route Sequence** — authenticate → authorise → validate (Zod) → execute → return.
- **E-13 Mechanically Checkable Rules Ship as Automation** — scriptable rules are hooks, not memory.

---

## LESSON CAPTURE (M-18 — hook-enforced)

The `lessons-guard` hook blocks session end if files changed without
lessons captured. Append to `corrections/SPRINT_XX_LESSONS.md`
**immediately** when: the Director corrects you, an environment gotcha
bites, a rule-violation bug appears, a course correction happens, or a
Commander improvement candidate surfaces. Entry format:
PROMPT_LIBRARY/sprint-lessons.md. Consolidate at sprint close per
DONE_CHECKLIST.md — or run `/sprint-close` directly.

---

## AUTOMATION LAYER (hooks — deterministic, zero-token)

Installed in `.claude/`:
- `version-check.js` (SessionStart) — warns on Commander version drift
- `log-change.js` + `project-guard.js` (PostToolUse) — auto-logs every
  edit; project-guard BLOCKS forbidden patterns per E-13
  (config: `.claude/project-guard.config.json` — add this project's
  own forbidden strings, e.g. the confidentiality/anonymity patterns
  from CONSTITUTION.md, alongside the shipped secret-pattern defaults)
- `lessons-guard.js` + `patterns-detect.js` (Stop) — enforces lesson
  capture; pre-computes rule recurrence for KRAJ

Also installed: `.github/workflows/project-guard.yml` (enforces the
same guard server-side on every push/PR — active once
`.claude/project-guard.config.json` has real rules) and skills
`/kraj`, `/sprint-close`, `/commander-audit`, `/specify`,
`/plan-feature`, `/tasks`.

Treat guards as allies, not obstacles — session memory is unreliable,
the filesystem is not (M-18).

**ACAs without hook support:** run
`node .claude/hooks/project-guard.js --scan` before every commit
(E-13 graceful degradation).

---

## PROJECT-SPECIFIC NOTES

- **Domain:** Automated daily intelligence digest for vibe-coders.
  Not a general AI news aggregator. See project CONSTITUTION.md P-0.
- **Stack:** Commander default (Next.js + Supabase + Vercel). No
  stack deviation (M-16 not invoked) — greenfield project, no
  inherited codebase.
- **AI Provider:** NOT locked to Gemini default (DL-005). Per
  Director's explicit instruction, build `lib/ai/ai-provider.ts` as
  a genuine swappable interface from day one — the choice of
  concrete provider (Gemini, Claude, other) is deferred and recorded
  as PDL-001 in this project's own DECISION_LOG.md, to be resolved
  no later than the sprint that implements the Quality Engine /
  AI Summary pipeline stage.
- **Unattended pipeline architecture:** this project has a
  cron-driven background job layer (Source Collector, Duplicate
  Engine, Quality Engine, Classifier, AI Summary, Daily Report
  generation) that is NOT part of the standard HTTP request/response
  cycle Commander's Five Layers assume. See project CONSTITUTION.md
  P-9 for the documented extension (Pipeline/Jobs layer).
- **Almost-zero-maintenance constraint (P-1):** this is a project-level
  priority that sits between "Data Integrity" and "Architecture
  Consistency" in the M-3 Decision Hierarchy for this project
  specifically. Every pipeline feature must be built to fail loudly
  (held for review) rather than degrade silently. See P-1, P-6, P-7.
- **Upgraded from Commander v1.2 to v1.4 on 2026-07-26.** Prior
  sprints (01–08) were governed under v1.2 and their handoff/lessons
  footers correctly say so — that text is historical record, not
  updated retroactively. Sprint 09 onward is the first real-world use
  of the v1.4 spec layer (`/specify → /plan-feature → /tasks`);
  capture what happens as M-18 lessons regardless of outcome.

---

*Commander v1.4 — IDSS123a Organisation — Davor Mulalić*
