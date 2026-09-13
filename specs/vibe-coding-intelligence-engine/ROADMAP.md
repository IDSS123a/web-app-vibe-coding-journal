# ROADMAP — Vibe-Coding Intelligence & Knowledge Engine

Origin: Director pasted a 50-section "ACA MASTER MANDATE" (2026-09-13)
proposing to evolve the Journal from a news digest into a trust-scored,
evidence-classified knowledge engine feeding a future chatbot. This
document is the result of checking that mandate against this project's
actual, already-recorded state before planning anything — per the
mandate's own Phase 1/Phase 2 ("audit first, document architecture")
and this project's standing discipline (M-4: never silently override a
recorded decision).

## Two conflicts found and resolved with the Director before this plan was written

1. **No RAG / no knowledge-graph retrieval.** The mandate's Phase
   13/24-29 assume a chatbot querying a live knowledge base at
   runtime. `CONSTITUTION.md` P-19 already records the Director's own
   2026-07-23 decision: no RAG, no vector database, the (not-yet-built)
   chatbot receives verified content only via system-prompt injection.
   **Resolved 2026-09-13: that decision stands.** This roadmap makes
   the Journal itself smarter (better sources, evidence framing,
   clustering) without building a queryable knowledge graph or
   retrieval layer. The chatbot (P-19) remains its own future,
   separately-scoped sprint, untouched here.
2. **Source-count vs. Gemini free-tier quota.** The mandate proposes
   100+ sources with per-item evidence scoring; PDL-021 already commits
   this project to a free-only AI-cost constraint, and that constraint
   is already under real strain (one of 8 rotating keys lost model
   access this week, see PDL-018). **Resolved 2026-09-13: stay
   free-only, grow the source count gradually and individually
   verified**, not in one large batch. Current count: 14 active
   sources (see `sprints/SPRINT_14.md` once written) — target growth
   is incremental across the phases below, not a fixed number.

## What this roadmap adopts from the mandate, and what it explicitly does not

**Adopted**, because it strengthens the existing pipeline without
requiring RAG or a large jump in AI call volume:
- A centralized Source Directory with class + trust score (extends the
  existing `sources` table — Class A/B/C/D/E/F from the mandate,
  simplified)
- A graded relevance score (0-100) instead of today's boolean
  `isRelevant`, and an evidence/claim framing pass ("vendor claim" vs.
  independently verified) — both are refinements of the *existing*
  `assessRelevance()` gate (P-0), not a new system
- Event deduplication/clustering — a real evolution of the existing
  hash-based duplicate engine, which today can only catch byte-for-
  byte-identical articles, not the same story covered by two sources
- A restructured daily/weekly report format ("N major developments,
  each with WHAT/WHY/EVIDENCE/CONFIDENCE") — an evolution of the
  existing `daily_reports` markdown generation
- Fact / vendor-claim distinction and hype-language discipline — P-3
  already bans hype words; this extends that same principle to
  "unverified vendor claim presented as fact," a real gap P-3 doesn't
  currently cover

**Not adopted (deferred indefinitely, not "later this quarter")**,
because it requires reversing the Director's own P-19 decision or a
paid AI budget neither of which was approved:
- Knowledge Item / Knowledge Relationship entities, knowledge
  "supersedes/superseded_by" versioning, obsolescence detection as a
  standing system
- Chatbot retrieval / provenance-for-chatbot
- Cross-source evidence verification requiring an AI call per claim
  (distinct from per-article relevance — this is additional AI volume
  the free tier does not have room for)
- Alert system (real feature, but depends on user-facing infrastructure
  — notification preferences, delivery channel — not yet designed;
  separately scoped if wanted)
- Formal 100+ source target — tracked as "grow the directory
  deliberately," not a number to hit

## Phased plan (each phase is its own sprint, own real-data verification gate — no batch approval, per `corrections/SPRINT_04_LESSONS.md` finding #15)

### Phase 1 — Source Directory & Trust Score (`SPRINT_14`)
Extend `sources` (migration): `class` (A-F per the mandate, simplified
to this project's actual source mix), `trust_score` (0-100),
`topics` (text array). Backfill the 14 current sources. Admin-visible
listing (extend the existing sources data, no new UI screen required
yet — a table view is enough to start).

### Phase 2 — Relevance Score Upgrade (`SPRINT_15`)
`assessRelevance()` returns a 0-100 score instead of boolean
`isRelevant`, calibrated against the same real examples already used
to verify the P-0 gate. Threshold-based hold/exclude behavior
unchanged in spirit, just more graded. Same AI-call volume as today —
one call per new article, not per claim.

### Phase 3 — Evidence Framing (`SPRINT_16`)
Extend the summarization prompt (P-3's existing rules) to flag an
unverified vendor claim as a claim ("The company reports...") rather
than stating it as fact — folded into the *existing* `summarize()`
call, not a new AI call.

### Phase 4 — Event Deduplication / Clustering (`SPRINT_17`)
Beyond today's exact-hash dedup: detect when two articles from
different sources cover the same underlying event (e.g. a new Claude
Code capability reported by both Anthropic's blog and Hacker News) and
group them into one report entry with multiple sources listed, instead
of two separate entries.

### Phase 5 — Daily/Weekly Intelligence Format (`SPRINT_18`)
Restructure the report into the mandate's WHAT HAPPENED / WHY IT
MATTERS / EVIDENCE / CONFIDENCE / WHAT TO WATCH shape for the
highest-impact items, with a weekly rollup (major shifts, reality
check, tools to watch) as a new, lower-frequency report type.

### Not phased yet — explicitly parked
Chatbot + knowledge graph + alerts: real ideas, correctly out of scope
until (a) the Director opens P-19's dedicated chatbot sprint, and (b)
the AI-cost model for that is resolved (P-19 already flags this as a
harder problem than the batch pipeline's).

## Source growth, concretely

Today: 14 active sources (GitHub Blog, Hacker News Front Page + 4
targeted queries, 3 Reddit AI/coding subreddits, OpenAI News, Google AI
Blog, Vercel Blog, Lobsters AI tag) — up from 2 as of this week.
Phase 1's trust-score/class work makes the NEXT round of additions a
deliberate, evaluated decision per source (matching the mandate's own
"every source must earn its place," section 4) rather than a bulk add.
No fixed target number is set here on purpose.
