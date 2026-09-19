# TASKS: Knowledge Growth, Dictionary Expansion and the No-AI-Tells Writing Rule

Order follows FEATURE_LIFECYCLE Step 3, grouped in work packages. Tick as done. No em dashes.

## WP0 Writing rule (item 4), first because everything below passes through it
- [x] 0.1 `lib/text/no-ai-tells.ts` + tests
- [x] 0.2 Apply in Gemini provider (deep, every parsed response) and add the rule to every system prompt and the prompt canon
- [x] 0.3 Replace in user-facing source strings (UI, emails, metadata) + guard test that scans source
- [x] 0.4 Sweep stored content (backup counts first), verify zero left
- [x] 0.5 Supabase Auth email templates checked and cleaned

## WP1 Pipeline health (P-21, root cause of "system does not grow")
- [x] 1.1 Collector: batch insert, item cap, age cutoff, parallel polling, real abort
- [x] 1.2 Source recovery: cool-down instead of permanent disable, re-enable the 9 healthy ones
- [x] 1.3 Triage heuristic (no AI) + tests
- [x] 1.4 Batch relevance (15 per call) + key cursor + tests
- [x] 1.5 Time budget in daily-digest, enrichment at non-target hours
- [x] 1.6 Migration 023 part A (articles.relevance_source, sources retry columns)
- [x] 1.7 Verify on a real run (P-21): run 35449239644, 213 s, report of 20 articles auto-published

## WP2 Historical clean-up and reuse (item 2)
- [x] 2.1 Full backup outside repo
- [ ] 2.2 Score all unscored articles (triage + batch relevance): 605 of 4,107 scored, the hourly cycle continues
- [x] 2.3 Dry run report, then remove articles below threshold (309 done; re-run after scoring completes)
- [x] 2.4 Rebuild or remove reports, remove the two 900 article reports
- [ ] 2.5 Summarise the relevant articles that lack a summary (paced, waits for 2.2)
- [ ] 2.6 Rebuild historical reports from the good remainder (waits for 2.2 and 2.5)

## WP3 Dictionary (item 1)
- [x] 3.1 Migration 023 part B and RLS
- [x] 3.2 Parser + merger for both documents, group and level classification, tests
- [x] 3.3 Import script (idempotent upsert), counts report
- [x] 3.4 API + UI rebuild, responsive audit including /dictionary
- [ ] 3.5 Premium-only access re-verified (anonymous 401, Basic 403), after deploy

## WP4 Learning loops (item 3)
- [x] 4.1 Term discovery cron + candidates table + promotion rule + tests
- [x] 4.2 Trending and new markers wired to the UI
- [x] 4.3 Add verified sources (curl checked, class and trust set), documented per source
- [x] 4.4 University supplementary cadence (daily, review queue cap); quiz questions for supplementary lessons NOT done
- [x] 4.5 Written explanation of how the system learns (layers, closed and open loops)

## Close
- [x] Self-review, typecheck, tests, build, responsive audit (152 checks, 0 issues)
- [x] DECISION_LOG (PDL-057 to 059), CHANGELOG, LEARNING_LOOPS.md
- [ ] Commit, ask the Director before push, verify production
