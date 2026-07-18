# HANDOFF — Sprint 05 (Gemini Provider + AI Summary)

**Status:** ✅ COMPLETE — every DoD item verified with live evidence
**Date:** 2026-07-18
**Commits:** `c74dd527` (implementation), `139db279` (DoD closed)

---

## What Was Accomplished

### GeminiProvider (`lib/ai/gemini-provider.ts`)
- Implements `AIProvider` (`summarize`, `classify`) via raw `fetch` to the
  Gemini REST API — no SDK dependency, so key-rotation logic can rely on the
  unambiguous wire-format signal (`HTTP 429` / `status: RESOURCE_EXHAUSTED`)
  instead of trusting an SDK's internal error classification.
- Model: `gemini-2.5-flash`, confirmed live against Google's current model
  list at implementation time (not guessed from training data — see
  [[SPRINT_05_LESSONS]] #3). Overridable via `GEMINI_MODEL` env var.
- **Key rotation: fallback-on-error, confirmed by Director.** Starts at
  `GEMINI_API_KEY_1`; advances only on a rate-limit/quota response; any other
  error fails the call immediately without rotating. All 8 exhausted →
  `GeminiKeysExhaustedError`, caught upstream and turned into an explicit
  `held_for_review` reason (never a crash, never a silent empty report).
- **Logging:** only the key's numeric index ever appears in logs
  (`"key 3 rate-limited, trying key 4"`) — verified by grepping the entire
  session's server log for the key prefix (`AIzaSy`): 0 matches.

### Interface change (proposed and confirmed before merging)
`SummarizeOutput` (`lib/ai/ai-provider.ts`) extended with `why_it_matters`,
`who_it_affects`, `worth_trying` — the P-3 required judgment fields the
original `{summary, confidence}` shape couldn't carry. Matches exactly the
three corresponding `articles` table columns; no new DB column was added.

### Pipeline wiring (`app/api/cron/daily-digest/route.ts`, Phase 3)
- `summarize()` called per article, persists to the DB via the new
  `updateArticleSummary()` (`features/pipeline/repository.ts`).
- `classify()` called **only** as a fallback when the existing heuristic
  `classifyArticle()` returns `null` — confirmed integration approach,
  verified live on a real ambiguous article.
- `aiUnavailableCount` (articles that hit full key exhaustion) flows into
  Phase 4's hold decision alongside the existing confidence/hype checks
  (unchanged from the prior fix — `evaluateReportHold` was not modified).

### Provider initialization (`lib/ai/init.ts`)
Selects `GeminiProvider` vs `NoOpProvider` based on whether
`GEMINI_API_KEY_1` is set, kept out of `ai-provider.ts` so that module stays
a pure interface + registry with no concrete-provider imports.

---

## Live Verification Evidence (all real, none staged)

1. **Real GitHub Blog collection:** 10 articles, 0 duplicates.
2. **Organic key exhaustion:** a genuine daily free-tier quota event during
   the actual pipeline run held the report with reason `"AI summary
   unavailable — all Gemini API keys rate-limited (7 article(s))"`. Server
   log shows all 8 keys rotating through in order, index-only logging.
3. **3 articles got real Gemini summaries** before exhaustion hit — one
   example: "GitHub for Beginners: Your roadmap to mastering the GitHub
   essentials" → real summary, `why_it_matters`, `who_it_affects`,
   `worth_trying: "yes"`.
4. **Real `evaluateReportHold`**, invoked in the real Phase 4 over all 10
   articles, returned zero hype-word hold reasons — confirms the P-3 filter
   correctly passed genuinely-generated text (not a false positive), on top
   of the existing proof (prior fix) that it correctly holds when a hype word
   *is* present.
5. **`classify()` fallback**, live: heuristic returned `null` for "The cost
   of saying yes has changed"; AI fallback returned `"Opinion"`.
6. **Depth-preference A/B**, live, via a temporary route deleted immediately
   after capturing output (never committed): `tone: "casual"` produced 2
   plain sentences; `tone: "technical"` produced denser, technical-vocabulary
   output on the identical source text.
7. **Secret/log hygiene grep audits**: 0 hardcoded key values anywhere in the
   repo outside `.env.local`; 0 key values anywhere in the server log.

---

## Known Limitations / Follow-ups (not fixed this sprint — logged, not silently ignored)

- **Free-tier quota is a real operational risk for the production 9 AM cron.**
  Development/testing against the same 8 keys can exhaust quota before the
  scheduled run. See [[SPRINT_05_LESSONS]] #7 — separate dev/prod keys or a
  documented testing-window practice is recommended before relying on the
  cron unattended.
- **RSS `raw_summary` content is often thin** (sometimes just the title),
  bounding AI summary richness independent of the provider. A future Source
  Collector improvement (fetch full article bodies) would directly improve
  summary quality.
- **Depth-preference is a proven capability, not a production feature** — per
  P-8 (Personalization Boundary), the Daily Report is the same for all users
  at MVP; the pipeline always uses the default "technical when needed" tone.
  Per-user depth would require the personalization work P-8 explicitly defers.

## Explicitly still OUT (per SPRINT_05.md, unchanged)

- RSS parser CDATA/Atom bug
- Vercel deploy (cron not yet live in production)
- Cookie-based SSR sessions
- Bosnian/non-English hype words (PDL-007)
- Bulk admin actions, personalization, admin role management UI

---

## DONE_CHECKLIST

All items — see `sprints/SPRINT_05.md` Definition of Done for the full list
with inline evidence per item. Summary: **12/12 checked**, `tsc --noEmit`
clean, `next build` clean (cache-cleared rebuild after temp-route removal).

---

## Next Sprint

Sprint 06 candidates (not started, not scoped): RSS parser real-XML-parser
fix, Vercel deploy to activate the cron in production, dev/prod Gemini key
separation, Source Collector full-article-body fetch for richer summaries.

---

*Governed by Commander v1.2. This sprint got its own approval gate, separate
from prior fixes — see [[PROCESS_LESSONS]] and SPRINT_04_LESSONS finding #15.*
