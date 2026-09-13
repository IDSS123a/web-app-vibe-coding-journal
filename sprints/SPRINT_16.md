# SPRINT_16 — Evidence Framing
# Vibe-Coding Journal
# Status: COMPLETE 2026-09-13 — Phase 3 of specs/vibe-coding-intelligence-engine/ROADMAP.md

---

## Origin

Third implementation phase of the roadmap. Director's own words:
*"Faza 3 iz plana: Evidence Framing."*

## Scope — IN

- `lib/ai/gemini-provider.ts`: `P3_SYSTEM_RULES` (shared by every
  `summarize()` call) extended with an evidence-framing rule — a
  vendor's unverified claim about their own product's performance/
  productivity/capability/benchmarks must be attributed ("The company
  reports...", "X claims...") rather than restated as fact. No new AI
  call; folded into the existing `summarize()` prompt per the
  roadmap's explicit design.
- `CONSTITUTION.md` P-3: documented with the mandate's own worked
  example.
- `DECISION_LOG.md` PDL-024: records why this is a distinct rule from
  the existing hype-word ban (P-3 already blocks banned *phrases*, but
  did nothing about an unverified claim stated in plain, non-hype
  language).

## Definition of Done

- [x] `tsc --noEmit` / `npx vitest run` (64/64) / `npm run build` all
      clean
- [x] Naming-discipline audit clean on every changed file
- [x] Real-data verification: two live `summarize()` calls against
      production — one with a genuine vendor productivity claim
      ("makes developers 5x faster," an internal study), one a plain
      factual feature release with nothing to hedge. Result: the claim
      case correctly hedged ("the company claims," "reports a 5x
      improvement") and added a skeptical actionable judgment
      ("investigate whether these claimed productivity gains are
      reproducible"); the factual case stayed stated as fact, no
      unnecessary hedging added where none was warranted.
- [x] Temp verification route deleted, confirmed removed from the
      build's route table

## Handoff Note

```
HANDOFF NOTE — Sprint 16
Completed: evidence-framing rule live in the summarize() prompt,
  documented in CONSTITUTION.md P-3, decision recorded as PDL-024.
Not completed: n/a for this sprint's own scope.
Open risks: none new -- this is a prompt-level instruction, not a
  structured field, so its enforcement quality depends on the model
  following it consistently; the two live test cases both did, but
  this isn't a hard-coded guarantee the way a Zod schema check is.
Technical debt: none new.
Next: Phase 4 (Event Deduplication / Clustering) per the roadmap.
```

---

*Vibe-Coding Journal — Sprint 16 — governed by Commander v1.4*
