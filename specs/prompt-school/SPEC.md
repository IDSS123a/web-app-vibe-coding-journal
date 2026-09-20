# SPEC: Prompt School

Status: DRAFT 2026-09-20, from the Director's request and her three answers the same day
(limited live sandbox, about 45 lessons in the first version, start with a specification and one
vertical slice). No em dashes, per the writing rule.

## Purpose

The Director wrote "Mastering Prompt Engineering". The Vibe-Coding University teaches how to build with AI
tools; it does not teach the craft of writing the prompts themselves. A second learning card, the Prompt
School, turns the book into a beginner to advanced course under the same Premium ($50) condition, so the
book is used to its full extent and Premium includes a fourth product for the same price. The reader does
not only read: they complete, repair, order and write prompts inside exercises.

## User stories

- As a Premium subscriber, I can work through a course from beginner to advanced whose chapters follow the
  book, with short lessons and practice after every chapter.
- As a learner, I complete a prompt with missing words, spot the flaw in a broken prompt, put prompt parts in
  the right order, repair a weak prompt by rewriting it, and get feedback on each attempt at once.
- As a learner, I see which lessons I finished and how well I did in each chapter, and I can retry.
- As a Basic subscriber or a trial user, I see what the School gives me and can buy Premium from the same screen.
- As the Director, I can extend the course by adding chapters and exercises as content, without new code.

## Acceptance criteria

- [ ] `/prompt-school` shows the whole planned course (3 levels, chapters mapped to the book) and marks which
      chapters are open; opening a chapter lists its lessons and its practice.
- [ ] A lesson page renders the lesson text and lets the learner mark it complete; previous and next work.
- [ ] Practice supports these exercise kinds, all graded on the server: multiple choice, fill in the blanks,
      order the parts, spot the flaw, repair the prompt (rubric graded).
- [ ] Correct answers and grading rubrics never reach the browser before an attempt is submitted.
- [ ] Access equals the University's: Premium, admin exempt, blocked and expired refused. Anonymous 401,
      Basic and trial 403 with the upsell screen. The probe checks it.
- [ ] Progress (lessons done, best score per exercise, chapter passed at 75 percent) is stored per user.
- [ ] Chapters open one after another like the University's: practice after all lessons are done, the next chapter
      only when the previous one is complete (Director, 2026-09-20).
- [ ] The School covers the COMPLETE book, no segment skipped (Director, 2026-09-20): every section of the book is
      in `content/book-map.ts`, every lesson declares what it covers, and the content test fails for an authored
      chapter that skips a section. See COVERAGE.md.
- [ ] The School cross-sells the book with a pop-up (Director, 2026-09-20): every 5 minutes of reading a modal window shows
      the cover; the reader can close it or press "Get the book" (small reward, then the book's payment page in a new
      window); with no click it closes by itself after 20 seconds. It is not a fixed block on the page.
- [ ] First slice: the chapter "The Five Pillars" (book chapter 2) complete with 6 lessons and 8 exercises.
- [ ] Responsive audit and end to end smoke test cover the new pages with 0 issues.
- [ ] No em dash anywhere in content or UI.

## Explicitly out of scope for the slice

- The other chapters' lesson text (planned, written in batches after the slice is approved).
- The live sandbox (learner runs their prompt on a real model), limited to 3 runs a day, built last (phase 4).
- Coins, badges and certificates. Level tests and cumulative tests (they follow the University pattern later).
- Any AI generation at runtime: all content is written from the book and stored, so the free AI quota is untouched.

## Open questions

- Whether lesson text quotes the book closely or condenses it (default: condensed, in plain language, the
  book stays the only source, as for the Assistant).
- Whether the 15 blueprints of the book's Appendix B become the advanced level's capstone workshops (proposed yes).
