# COVERAGE: the Prompt School covers the whole book

**Rule (Director, 2026-09-20).** The Prompt School must cover the complete content of "Mastering Prompt
Engineering". No segment may be skipped. If a chapter needs more text and more lessons than planned, that is
fine, as long as every section of the book is properly covered. The lesson count is a floor, not a target.

## How the rule is enforced

- `features/prompt-school/content/book-map.ts` lists every section of the book (its own headings and its worked
  examples) and the School chapter that teaches it. It is the to-do list for the unwritten parts.
- Every lesson declares `covers: [section ids]`.
- The content test fails when an AUTHORED chapter leaves any section of its part of the book uncovered, when a
  lesson claims a section that does not exist or belongs to another chapter, or when an authored chapter still
  has `provisional` sections (a section list is provisional until the chapter is written from the source text
  and its granularity has been checked).
- `npm run book:coverage` prints the whole picture, chapter by chapter.
- Not teaching content, therefore not listed: copyright page, ISBN, acknowledgements, the table of contents.

## Where the book goes (18 chapters, about 98 lessons planned)

| Level | School chapter | Book part | Lessons planned | State |
|---|---|---|---|---|
| Beginner | craft-of-prompting | Foreword, chapter 1 | 5 | written, 8 of 8 sections |
| Beginner | five-pillars | Chapter 2 | 8 | written, 25 of 25 |
| Beginner | foundational-techniques | Chapter 3 | 5 | written, 18 of 18 |
| Beginner | markdown-for-prompts | Appendix C | 5 | written, 11 of 11 (2026-09-20) |
| Intermediate | reasoning-techniques | Chapter 4 | 6 | written, 22 of 22 (2026-09-20) |
| Intermediate | structure-and-protection | Chapter 5 | 7 | written, 21 of 21 (2026-09-20) |
| Intermediate | code-and-research | Chapter 6 | 7 | written, 23 of 23 (2026-09-20) |
| Intermediate | optimize-and-debug | Chapter 7 | 7 | written, 25 of 25 (2026-09-20) |
| Advanced | ethics-and-bias | Chapter 8 | 5 | written, 14 of 14 (2026-09-20) |
| Advanced | tools-and-multimodal | Chapter 9 | 5 | written, 16 of 16 (2026-09-20) |
| Advanced | case-studies | Chapter 10 | 5 | written, 18 of 18 (2026-09-20) |
| Advanced | the-future | Chapter 11 | 4 | written, 13 of 13 (2026-09-20) |
| Advanced | blueprints-1 | Appendix B, blueprints 1 to 5 | 6 | written, 21 of 21 (2026-09-20) |
| Advanced | blueprints-2 | Appendix B, blueprints 6 to 10 | 5 | written, 20 of 20 (2026-09-20) |
| Advanced | blueprints-3 | Appendix B, blueprints 11 to 15 and the closing | 6 | written, 21 of 21 (2026-09-20) |
| Advanced | techniques-reference | Appendix D | 4 | to do |
| Advanced | glossary | Appendix A | 6 | to do |
| Advanced | resources-and-platforms | Appendices E and F | 4 | to do |

## Audit of the first three chapters (2026-09-20)

Chapters 1 to 3 were first written condensed. They were audited against the source text and closed:
the foreword got its own lesson; chapter 1 got the closing "laying the groundwork" section; chapter 2 gained
"why context matters for a language system", the full "common delimiter choices" and "power of clear fences"
sections, and the workshop became two lessons (diagnosis of the broken prompt by pillar, then the five repair
steps with the complete assembled prompt and why it works); chapter 3 gained a lesson with all seven worked
examples (four zero-shot, three few-shot) and the two complete gold star example outputs in the workshop.
