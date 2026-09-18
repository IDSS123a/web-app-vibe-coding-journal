# CONSTITUTION.md — Vibe-Coding Journal
# Project Constitution
# Inherits: Commander/CONSTITUTION.md v1.2 (https://raw.githubusercontent.com/IDSS123a/commander/main/CONSTITUTION.md)
# Version 1.0 — July 2026 (bootstrapped under Commander v1.2, start-new-project protocol)
# Applies to: this repository only

---

> **FOR ANY AI CODING ASSISTANT (ACA):**
>
> Read Commander/CONSTITUTION.md first (Tier 2 minimum — M-1 through M-5
> always; full document for sprint/feature work per M-21). This document
> adds project-specific rules on top of it and never contradicts it.
> Per Commander's Document Precedence order, this Project Constitution
> wins on project-specific rules (position 5), but Commander's
> CONSTITUTION.md still wins on mindset and process (position 1).
> Where this document is silent, Commander rules govern.
>
> **Severity:** 🔴 CRITICAL  🟡 STANDARD  🟢 PREFERRED (same convention
> as Commander v1.2). **Status:** `[ACTIVE]` unless marked otherwise.

---

## P-0. What This Project Is `[ACTIVE]` 🔴 CRITICAL

Vibe-Coding Journal is an automated daily intelligence digest for
**vibe-coders** — people building software with AI coding tools
(Bolt, Lovable, Replit, Cursor, Windsurf, Claude Code, GitHub Copilot,
v0, and similar).

It is not a general AI news aggregator. Every piece of content must
pass one test: **does this help someone who builds apps with AI tools
make a better decision today?**

The product is not the news. The product is **one page per day, readable
in under 10 minutes, that a vibe-coder can trust without cross-checking
elsewhere.**

Reference: see project brief and pipeline architecture discussion
(Source Collector → Duplicate Engine → Quality Engine → Classifier →
AI Summary → Daily Report → Database → Frontend → Archive).

---

## P-1. The Almost-Zero-Maintenance Principle `[ACTIVE]` 🔴 CRITICAL

This project must run for months with only a thin layer of human
review (target: minutes per week after the stabilization period, not
hours per day). This is a design constraint, not an aspiration — it
overrides convenience shortcuts that create silent, unattended failure
modes.

Concretely, this means, in order of priority:

1. **Never let a pipeline stage fail silently.** A stage that cannot
   complete with confidence must halt publishing and raise a flag
   (see P-6), not degrade output quality quietly.
2. **Never auto-publish below a defined confidence threshold.**
   See P-5 (Quality Thresholds).
3. **Always prefer a smaller, correct daily report over a larger,
   uncertain one.** Per Commander M-3, this is Data Integrity ranking
   above Developer Convenience and User Interface — an empty section
   with a visible "no qualifying news today" beats a low-quality
   section that pretends to be normal.
4. **Every external dependency (RSS feed, API, LLM model, embedding
   model) must be checked automatically before use, not assumed
   healthy.** See P-7 (Source Health Monitoring).

This principle sits alongside Commander M-3's Decision Hierarchy;
where a design choice trades reliability of unattended operation
against elegance or richness of a feature, unattended reliability
wins, ranked between Commander's "Data Integrity" and "Architecture
Consistency" tiers.

---

## P-2. Target Audience `[ACTIVE]` 🟡 STANDARD

Two independent, non-exclusive profiles are collected at onboarding
(never a single fixed persona — see Commander M-4, do not invent
categories beyond what is specified here):

**Tools used** (multi-select):
- No-code / low-code (Bolt, Lovable, Replit, v0)
- AI-assisted IDE (Cursor, Windsurf)
- Agent-based coding (Claude Code, GitHub Copilot agent mode)
- Something else (free text, logged for internal review only —
  must never silently drive content filtering logic; see P-2a)

**Depth preference** (single-select):
- Keep it simple — focus on "what can I build now"
- Technical when it matters
- Deep technical — do not skip nuance

### P-2a. Free-Text Handling Rule `[ACTIVE]` 🟡 STANDARD

The "something else" free-text field must never be parsed by an LLM
to auto-derive a new persona or silently alter a user's content feed
without an explicit, reviewed mapping added to this Constitution
first. Per Commander M-4/M-10: an unreviewed inferred category is
invented business logic. It is stored, aggregated for a human to read
periodically (P-11), and nothing more, until this document is updated.

