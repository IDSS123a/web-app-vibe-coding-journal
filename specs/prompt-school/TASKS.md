# TASKS: Prompt School

Vertical slice (2026-09-20): tasks 1 to 10 done and verified, 11 waits for the Director's approval to push.

- [x] 1 Migration 030, applied to production
- [x] 2 Domain: types and grading, tests (30)
- [x] 3 Content: outline of the whole course (12 chapters, 47 lessons planned), slice chapter (6 lessons, 8 exercises), content validation test (11)
- [x] 4 Seed script `scripts/seed-prompt-school.ts` (idempotent), run against production
- [x] 5 Repository
- [x] 6 Permissions (`canAccessPromptSchool`), `/api/me` (`hasPromptSchoolAccess`), PremiumGuard and PremiumPitch feature, nav link (menu breakpoint lg to xl)
- [x] 7 API routes (5)
- [x] 8 UI: overview, chapter, lesson, practice with the five exercise kinds
- [x] 9 Probe (130 checks), smoke test (30 checks) and responsive audit extended to the new pages
- [x] 9b Chapter unlocking like the University (Director, 2026-09-20): practice after all lessons, next chapter after the previous is complete
- [x] 10 Self-review, typecheck, lint, tests, build
- [ ] 11 PDL-061, CHANGELOG, commit; ask the Director before push

## Next phases (after the Director approves the slice)

- [x] A1 Chapters 1 and 3 (2026-09-20, PDL-062)
- [x] A1b Coverage rule: book map, `covers` on every lesson, coverage test, `npm run book:coverage`; chapters 1 to 3 audited and completed (2026-09-20)
- [x] A1c Book cross-sell: cover, click reward (25 coins once), PayPal window (2026-09-20); changed the same day from a fixed block to a pop-up every 5 minutes that closes by itself after 20 seconds (PDL-066)
- [x] A2a Appendix C, the Markdown manual (5 lessons, 9 exercises, 11 of 11 sections), which completes the beginner level (2026-09-20)
- [x] A2b Chapters 4 to 7, the whole intermediate level (27 lessons, 40 exercises, 91 of 91 sections), each read in full from the source first (2026-09-20)
- [x] A2c Chapters 8 to 11, the advanced level's main text (19 lessons, 40 exercises, 61 of 61 sections), each read in full from the source first (2026-09-20, PDL-068)
- [x] A2d Appendix B, the three blueprint workshops (17 lessons, 30 exercises, 62 of 62 sections, four parts per blueprint tracked separately), read in full first (2026-09-20, PDL-069)
- [x] A2e Appendices D, A, E and F (15 lessons, 30 exercises, 157 sections), each read in full from the canon text first; the whole book is covered, 433 of 433 sections (2026-09-20, PDL-070)
- [x] B Level tests: 37 new questions in three tests, migration 031, one-sitting grading on the server, 80 percent to pass, no reveal after the test, overview cards, probe, smoke and audit extended (2026-09-20, PDL-071)
- [x] C Capstone workshops: one repair workshop per blueprint, 12 new, graded by rubrics that reward what makes each blueprint work (2026-09-21, PDL-073)
- [x] D Live sandbox: own prompt on a fixed sample input inside 6 lessons, 3 runs a day per learner and 30 a day overall from the shared free pool, not graded, no coins, nothing stored but the fact of a run (migration 033, 2026-09-21, PDL-077)
- [x] E1 Coins through the existing rewards system: lessons, exercises, chapters, level tests, paid by the server, celebrated in the browser (2026-09-21, PDL-072)
- [x] E2 Badges (12, migration 032, /badges page) and coins for the University's lessons, chapter quizzes and level tests, celebrated by the shared system (2026-09-21, PDL-075)

## State at the end of 2026-09-21 and what comes next

Everything below is pushed (origin/main at 33f13bf) and live (verified: live smoke test and security probe 149 of 149).

- Prompt School: 18 chapters, 101 lessons, 433 of 433 book sections, level tests, a workshop for every blueprint, coins.
- KANON visual system on the whole app (PDL-074). Real-device check on iOS Safari is still open (only Chrome was available).
- Migration 031 is applied. Retroactive coins for progress made before PDL-072: the Director said not needed (script exists, not run).

Options for the next session, in the order the plan gives them:
1. (E2 done later the same day, see PDL-075.)
2. (D done later the same day, see PDL-077.) Original notes: live sandbox (the riskiest step). Design questions to settle with the Director first: which model and how it shares the free
   Gemini pool (PDL-021, PDL-058), the 3 runs a day per user limit, what the learner may run (only their own prompt against a
   fixed sample input?), prompt-injection and abuse limits, and how a run is graded (no AI grading is the standing rule).
3. Director tasks that are not code: repair the manuscript (five holes, four stray drafting notes, old chapter numbers, the bare
   "Note:" at the end; see PDL-068, PDL-070 and memory book-canon-docx), and look at the new design on a real iPhone and Android phone.
4. Not started, only mentioned: a real Scan mode (KANON Console layer for the Daily Report), a certificate, cumulative tests.

## State on 2026-09-22

Done since the last update: D live sandbox (a task in all 18 chapters, PDL-077 and PDL-080), certificates (PDL-080), Scan mode for the Daily Report (PDL-082), launch preparation (PDL-079), health check (PDL-081).

Still open:
- [ ] Cumulative tests across chapters (a "final exam"): needs a fourth test level (level type, three tables, unlock rule, routes, certificate) and about 20 new questions grounded in the book. Plan it with the Director.
- [ ] Weekly rollup report (roadmap Phase 5): schedule, table, one AI request a week, a page.
- [ ] The Director's manuscript repair (five holes, four stray notes, old chapter numbers, the bare "Note:" at the end), then a reseed.
- [ ] Real phones and Firefox/Safari.
- [ ] Hand review of the model-written University lessons.
