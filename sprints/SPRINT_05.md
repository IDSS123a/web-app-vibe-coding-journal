# SPRINT_05 — Gemini Provider + AI Summary (P-3 editorial voice)
# Vibe-Coding Journal
# Status: COMPLETE 2026-07-18 — all DoD items verified live

---

## Scope — IN

### 1. GeminiProvider (`lib/ai/ai-provider.ts`)
   - Concrete `class GeminiProvider implements AIProvider` replacing the
     current `NoOpProvider` as the active provider (PDL-006: Gemini,
     Commander default, no deviation).
   - Implements the two methods already defined on the interface:
     - `summarize(input: SummarizeInput): Promise<SummarizeOutput>`
     - `classify(input: ClassifyInput): Promise<ClassifyOutput>`
   - No other methods invented; the interface contract from Sprint 01 stays
     as-is unless a concrete implementation need forces a change — if so,
     that change is proposed to the Director before merging, not silently
     added.
   - Provider stays swappable: no pipeline code may import a Gemini SDK
     directly, only `getAIProvider()`.

### 2. Wire `summarize()` into the pipeline
   - New pipeline stage (or extension of the existing Quality Engine phase —
     exact placement decided at implementation time, proposed in the first
     implementation PR, not pre-decided here) that calls
     `getAIProvider().summarize()` per article to populate:
     `summary`, `why_it_matters`, `who_it_affects`, `worth_trying`.
   - Must respect `depth_preference` per P-3 ("Depth adapts to the reader's
     stated preference... Default depth (before personalization ships) is
     'simple with technical detail only when it changes the
     recommendation'").
   - Output passes through the **existing** hype-word filter
     (`evaluateReportHold`, wired in the hype-filter fix prior to this
     sprint) before any publish decision — this sprint does not modify that
     filter, it feeds it real (not synthetic) generated text for the first
     time.

### 3. `classify()` — decide integration approach at kickoff, not now
   - `features/pipeline/quality-engine.ts` already has a rule-based
     `classifyArticle()` (heuristic, Sprint 03). Whether AI `classify()`
     **replaces** it, **supplements** it (e.g. AI only when heuristic
     returns `null`), or is deferred to a later sprint is an open
     implementation-time decision — to be proposed and confirmed with the
     Director at Sprint 05 kickoff, before code is written. Not pre-decided
     in this scope doc per M-4 (don't invent the resolution silently).

### 4. P-3 editorial voice testing — on REAL articles
   - Test using the **GitHub Blog RSS source already configured and proven
     reachable** (Sprint 04 real-data run collected 10 real articles from
     it). `articles` table is currently empty (cleared during Sprint 04
     testing) — collection must be re-run at the start of this sprint's
     testing to have real input again.
   - Must show a **concrete before/after example**: one real article's raw
     content → generated `summary` (pre-filter) → same summary run through
     `evaluateReportHold` → confirm the hype-word filter still fires
     correctly on genuinely-generated text (not a synthetic string typed by
     the ACA). See Definition of Done below — this is a hard requirement,
     not optional.

### 5. API key rotation strategy (RESOLVED — confirmed by Director 2026-07-18)
   - `.env.local` has `GEMINI_API_KEY_1` through `GEMINI_API_KEY_8`.
   - **Strategy: fallback-on-error, not round-robin.** `GeminiProvider` calls
     start with key 1. It only advances to the next key when the current key's
     call fails with a rate-limit/quota error (HTTP 429 or the Gemini SDK's
     equivalent quota-exceeded error code) — a normal successful call does
     **not** rotate. A non-quota error (bad request, network failure, etc.)
     does not trigger key rotation; it surfaces as a normal failure for that
     article.
   - If all 8 keys are exhausted (all return rate-limit/quota errors) for a
     given call: that article/report is held for review with an explicit
     reason (e.g. `"AI summary unavailable — all Gemini API keys rate-limited"`)
     — **never** a silent empty report and **never** an unhandled crash that
     takes down the cron run. P-1.1 (fail loudly) applies directly here.
   - **Logging constraint:** if the rotation logic logs which key failed, it
     logs **only the key's index** (e.g. `"key 3 rate-limited, trying key
     4"`). The key value itself must never appear in any console output, log
     line, or error message forwarded to a client — including inside a raw
     SDK error object that might contain the key in a request URL or header
     dump. Any error caught from the SDK must be sanitized before logging if
     there's a chance it echoes the request.
   - Confirm the exact Gemini model string against Google's current lineup
     at implementation time — per PDL-006, do not hardcode a guessed version
     name.

---

## Scope — OUT (explicitly, do not touch this sprint)

- **RSS parser CDATA/Atom bug** (hnrss feeds intermittently return 0 parsed
  items) — stays an open item, not this sprint's problem to fix.
- **Vercel deploy** to actually activate the cron schedule — stays pending,
  not this sprint.
- **Cookie-based SSR sessions** / migrating the admin guard from UI-level to
  real middleware-level — not needed for this sprint's goal, stays as
  documented upgrade path.
- **Bosnian (or any non-English) hype words / P-3 examples** — PDL-007 fixed
  English as the deliberate output language; do not add other-language
  terms this sprint without a separate Director decision.
- **Bulk approve/reject, article-level admin actions, personalization,
  ML-based classification, admin role management UI** — all previously
  scoped OUT (Sprint 04) and still out.
- **"Test RSS Feed" stale source** — was disabled in Sprint 04 testing, got
  accidentally re-enabled by a broad `PATCH` during hype-filter test
  cleanup. Needs a one-line fix (disable it again) but that is routine
  housekeeping, not in scope for this document to perform — flagged so
  Sprint 05 doesn't get confusing data from it if left enabled.
- **Any git history rewrite** — not relevant to this sprint's code, but
  restated per the new PROCESS_LESSONS entry: not to be done without asking,
  full stop, regardless of what comes up during implementation.

---

## Constitution References

- **PDL-001 / PDL-006** (DECISION_LOG.md): AI provider = Gemini, resolved
- **PDL-007** (DECISION_LOG.md): Daily Report content language = English
- **P-3** (Editorial Voice): the actual target this sprint tests against —
  no hype words, actionable judgment fields, depth adapts to P-2, no
  unexplained jargon, comparative framing when applicable
- **P-6** (Review Queue): AI-generated summaries flow through the existing
  publish gate unchanged; this sprint proves that gate works on real
  generated text, it doesn't change the gate
- **M-4** (Anti-Hallucination): classify() integration approach and any
  interface changes are proposed, not silently decided

---

## Definition of Done

Full Commander DONE_CHECKLIST.md applies, plus Sprint 05 specifics:

- [x] `GeminiProvider implements AIProvider` — `tsc --noEmit` zero errors
- [x] Key rotation implemented exactly per Scope IN §5: fallback-on-error
      (not round-robin), advances only on rate-limit/quota errors, all-8-fail
      → `held_for_review` with a clear reason, never a crash or silent empty
      report. **Proven organically, not staged:** a real cron run exhausted
      all 8 keys mid-execution (free-tier daily quota); the pipeline held the
      report with reason `"AI summary unavailable — all Gemini API keys
      rate-limited (7 article(s))"`, did not crash, did not publish empty.
- [x] **Secret hygiene audit (grep):** `grep -rn "AIzaSy"` across the repo
      (excluding node_modules) returns zero hardcoded key values — the only
      match is the grep command itself documented as an example in this file.
      `grep -rln "GEMINI_API_KEY_[0-9]=AIza"` matches only `.env.local`
      (gitignored, untracked).
- [x] **Log hygiene confirmed:** full session server log grepped for `AIzaSy`
      → 0 matches. Rotation lines are exactly `"key N rate-limited, trying
      key N+1"` / `"key N rate-limited, no more keys configured"` — index
      only, verified character-by-character via grep, not spot-read.
- [x] `summarize()` wired into the pipeline (Phase 3); populates `summary`,
      `why_it_matters`, `who_it_affects`, `worth_trying` on real articles.
- [x] `classify()` integration confirmed with Director at kickoff: heuristic
      `classifyArticle()` runs first; AI `classify()` called only when it
      returns null. Proven live — article "The cost of saying yes has
      changed" got `null` from the heuristic and `"Opinion"` from the AI
      fallback.
- [x] **Housekeeping before the P-3 DoD test:** confirmed via direct Supabase
      query that "Test RSS Feed" had `enabled = false` before running the
      real-article test.
- [x] Articles re-collected from GitHub Blog (real source): 10 real articles,
      0 duplicates.
- [x] **P-3 test shows a concrete, real example:** article "GitHub for
      Beginners: Your roadmap to mastering the GitHub essentials" — real
      Gemini `summarize()` output: *"This content provides a structured
      introduction to GitHub's core functionalities... Understanding GitHub
      is a prerequisite for most modern software development roles..."*
      `worth_trying: "yes"`. Real `evaluateReportHold`, invoked in the real
      Phase 4 over all 10 articles (including this one and two other
      genuinely AI-summarized ones), returned `holdReasons` with **no**
      hype-word entry — confirms the filter examined real generated text and
      found it clean, not a synthetic string.
- [x] Depth-preference spot-checked via a real `GeminiProvider.summarize()`
      call (temporary route, deleted immediately after capturing output —
      never committed) with `tone: "casual"` vs `tone: "technical"` on the
      identical real article text. Simple: 2 plain sentences. Deep: longer,
      denser vocabulary ("isolating work", "atomic changes to the project
      history", "distributed version control"). Visibly different.
- [x] `next build` successful (cache cleared and rebuilt clean after the
      temporary test route was removed, to rule out stale-route artifacts).
- [x] No pipeline or route code imports a Gemini SDK directly — `GeminiProvider`
      talks to the REST API via `fetch`, only `getAIProvider()` is used
      elsewhere.
- [x] corrections/SPRINT_05_LESSONS.md created with learnings.
- [x] HANDOFF_SPRINT_05.md created, scoped to this sprint only.

---

## Approval Record

Scope approved by the Director 2026-07-18, with two additions folded in
before implementation began (per the batch-approval lesson,
SPRINT_04_LESSONS finding #15 — this sprint got its own gate, not bundled
into the prior two fixes):
1. Key rotation strategy = fallback-on-error (Scope IN §5).
2. Two DoD additions: hardcoded-secret grep audit, and key-index-only log
   hygiene (Definition of Done).

---

## Handoff Note Template (fill at sprint end)

```
HANDOFF NOTE — Sprint 05
Completed: [...]
Not completed: [...]
Open risks: [...]
Technical debt: [...]
Next sprint: [recommended: Sprint 06 — RSS parser fix, Vercel deploy, or
              classify() follow-up depending on what Sprint 05 deferred]
```

---

*Vibe-Coding Journal — Sprint 05 — governed by Commander v1.2*
