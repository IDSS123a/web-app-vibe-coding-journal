# SPEC: Knowledge Growth, Dictionary Expansion and the No-AI-Tells Writing Rule

Status: DRAFT 2026-09-19, written from the Director's four-part instruction of the same day.
Note on style: this document deliberately contains no em dashes. That is rule 4 below.

## Purpose

The Director's position: for the product to be a world class SaaS that earns money, it must
follow the most reliable sources through a wide search network, publish verified vibe-coding
news among the first, and keep learning by itself every day. Four concrete demands:

1. **Dictionary.** Populate the existing Dictionary (13 terms today) from two supplied
   documents (about 2,640 unique terms) and make a very large glossary easy to use: overview,
   indexing, grouping.
2. **Historical digests.** Remove everything in the stored articles and digests that is not
   directly about vibe-coding, then reuse the good remainder inside the app (the existing
   knowledge base must be exploited, not abandoned).
3. **Growth and learning.** Verify whether the system really grows and learns daily, explain
   how depth of meaning is designed across the ecosystem, and fix what does not. Specifically
   the Dictionary is static and does not notice new terms in the market, and the University
   supplementary section shows nothing new.
4. **Writing rule.** Recognisable AI writing tells must never appear anywhere. The spaced
   em dash is the named example: always replace it with a comma and a space.

## User stories

- As a Premium subscriber, I can find any term in seconds, by typing, by topic, by letter or by
  level, without being overwhelmed by thousands of entries.
- As a Premium subscriber, I can see which terms are new or trending this week, so the
  Dictionary reflects the market today and not only the day it was written.
- As a Basic or Premium subscriber, I read a Daily Report and Archive that contain only
  vibe-coding content.
- As the Director, I can trust that the pipeline finishes every day, that its sources stay
  alive without me, and that new terms and lessons appear without manual authoring (review
  stays available where quality is at stake).
- As any reader, I never see AI tells such as the spaced em dash in any page, email, AI output
  or stored content.

## Acceptance criteria

- [ ] Dictionary holds every unique term from both documents, each with a topic group, a
      difficulty level and a relevance tier; nothing is dropped silently, duplicates are merged
      and counted.
- [ ] Dictionary page: instant search (term, alias, definition), topic tiles with counts, A to Z
      rail, level filter, an "essential" default that hides advanced and adjacent terms behind
      one toggle, related terms, "new" and "trending" markers. Works from 320 px to 1920 px and
      passes the responsive audit.
- [ ] Stored articles: every article carries a relevance score; those below the P-0 threshold
      are removed after a full backup is written outside the repository; reports are rebuilt
      from remaining relevant articles or removed when nothing relevant is left; counts before
      and after are reported.
- [ ] The daily pipeline completes inside its time budget on a real run and produces the day's
      report; a slow phase can no longer make the whole run fail.
- [ ] Sources: dead sources recover on their own (cool-down, not permanent disable), the
      number of healthy sources rises through verified additions, and polling no longer scales
      with feed length.
- [ ] New terms are discovered from articles automatically, promoted only when established
      (several mentions across independent sources), and shown as new.
- [ ] The University supplementary layer grows on a schedule that produces visible new material
      at least weekly, with the review gate unchanged.
- [ ] No em dash (or spaced en dash) in: UI text, emails, AI prompts and outputs, page titles,
      and every stored content column; a test fails the build if one is added to user-facing
      source; AI output passes through a sanitiser before it is stored.
- [ ] A written explanation of how the system learns, layer by layer, including which feedback
      loops are closed and which are still open.

## Explicitly out of scope

- No RAG, no vector database (CONSTITUTION P-19 stands).
- No paid AI (PDL-021 stands): all new AI work is designed to stay inside the free Gemini quota.
- No change to pricing tiers or the paywall.
- Rewriting historical governance documents (DECISION_LOG and older sprint notes) to remove
  dashes: they are internal and dated; new documents follow the rule.
- Real-device and non-Chromium testing.

## Open questions (decided by default, revisable)

- Default Dictionary view shows "core" and "related" terms; "advanced and adjacent" (deep
  machine learning, distributed systems, compliance) sits behind a toggle. Reason: P-0 says the
  product is not a general AI encyclopedia.
- Where the two documents define the same term, the shorter plain-language definition wins,
  the other is kept as an alias only when it adds a spelling or abbreviation.