---

## P-3. Editorial Voice — Non-Negotiable Rules `[ACTIVE]` 🔴 CRITICAL

**Daily Report content language: English.** The `HYPE_WORDS` list and every
P-3 editorial-voice example in this section are in English by design, not
oversight (PDL-007). A hype term in another language will not be caught by
the filter unless and until that language is explicitly added here.

Every generated summary (single article or Daily Report) must obey:

- **No hype words.** Banned by default, unless directly quoting a
  named source with attribution: "revolutionary", "game changer",
  "groundbreaking", "unprecedented", "disrupts", "changes everything".
  A post-generation filter must check for these terms before
  publishing (see P-6); a match blocks auto-publish.
- **Every item ends with an actionable judgment**, not just a
  description. Minimum required fields per item (see P-4 schema):
  `why_it_matters`, `who_it_affects`, `worth_trying` (yes/no/maybe
  + one sentence).
  Emphasis: the "what should I test today" framing is the primary
  value proposition of this product (per project brief P-0) and must
  never be reduced to an optional trailing section — it is generated
  and reviewed with the same priority as the headline itself.
- **Depth adapts to the reader's stated preference (P-2)**, never to
  the writer's assumption of what sounds impressive. Default depth
  (before personalization ships) is "simple with technical detail
  only when it changes the recommendation."
- **No unexplained jargon.** Any tool-specific or technical term
  introduced (MCP, RAG, tool calling, context window, agent mode)
  gets a parenthetical plain-language gloss the first time it is used
  in a given day's report.
- **Comparative framing is preferred over isolated description** when
  the news concerns a tool that has direct competitors (per project
  brief P-2, point 2: "Tool Comparison" is a standing value driver,
  not a one-off feature).
