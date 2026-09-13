# SPRINT_15 — Relevance Score Upgrade
# Vibe-Coding Journal
# Status: COMPLETE 2026-09-13 — Phase 2 of specs/vibe-coding-intelligence-engine/ROADMAP.md

---

## Origin

Second implementation phase of the roadmap. Director's own words:
*"Faza 2 iz plana: nadogradnja ocjene relevantnosti sa da/ne na 0-100
skalu."*

## Scope — IN

- **Migration 011**: `articles.relevance_score` (0-100, nullable).
- `assessRelevanceOutputSchema`/`AssessRelevanceOutput`: `isRelevant:
  boolean` → `relevanceScore: number`.
- Gemini prompt rewritten with a calibrated 0-100 scale (81-100 down to
  0-20) and the relevance definition expanded to the Director's
  explicit strict list from the earlier mandate (AI coding agents,
  agentic software engineering, AI-native IDEs, MCP, context
  engineering, etc.) — reinforcing P-0, not replacing it.
- `RELEVANCE_THRESHOLD = 60` (`features/pipeline/quality-engine.ts`,
  P-5 pattern — named, documented, with a tuning note, not a magic
  number). Set at the AI judge's own "tangential" / "clearly relevant"
  boundary, deliberately strict per the Director's repeated framing.
- `updateArticleRelevance()` persists the score for every article, not
  just excluded ones.
- Wiring in `app/api/cron/daily-digest/route.ts` updated; the exclusion
  mechanism itself (confidence_score forced to 0, reusing the existing
  `getArticlesForDailyReport()` filter) is unchanged from the original
  P-0 fix.

## Real bug found and fixed during live verification (not part of the original scope, but blocking it)

Live-testing the new prompt against real Gemini calls hit intermittent
`JSON.parse` failures ("Unterminated string in JSON"). Root cause,
confirmed by a direct API call outside the app: **gemini-2.5-flash is a
"thinking" model whose internal reasoning tokens are deducted from
`maxOutputTokens` before the visible output** — the existing 512-token
budget (set for `judgeHoldReason()` and reused for `assessRelevance()`)
could leave as little as ~20 tokens for the actual JSON once the model
"thought" for 380-490 tokens, truncating the response mid-string. Fixed
by raising both to 2048, and by making `callGeminiJSON()` itself
surface `finishReason: MAX_TOKENS` in the error message when this
happens, so a future recurrence is immediately diagnosable. See the
dedicated commit for full detail — this affected `judgeHoldReason()`
too (same model, same risk), not just the new code.

## Definition of Done

- [x] `tsc --noEmit` / `npx vitest run` (64/64) / `npm run build` all
      clean
- [x] Naming-discipline audit clean on every changed file
- [x] Migration applied directly to production, verified live
- [x] Real-data verification: 6 real Gemini calls against production
      (3 confirmed off-topic, 2 confirmed on-topic, 1 deliberately
      borderline case — general AI research not specific to coding) —
      all 6 scored sensibly and all 6 parsed cleanly after the token-
      budget fix, re-verified via a second live run
- [x] Temp verification route deleted, confirmed removed from the
      build's route table

## Handoff Note

```
HANDOFF NOTE — Sprint 15
Completed: graded 0-100 relevance scoring, persisted per article;
  RELEVANCE_THRESHOLD=60; a real Gemini token-truncation bug found and
  fixed for both AI-judgment calls that set an explicit low token
  budget.
Not completed: n/a for this sprint's own scope.
Open risks: none new -- the token-budget class of bug is now also
  self-diagnosing (finishReason surfaced in the error) if it recurs at
  a higher budget.
Technical debt: none new.
Next: Phase 3 (Evidence Framing -- vendor-claim language) per the
  roadmap.
```

---

*Vibe-Coding Journal — Sprint 15 — governed by Commander v1.4*
