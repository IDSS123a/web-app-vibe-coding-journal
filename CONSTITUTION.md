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

- **One tier only.** Flat annual subscription. No feature tiers, no
  monthly option, no free-forever tier. Price and payment provider
  are recorded in DECISION_LOG.md (PDL), not hardcoded in this
  Constitution — see PDL entry for current published price.
- **Trial:** 3 days from registration timestamp, full feature access,
  no card required to start.
- **On trial expiry without an active subscription: hard block.** No
  access to Daily Report, Archive, or Bookmarks — redirect to a
  paywall/subscribe screen. No degraded "read-only" mode. This is a
  deliberate simplicity choice (Director's explicit decision) — do
  not invent a softer fallback.
- **Data model extension of P-4** (`UserProfile`):
  ```
  subscription_status    enum: trial | active | expired
  trial_started_at
  trial_ends_at
  subscription_expires_at
  ```
  This must be reflected in the P-4 schema block itself in the same
  change, per the existing P-12 Definition-of-Done rule — do not let
  this addendum be the only place this schema exists.
- **Admin accounts (P-14) are billing-exempt.** The exemption must be
  an explicit, auditable check (e.g. a named function in
  `lib/permissions.ts`), never an accidental side-effect of role
  logic living somewhere else. Per P-1, an undocumented bypass is
  exactly the kind of silent behavior this project exists to avoid.

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
- **Single contact channel:** a Contact form on the site delivers to
  `ai-hero-studio@outlook.com`. No public display of the admin email
  address elsewhere, no separate support alias, unless a future PDL
  changes this.

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

*Vibe-Coding Journal — Project Constitution v0.1 — draft, pending
Director review before first sprint.*