- **Evidence framing** (added 2026-09-13, Phase 3 of
  `specs/vibe-coding-intelligence-engine/ROADMAP.md`): a vendor's
  unverified claim about their own product — a performance,
  productivity, capability, or benchmark claim the article does not
  independently verify — must be attributed as their claim ("The
  company reports...", "X claims..."), never restated as established
  fact. Example: a vendor says "our new agent makes developers 5x
  faster" → write "The company reports a 5x productivity improvement,"
  never "Developers are 5x faster." This applies only to the vendor's
  own evaluative claims about impact — that a release shipped or a
  feature launched is a fact and needs no hedge.

---

## P-4. Content Domain Model (Authoritative — see Commander M-4) `[ACTIVE]` 🔴 CRITICAL

Per Commander's Anti-Hallucination Protocol, no ACA may invent fields,
categories, or tables beyond what is listed here or in a later,
explicitly approved sprint document.

**Article** (minimum fields; extend only via DECISION_LOG entry):
```
title
url
source
published_at
raw_summary          (pre-editorial, internal only)
summary              (final, editorial-voice text, P-3 compliant)
why_it_matters
who_it_affects
worth_trying          enum: yes | no | maybe
importance_score      integer 1-10
category               enum, see Classifier tag list (project brief §5)
quality_flag           enum: news | marketing | rumor | tutorial |
                        release | benchmark | research | clickbait
confidence_score       float 0-1 (Quality Engine's own confidence)
duplicate_of           nullable reference to another Article
hash
```

**DailyReport**:
```
date
markdown
reading_time_minutes
article_count
sections               (Najvažnije, Trendovi, Novi alati, Research,
                        GitHub, Šta testirati danas — order fixed
                        unless changed via sprint doc)
review_status          enum: auto_published | held_for_review |
                        manually_approved | rejected
approved_by            nullable — email of admin who approved a held
                        report (audit trail, Sprint 04)
approved_at            nullable timestamp — when approval happened
rejected_by            nullable — email of admin who rejected a held
                        report (audit trail, Sprint 04)
rejected_at            nullable timestamp — when rejection happened
```

*Sprint 04 additions (why):* the Review Queue (P-6) needs a human
approve/reject action with an accountable trail — who acted and when.
`rejected` was added to the `review_status` enum because a held report
that an admin declines is a distinct terminal state from
`manually_approved`; without it the reject action would have no valid
status to write. The four `approved_*`/`rejected_*` fields record the
acting admin (taken from their verified JWT, not client input) so the
audit cannot be spoofed.

**UserProfile** (extends Commander's generic user model; do not
invent auth fields beyond what an approved sprint specifies):
```
role                     enum: user | admin — default 'user' (Sprint 04)
tools_used               (multi-select, P-2)
depth_preference         (single-select, P-2)
other_tools_freetext     (P-2a, internal only)
saved_articles           (bookmarks, many-to-many with Article)
subscription_status      enum: trial | active | expired (P-13)
trial_started_at         timestamp (P-13)
trial_ends_at            timestamp (P-13)
subscription_expires_at  timestamp, nullable until first payment (P-13)
subscription_tier        enum: basic | premium (P-13, added 2026-07-19)
```

*Sprint 04 addition (why):* `role` was added to gate the admin Review
Queue (P-6). Authorization is read from this DB column at request time,
not from a token claim (M-7: the database is the single source of truth
on who is an admin, so access can be revoked immediately). Default is
`user`; only an explicit promotion grants `admin`.

*Governance addendum addition (why):* `subscription_status` and the three
timestamp fields were added per P-13 (Business Model — Subscription &
Trial) to support the trial/paywall flow. Not yet implemented in code —
scheduled for a future sprint with its own scope document; documented here
first per the P-12 rule that a schema field must exist in this Constitution
in the same change that establishes the business rule, not be left to
implementation time.

*P-13 two-tier revision addition (why):* `subscription_tier` was added
2026-07-19 when P-13 was revised from one tier to two (Basic $10/year,
Premium $50/year — see DECISION_LOG.md for the PDL that supersedes the
original single-tier pricing decision). Independent of
`subscription_status`: status tracks trial/active/expired lifecycle,
tier tracks which plan. Not yet implemented in code — same
governance-first, implementation-later discipline as the original P-13
fields above.

No other tables/fields exist until a sprint document adds them.

---

## P-5. Quality Thresholds (Editable only via DECISION_LOG, not silently) `[ACTIVE]` 🟡 STANDARD

These are starting values for the MVP. Any change to a number below
must be logged in DECISION_LOG.md with the reason and the date —
per Commander M-12/M-3 discipline, threshold tuning is an
architectural decision, not a casual parameter tweak, because it
directly gates what gets auto-published unattended (P-1).

- Duplicate detection similarity threshold: to be set during Sprint
  covering the Duplicate Engine; not invented here.
- Quality Engine confidence threshold for auto-classification: items
  below threshold go to the review queue (P-6), not auto-published,
  not silently dropped.
- Daily Report article count sanity range: if the day's qualifying
  article count falls far outside the normal historical range (too
  few or suspiciously many), publishing halts and a review alert
  fires (P-6). Exact numeric bounds are a Sprint-level decision, not
  invented here.
- Hype-word filter (P-3): zero tolerance, blocks auto-publish on any
  match, no numeric threshold.

---

## P-6. Review Queue & Publish Gate `[ACTIVE]` 🔴 CRITICAL

Auto-publish is the default path. It is interrupted only when:

1. Quality Engine confidence is below threshold (P-5) for any item
   in the day's candidate set, or
2. The hype-word filter (P-3) fires, or
3. The daily sanity check (P-5) is out of range, or
4. Any required Source (P-7) is unreachable and no fallback source
   exists for that category.

When interrupted: the Daily Report is generated as a draft
(`review_status = held_for_review`), a single notification is sent
(email, per Sprint config), and the previous day's report remains
live until a human approves or the system self-resolves on the next
scheduled run. The system never publishes a report it cannot stand
behind, per P-1.3.

---

## P-7. Source Health Monitoring `[ACTIVE]` 🟡 STANDARD

Every registered Source (RSS/API) is checked for reachability and
basic sanity (non-empty, parseable, not stale beyond an expected
interval) before each collection run. Per Commander M-15's spirit
applied to sources rather than security: a source that silently goes
stale is a "classic blind spot" — check it every run, not only when
something visibly breaks.

A Source with three consecutive failures is auto-disabled and flagged
for the monthly self-audit (P-11), not silently retried forever and
not silently removed from the config.

---

## P-8. Personalization Boundary (MVP Scope) `[ACTIVE]` 🟡 STANDARD

Per the earlier project discussion: at MVP, the Daily Report content
is **the same for all users**. Personalization (P-2 profile data) is
used only for:
- Visual tags on items (e.g. beginner-friendly / technical) — display
  only, does not filter or hide content.
- Bookmarks/archive (P-4 UserProfile.saved_articles).

Feed filtering or per-user report generation based on P-2 data is
explicitly **out of scope** until a dedicated sprint introduces it
based on observed engagement data (P-11), not assumptions. Building
this earlier than specified here is scope creep per Commander M-13
and must not happen without an approved sprint document.

---

## P-9. Stack (per Commander M-16 — record deviation reasoning here
once chosen) `[ACTIVE]` 🟢 PREFERRED

