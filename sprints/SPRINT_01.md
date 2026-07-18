# SPRINT_01 — Project Skeleton, Core Data Model, Auth
# Vibe-Coding Journal
# Status: NOT STARTED

---

## Scope — IN

1. **Project skeleton** per ARCHITECTURE_PATTERNS.md A-1/A-2:
   Next.js app, feature-based folder structure exactly as listed in
   project CONSTITUTION.md P-10 (`sources/`, `pipeline/`, `daily-report/`,
   `archive/`, `bookmarks/`, `onboarding/`, `admin/`), plus shared
   `lib/`, `constants/`, `types/`, `components/ui/`.
2. **Core data model** — implement exactly the schema in project
   CONSTITUTION.md P-4: `Article`, `DailyReport`, `UserProfile`
   (Supabase tables + migrations). No fields beyond what P-4 lists.
3. **Auth** — email + password (Commander ENGINEERING_RULES.md E-4
   default). Registration flow captures `UserProfile.tools_used` and
   `UserProfile.depth_preference` per CONSTITUTION.md P-2 (onboarding
   feature). `other_tools_freetext` stored per P-2a — logged only,
   never used to drive filtering logic yet.
4. **`lib/ai/ai-provider.ts` interface scaffold** (empty/stubbed
   implementation is fine this sprint) — per DECISION_LOG.md PDL-001,
   built as swappable from day one even though no pipeline stage
   calls it yet.
5. **Empty-state Daily Report page** — the single homepage described
   in the project brief (date, reading time, section headers) with
   placeholder/seed content. No pipeline exists yet; this sprint
   proves the Presentation layer renders the DailyReport schema
   correctly, nothing more.

## Scope — OUT (explicitly, do not build this sprint)

- Source Collector, Duplicate Engine, Quality Engine, Classifier, AI
  Summary generation, cron/scheduling — all of Pipeline/Jobs (P-9).
  These are Sprint 2+.
- Bookmarks functionality (save/unsave) — data model exists (P-4),
  UI does not yet. Sprint 3+.
- Admin panel (P-10 `admin/`) — folder exists, empty. Sprint 4+.
- Any personalization of Daily Report content (P-8 explicitly defers
  this).
- Monthly self-audit (P-11).

## Constitution References

- P-1 (Almost-Zero-Maintenance Principle) — not directly exercised
  this sprint (no pipeline yet), but the data model (P-4) and
  `review_status` enum on `DailyReport` must be built now so Sprint 2
  doesn't need a migration to retrofit it.
- P-2 / P-2a (Target Audience, onboarding)
- P-4 (Content Domain Model)
- P-10 (Folder Structure)

## Definition of Done

Full Commander DONE_CHECKLIST.md applies, plus project CONSTITUTION.md
P-12 additions. In particular for this sprint:

- [ ] `npx tsc --noEmit` zero errors
- [ ] Registration flow tested end-to-end, both onboarding questions
      (P-2) persist correctly to `UserProfile`
- [ ] `other_tools_freetext` confirmed NOT wired into any filtering
      logic anywhere (P-2a) — grep the codebase to confirm, per the
      spirit of M-15 (propagation check), applied to this rule instead
      of a confidentiality rule
- [ ] Daily Report page renders correctly with zero `Article` rows
      (empty state, P-1.3 spirit: no report should ever look "broken"
      even with no data)
- [ ] `corrections/SPRINT_01_LESSONS.md` created with sprint learnings
- [ ] Handoff note written

## Handoff Note Template (fill at sprint end)

```
HANDOFF NOTE — Sprint 01
Completed: [...]
Not completed: [...]
Open risks: [...]
Technical debt: [...]
Next sprint: [recommended: Sprint 02 — Source Collector + Duplicate
  Engine, per project brief pipeline order]
```

---

*Vibe-Coding Journal — Sprint 01 — governed by Commander v1.2*
