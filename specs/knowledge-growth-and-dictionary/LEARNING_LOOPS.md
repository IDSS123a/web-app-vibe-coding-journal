# How the system grows and learns (state on 2026-09-19)

Written for the Director after the question "does the system grow and learn every day, and how is
meaning designed in depth?". It says what is closed and running, what is only half closed, and what
does not exist. No em dashes, per the writing rule.

## 1. The flow, layer by layer

| Layer | What happens | Depth of meaning kept per item |
|---|---|---|
| Sources | 32 enabled feeds (was 5 working of 14). Each has a class (A official vendor, C independent technical, E developer practice, F press) and a trust score 0 to 100. | class, trust score, topics |
| Collect (every hour) | Newest 40 items per feed, none older than 30 days, one batched insert, real count of new items. A failing source pauses (6 to 72 hours) and comes back by itself. | source, published date, hash |
| Duplicates | Exact hash, then event clustering (same story from two sources is one entry with "also covered by"). | duplicate_of, related sources |
| Triage (free) | Text with no AI or software vocabulary is dropped without spending an AI request. | relevance_source = triage |
| Relevance gate (P-0) | One AI request judges 15 articles, score 0 to 100, threshold 60. Below it the article never reaches a reader. | relevance_score, relevance_source |
| Enrichment | Only relevant articles: confidence, category, editorial summary with "what happened, why it matters, evidence, confidence, what to watch", worth-trying verdict. Best first, capped per run. | summary, why_it_matters, who_it_affects, worth_trying, what_to_watch, confidence |
| Report | Built from finished, unreported, relevant articles (max 20). Hype filter looks only at published text. Auto-published or held for review (P-6). | report status, hold reasons |
| Reader surfaces | Dashboard, Archive, Bookmarks (Basic and Premium), University, Dictionary, Assistant (Premium). | |

Knowledge layers built on top of the articles:

- **Dictionary.** 2,639 terms from two supplied documents (13 before), each with topic group, level,
  tier (core, related, adjacent), aliases and related terms. It learns from the market: see loop D.
- **University.** 75 hand written core lessons with quizzes and level tests (fixed), plus a supplementary
  layer that is generated from recent articles. It ran once a week and now runs daily (see loop E).
- **Assistant.** Prompt Blueprint builder on the Director's book canon. Static by design.

## 2. The learning loops, honestly

| Loop | State | What it does |
|---|---|---|
| A. Source health | CLOSED, new | A failing source is retried after a growing pause and re-enabled on success. |
| B. Relevance | HALF CLOSED | Every score is stored with how it was decided, so it can be audited, but nothing yet adjusts the threshold or a source's trust score from the results. |
| C. Hold gate calibration | CLOSED, monthly, admin approves | Judges whether banned hype words were real hype or false positives and proposes list changes. Existing feature (PDL-042 era). |
| D. Dictionary discovery | CLOSED, new | (1) Mention counts: which known terms appear in the relevant articles of the last 7 days, no AI, drives the "trending" marker. (2) Discovery: one AI request per hour at most reads 15 unread relevant articles and proposes terms the Dictionary lacks. (3) A candidate is published only when it appears in at least 3 articles from at least 2 independent sources within 14 days, then it is marked "new" for two weeks. |
| E. University supplementary layer | HALF CLOSED | Generation moved from weekly to daily and pauses when 5 lessons wait for review. The admin review gate is unchanged (PDL-042), so visible growth depends on approval. No quiz questions are generated for supplementary lessons yet. |
| F. Reader behaviour | OPEN | Bookmarks, opens and streaks are recorded but not fed back into ranking or source trust. |
| G. Cross source verification | DOES NOT EXIST | No claim is checked against a second source by AI. It would multiply AI requests beyond the free tier. |
| H. Semantic search over knowledge (RAG, embeddings) | DOES NOT EXIST BY DECISION | CONSTITUTION P-19. Meaning is carried by structured fields, not vectors. |

## 3. What limits growth: the AI request budget

Measured on 2026-09-19: the free Gemini tier allows 20 requests per day per key per model. With about six
live keys and two models that is roughly 100 to 240 requests a day for everything: the report, the Assistant
(capped at 30), the University, the Dictionary and the backlog. Everything above is designed around that:
free triage, 15 articles per relevance request, summaries only for the best articles, a 100 request daily
budget for background work, a second model when the first one's quota is spent. Real growth beyond this
needs more keys or a paid tier (PDL-021 says free only, so that is the Director's decision).

## 4. What was found wrong before this work

The pipeline had stopped growing for structural reasons, not because of the source count: the daily run timed
out three times, nine sources were permanently off, 94 percent of stored articles were never scored, only
one report was ever published, the Dictionary had no market input at all. See PDL-058 and PDL-059.

## 5. Still open (not done here)

- Anthropic, Cursor and Windsurf publish no RSS feed that answered (404). They are the most relevant primary
  sources for vibe-coding and need a different collector (page or sitemap based).
- Reddit answers 403 or 429 to cloud servers. It stays paused until a workable route exists.
- Loops B and F above.
- Supplementary quiz questions.