Default: Commander's standard stack (Next.js + Server Actions +
Vercel-style hosting) for the Presentation/Application layers.

The unattended pipeline (Source Collector, Duplicate Engine, Quality
Engine, Classifier, AI Summary, Daily Report generation) is a
**scheduled background job layer**, not part of the request/response
HTTP cycle. This is a documented extension to Commander's five-layer
model (M-5), inserted as:

```
Presentation
      ↓
Application
      ↓
Domain
      ↓
Infrastructure
      ↓
External
      ↑
Pipeline / Jobs   ← scheduled, cron-driven, writes to the same
                     Infrastructure layer (database) that
                     Application reads from. Never calls
                     Presentation or Application directly.
```

Final stack choice (hosting for cron jobs, LLM provider, embedding
provider for Duplicate Engine) is a DECISION_LOG entry, not decided
in this Constitution — per Commander M-4, do not invent vendor
choices here.

---

## P-10. Folder Structure (extends Commander M-6) `[ACTIVE]` 🟡 STANDARD

```
features/
  sources/          Source Collector: registration, RSS/API polling
  pipeline/          Dedup, Quality Engine, Classifier, Summary
                      generation — cron-driven, not user-request-driven
  daily-report/       Aggregation into the single daily report
  archive/            Historical reports, search
  bookmarks/          Per-user saved articles
  onboarding/         Tools-used + depth-preference capture (P-2)
  admin/              Source management, manual trigger, logs (per
                      project brief §11)
```

No folder is added outside this list without a sprint document or a
DECISION_LOG entry, per Commander M-6/M-12.

---

## P-11. Monthly Self-Audit (the human touchpoint, per P-1) `[ACTIVE]` 🟡 STANDARD

Once monthly, the system generates a self-audit report (not
user-facing) covering: source usage/failure counts (P-7), review
queue volume and reasons (P-6), engagement signals (most/least saved
articles, most/least clicked categories), and any "other tools"
free-text entries (P-2a) accumulated since the last audit.

This is the **only** scheduled point at which a human is expected to
make judgment calls about source priority, threshold tuning (P-5), or
whether personalization scope (P-8) should expand. Outside of this
review and the review-queue interrupts (P-6), the system runs
unattended per P-1.

---

## P-12. Definition of Done — Additions to Commander's DONE_CHECKLIST `[ACTIVE]` 🟡 STANDARD

In addition to Commander's universal Done Checklist, a feature in
this project is not done until:

- [ ] It does not silently degrade output quality under a failure
      condition (P-1.1) — a failure path was tested, not just the
      happy path.
- [ ] Any new AI-generated text field was checked against the P-3
      editorial voice rules with real (not placeholder) input.
- [ ] Any new or changed threshold (P-5) is recorded in
      DECISION_LOG.md with the reason.
- [ ] Any new field on Article/DailyReport/UserProfile (P-4) was
      added to this Constitution in the same change, not left
      undocumented in code only.

---

## P-13. Business Model — Subscription & Trial `[ACTIVE]` 🔴 CRITICAL

- **Two tiers, both flat annual, no monthly option** (revised
  2026-07-19 — supersedes the original "one tier only" decision; see
  DECISION_LOG.md for the superseded/superseding PDL pair):
  - **Basic — $10/year.** The curated daily/weekly digest — the
    entire product as built through Sprint 06: Daily Report, Archive,
    Bookmarks.
  - **Premium — $50/year.** Everything in Basic, plus the Vibe-Coding
    Assistant chatbot (P-19). Premium is **not** a different content
    feed — P-8 (Personalization Boundary: Daily Report is the same
    for all users) is unchanged by this revision. The chatbot is the
    only Premium-exclusive feature.
  - Whether the trial grants Premium-level access temporarily, or
    only Basic-level, is **not yet decided** — an open question for
    Sprint 07 scope, not invented here.
  - Upgrade/downgrade behavior (e.g. a Premium subscriber dropping to
    Basic mid-year, prorated credit) is **not specified** — same
    not-specified/not-invented discipline as the original no-proration
    note. A future PDL must resolve this before billing UI is built.
