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
- [ ] D Live sandbox: learner runs their own prompt on a real model, at most 3 runs a day per user, shares the free AI pool (PDL-058), built last
- [x] E1 Coins through the existing rewards system: lessons, exercises, chapters, level tests, paid by the server, celebrated in the browser (2026-09-21, PDL-072)
- [ ] E2 Badges, and coins for the University's learning steps too
