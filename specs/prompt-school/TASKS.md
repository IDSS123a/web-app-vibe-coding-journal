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
- [x] A1c Book cross-sell on the overview and chapter pages: cover, click reward (25 coins once), PayPal window (2026-09-20)
- [x] A2a Appendix C, the Markdown manual (5 lessons, 9 exercises, 11 of 11 sections), which completes the beginner level (2026-09-20)
- [ ] A2b Write the rest of the book in the order of COVERAGE.md, one or two chapters at a time, each read in full from the source first: chapters 4 to 7, chapters 8 to 11, Appendix B (three workshops), Appendices D, A, E and F
- [ ] B Level tests (like the University's; chapter gating is done)
- [ ] C Capstone workshops from the book's Appendix B blueprints
- [ ] D Live sandbox: learner runs their own prompt on a real model, at most 3 runs a day per user, shares the free AI pool (PDL-058), built last
- [ ] E Coins and badges through the existing rewards system