- **Trial:** 3 days from registration timestamp, full feature access,
  no card required to start. Unchanged by the two-tier revision.
- **On trial expiry without an active subscription: hard block.** No
  access to Daily Report, Archive, or Bookmarks — redirect to a
  paywall/subscribe screen. No degraded "read-only" mode. This is a
  deliberate simplicity choice (Director's explicit decision) — do
  not invent a softer fallback. Unchanged by the two-tier revision.
- **Data model extension of P-4** (`UserProfile`):
  ```
  subscription_status    enum: trial | active | expired
  trial_started_at
  trial_ends_at
  subscription_expires_at
  subscription_tier      enum: basic | premium
  ```
  `subscription_tier` is new (2026-07-19) and independent of
  `subscription_status` — status is trial/active/expired, tier is
  which plan. This must be reflected in the P-4 schema block itself in
  the same change, per the existing P-12 Definition-of-Done rule — do
  not let this section be the only place this schema exists.
- **Admin accounts (P-14) are billing-exempt.** The exemption must be
  an explicit, auditable check (e.g. a named function in
  `lib/permissions.ts`), never an accidental side-effect of role
  logic living somewhere else. Per P-1, an undocumented bypass is
  exactly the kind of silent behavior this project exists to avoid.
  Unchanged by the two-tier revision, applies to both tiers.

---

## P-14. Roles & Access Control `[ACTIVE]` 🔴 CRITICAL

- **Two roles only: `user` and `admin`.** No separate Superadmin
  tier. The operational account behind the project
  (`ai-hero-studio@outlook.com`) is simply the first `admin` account
  — it uses the same `admin` role and the same admin capabilities as
  any future admin account, nothing schema-special about it.
- **"Advanced control" features** the Director has described (block/
  grant/revoke user access, activation/reactivation, usage tracking,
  statistics, swapping AI provider API keys) are all `admin`-role
  features. They are built incrementally, one sprint at a time, per
  Commander M-13 — never invented wholesale in a single sprint just
  because they were all mentioned together.
- **Centralize role checks** in `lib/permissions.ts` (Commander M-7).
  No scattered `if (role === 'admin')` checks across features —
  every permission check calls a named function from this single
  source of truth.

---

## P-15. Branding & Public Identity `[ACTIVE]` 🟢 PREFERRED

- **Public brand name:** "Prompt Hero Studio™" — used in footer,
  About section, and any public credit line. The project's internal/
  repository name ("Vibe-Coding Journal") is not necessarily the same
  as the public-facing brand and does not need to be — no code
  rename required.
- **Logo/favicon:** `public/favicon.png` (already present on disk,
  provided by the Director). Do not regenerate, replace, or modify
  without explicit instruction.
- **Contact channel:** a Contact form on the site delivers to
  `ai-hero-studio@outlook.com`. No separate support alias.
- **Developer credit (2026-09-15, PDL-039 — amends the earlier "no
  public display of the admin email" clause):** `ai-hero-studio@outlook.com`
  is now shown publicly, alongside the brand name, in a small credit
  line fixed to the bottom-right corner of every page (`components/
  SiteCredit.tsx`, rendered site-wide including `/admin`) — this
  supersedes the prior blanket "no public display" rule, which stands
  only for any OTHER admin-facing address, not this one.

---

## P-16. Payment Integration — PayPal `[ACTIVE]` 🔴 CRITICAL

- **Provider:** PayPal. The Client ID is client-safe by PayPal's own
  design (it ships inside the frontend SDK script) and is not held
  to the same secrecy standard as a server-side secret. If a Client
  **Secret** is ever needed (e.g. for server-side payment
  verification), it is treated with the exact same discipline as
  `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY_*`: server-only,
  never logged, never pasted in chat with any ACA — see P-1 / E-4.
- **Flow:** trial (P-13) → on expiry, hard paywall → PayPal Checkout
  for the flat annual fee → on confirmed payment,
  `subscription_status` → `active`, `subscription_expires_at` set to
  +1 year from confirmation.
- **Ambiguous payment states never resolve silently.** If a webhook
  or confirmation step fails, times out, or returns an unexpected
  shape, the system must NOT assume success or failure — it flags
  the account for manual admin review (P-14). This is P-1's
  "fail loudly, never degrade silently" principle applied to money
  specifically, where the cost of a silent wrong guess is real
  financial harm to the Director or the user.
- **Sandbox before live, without exception.** All development and
  Sprint testing uses PayPal's sandbox/test-mode environment and
  sandbox credentials. Live-mode credentials are introduced only
  immediately before public launch, as its own reviewed step — never
  used for iterative development testing.
- Given real money is involved, this feature carries the same DoD
  rigor as the Gemini API key work (Sprint 05): secret-hygiene grep,
  no live-mode testing during development, and a Sprint scope
  document reviewed by the Director before implementation begins —
  not folded into an unrelated sprint.

---

## P-17. Seed Content Policy `[ACTIVE]` 🟡 STANDARD

- **No hand-authored or fabricated seed articles, ever — including
  for demos.** Initial content comes exclusively from the existing,
  already-verified pipeline (Source Collector → Duplicate Engine →
  Quality Engine → Classifier → AI Summary → Daily Report) running
  against real, configured sources for as many days as it takes to
  accumulate a presentable archive before public launch.
- This follows directly from P-3 (no hype, evidence-based judgment)
  and Commander M-4 (Anti-Hallucination Protocol) — inventing
  "example" articles to fill an empty state would violate both
  principles, even when the stated purpose is harmless (a demo, a
  screenshot, an investor preview).
- The empty-state Daily Report page (built in Sprint 01, P-1.3
  compliant) is the correct fallback for a launch day with sparse
  content — not synthetic filler.

---

## P-18. AI Provider Quota Strategy — Known, Accepted Risk `[ACTIVE]` 🔴 CRITICAL

- **The Gemini key-rotation strategy (8 keys, `GeminiProvider`,
  `lib/ai/gemini-provider.ts`) uses 8 separate Google accounts, each
  contributing one free-tier API key, specifically to multiply the
  per-account daily quota.** This is a **Google Terms of Service risk**,
  not merely an operational one — Google's API/Cloud terms generally
  prohibit creating multiple accounts to circumvent usage limits, and
  Google has a documented history of detecting and acting on this
  pattern. Full rationale and the Director's explicit risk acceptance
  are recorded in DECISION_LOG.md PDL-012 — this section states the
  policy consequence, PDL-012 carries the reasoning.
- **This is deliberate, not an oversight.** The Director reviewed the
  risk and chose to proceed. No ACA may "fix" this by unilaterally
  redesigning the key strategy, reducing the key count, or silently
  routing around it — any change to this approach is its own PDL
  proposal to the Director first (M-4/M-13: don't invent the
  resolution, don't quietly narrow scope either).
- **The failure mode this risk implies must never read like ordinary
  quota exhaustion.** If some or all of the 8 accounts are suspended,
  the resulting P-6 hold alert must say so explicitly and distinctly
  from "quota exhausted for today, try again tomorrow" — a suspension
  needs the Director's attention immediately; a quota exhaustion does
  not. (Implemented Sprint 06 follow-up:
  `GeminiKeysExhaustedError.reason`, the differentiated hold-reason
  text, and the `[URGENT]` email subject tag — see
  `corrections/SPRINT_05_LESSONS.md` addendum.)
- **Payment/subscription work (P-13, P-16) must not proceed past
  governance-only status until this risk is explicitly addressed in
  the Sprint 08 (PayPal) scope document** — either as a resolved
  prerequisite (e.g., a paid Gemini tier, or a single-account
  arrangement) or as a knowingly-accepted launch limitation, stated in
  that scope document, not silently carried forward. A paying
  subscriber depending on a Daily Report that could go dark because of
  a ToS-risk infrastructure choice is a materially different risk
  posture than an MVP with no paying users yet — this must be an
  explicit decision point at that sprint's kickoff, not an assumption.

---

## P-19. Vibe-Coding Assistant Chatbot — Shipped `[ACTIVE]` 🟡 STANDARD

- **Status (updated 2026-09-16, PDL-047):** shipped and live-verified —
  see `specs/prompt-blueprint-builder/` (SPEC/PLAN/TASKS) and
  `DECISION_LOG.md` PDL-046 (the decision to resolve this entry) and
  PDL-047 (what actually shipped + live verification). Live at
  `/assistant`, product-facing name "Vibe-Coding Assistant". The
  history below is kept for context; the two superseded decisions are
  marked explicitly rather than silently deleted.
- **No RAG, no vector database, no continuously-updated knowledge
  base.** Still stands, unchanged. The chatbot is a conversational
  agent (system prompt + conversation context), not a
  retrieval-augmented system querying an embeddings store.
- **Behavior (updated):** a structured wizard (not open-ended chat)
  that helps a Premium ($50-tier) subscriber go from a project idea to
  a copy-pasteable initial prompt for Claude Code or a similar AI
  coding assistant, styled on the Director's own book's "Blueprint"
  format. See `specs/prompt-blueprint-builder/SPEC.md` for the full,
  current scope — this entry no longer duplicates it.
- **Direct dependency on P-18 / PDL-012 (AI provider ToS risk) — still
  applies, now with concrete mitigation required.** `SPEC.md` makes an
  enforced per-user generation cap and visible usage/quota monitoring
  mandatory acceptance criteria, not optional polish, specifically
  because this feature's traffic pattern is materially riskier for the
  shared free-tier Gemini quota than the daily batch pipeline.
- **Prompt injection / input sanitization** — still required, now a
  mandatory `SPEC.md` acceptance criterion: the user's structured
  wizard answers must never be interpretable as instructions to the
  system prompt.
- **Cost monitoring** — still required, now a mandatory `SPEC.md`
  acceptance criterion.
- ~~**Commander as the chatbot's guidance engine (Director,
  2026-07-23).**~~ **Superseded 2026-09-16 (PDL-046):** the Director's
  own book, "Mastering Prompt Engineering — A Practical Manual for
  Advanced Non-Coders," is now the sole canon for the techniques and
  output format this chatbot produces — not Commander. Commander
  continues to govern how this *application itself* is built, as for
  every feature; it is simply no longer the chatbot's internal
  guidance engine. Journal content is still not queried/retrieved at
  runtime (consistent with the no-RAG decision above), since the book
  itself, not the article archive, is now the chatbot's knowledge
  source.

---

## P-20. Visual Design System — Swiss International Style `[ACTIVE]` 🟡 STANDARD

- **Formalized 2026-09-14** (design sprint opened) per `DESIGN_NOTES.md`'s
  own instruction to promote this from "early direction" to a
  Constitution rule once the design pass actually starts, not before.
  Chosen by the Director 2026-07-18; sequencing (after functional
  sprints 06–09 + Bookmarks/Archive) was also the Director's explicit
  choice ("ne žurimo nam se") and is now satisfied.
- **Full spec lives in `DESIGN_NOTES.md`** (verbatim `<role>`/
  `<design-system>` block) — this section is the decision record and
  pointer, not a duplicate. Do not paraphrase the spec elsewhere;
  always read it directly before design work.
- **Key tokens** (see `DESIGN_NOTES.md` for the complete system):
  `#FFFFFF`/`#000000`/`#F2F2F2` palette, `#FF3000` "Swiss Red" as the
  only accent, `0px` radius everywhere, no shadows/gradients (depth via
  low-opacity CSS pattern textures instead), Inter typeface,
  mechanical/snappy animation (150–300ms, ease-out, never spring/
  elastic).
- **Resolved 2026-09-14: Swiss Red (`#FF3000`) is the brand accent color
  for "Prompt Hero Studio™" (P-15)** — one consistent palette across
  UI and brand identity, not a separate branding-color decision. This
  closes the open question `DESIGN_NOTES.md` flagged under "How to use
  this when the design sprint starts," item 3.
- **Retrofit, not rebuild**: applies to the already-built pages first
  (home, register, login, dashboard, archive, bookmarks,
  admin/review-queue) as a styling pass over existing functionality —
  not a rewrite of application logic.
- **Prerequisite found 2026-09-14**: Tailwind CSS was never actually
  installed in this project (`package.json` has no `tailwindcss`/
  `postcss` dependency, no config file) despite nearly every component
  being written with Tailwind utility class names since Sprint 1 — the
  live compiled CSS bundle was 479 bytes, a hand-written reset only,
  with zero effect from any `className` anywhere in the app. This is a
  build-pipeline fix, prerequisite to this section, not itself a design
  decision — tracked in `DECISION_LOG.md`.
- **Gamification layer** (coin rewards, celebration screens, streaks,
  levels — Director's 2026-09-14 brief) shipped across Waves 1-2
  (PDL-030, PDL-044) as a **separate, additional** layer on top of this
  design system, not itself part of the Swiss spec above. Everywhere
  it appears OUTSIDE the celebration moment itself (`CoinBalance`,
  `CoinToast`, the mascot's own idle state) stays fully Swiss —
  rectangular, flat, mechanical motion, functional-only red, gold/
  yellow reward color additive, not a palette replacement.
- **Controlled juicy deviation, celebration layer ONLY (2026-09-16,
  Director-confirmed, PDL-045)**: `components/rewards/
  CelebrationOverlay.tsx` is the one deliberate, scoped exception to
  this section's own rules — permitted there and nowhere else: soft
  glow/bloom, spring/overshoot motion
  (`cubic-bezier(.34,1.56,.64,1)`), richer animated light rays and
  confetti. The exhaustive list of what's permitted and why lives in
  PDL-045, not duplicated here — read that entry before touching this
  component or extending the deviation elsewhere. The card's own shape
  stays radius-0/`border-4`/Swiss palette regardless — the deviation is
  motion and glow, never geometry. The brand mascot
  (`components/rewards/Mascot.tsx`) is now the real `public/
  favicon.png` logo, rendered with genuine perceived depth via a real
  CSS layered-extrusion technique (not an AI-rendered asset — no
  image-generation tool is available in this environment, confirmed
  and disclosed to the Director before implementing, per PDL-045).

---

## P-21. Backend Health — Priority Zero, Standing Duty `[ACTIVE]` 🔴 CRITICAL

- **Director's directive (2026-09-16, verbatim):** "Backend je nulti
  prioritet. Imaš zadatak da konstantno pregledavaš backend i tražiš
  moguće greške i najbolje načine za unapređenje backenda." (The
  backend is priority zero. You have a standing task to constantly
  review the backend and look for possible errors and the best ways to
  improve it.) This ranks above feature work, not alongside it — when
  backend health is in question, resolve that first.
- **Prompted by a real finding, not a hypothetical:** the same day,
  a direct audit (not a self-report) found a full-day production
  outage (`daily_reports` had zero rows for 2026-09-15 —
  `FUNCTION_INVOCATION_TIMEOUT` on every real invocation, PDL-043) that
  had gone unnoticed through several turns of "everything's fine"
  summaries built from memory rather than fresh evidence. The standing
  duty exists specifically to prevent that gap from recurring.
- **What "review" means in practice, per this project's own established
  discipline** (same pattern as every fix logged in `DECISION_LOG.md`
  this session): real evidence over assumption — `gh run list`/`gh run
  view` on every scheduled workflow, direct SQL against production for
  data gaps or anomalies, live endpoint checks, `git status` for
  uncommitted work, the full verification chain (naming-discipline
  grep → `tsc --noEmit` → `vitest run` → `npm run build`) before
  claiming anything fixed. A status report built from memory of a prior
  session's summary is not a review.
- **Scope**: cron/workflow health (daily-digest, university-generate,
  hold-gate-calibration, CI, project-guard), database anomalies
  (missing rows, zero-count reports, orphaned data), auth/payments
  integrity, AI-provider quota/key health, git-hygiene (uncommitted
  deploys), and anything else that affects whether the system is
  actually working versus appearing to.
- **Not yet resolved, per this directive's own founding audit
  (PDL-043)**: the `MAX_ARTICLES_PER_QUALITY_RUN` 40→20 revert had not
  yet been confirmed under a real target-hour invocation as of this
  rule's writing — check `DECISION_LOG.md` for whether that's since
  closed.
- **2026-09-13's zero-article report anomaly — resolved same audit**:
  zero articles were collected in the ~26.5h window before that report
  ran; the 2905-article burst that day arrived later, matching the
  already-known PDL-027 backlog-discovery event. Not a bug, just
  report-timing relative to a one-time event. Also found and fixed the
  same pass: `university_generation_runs` was the only public table
  missing RLS (migration 014 oversight) — enabled, zero behavior
  change (service-role-only access path).
- **Automation cadence — resolved 2026-09-16 (Director, AskUserQuestion):**
  not a standing background/scheduled process. Backend health review is
  the **first step of every session that touches this project** — see
  `CLAUDE.md`'s session-start checklist. No token cost when no session
  is active; the review actually happens every time real work starts.

---

*Vibe-Coding Journal — Project Constitution v0.1 — draft, pending
Director review before first sprint.*
