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
role                   enum: user | admin — default 'user' (Sprint 04)
tools_used             (multi-select, P-2)
depth_preference        (single-select, P-2)
other_tools_freetext    (P-2a, internal only)
saved_articles          (bookmarks, many-to-many with Article)
```

*Sprint 04 addition (why):* `role` was added to gate the admin Review
Queue (P-6). Authorization is read from this DB column at request time,
not from a token claim (M-7: the database is the single source of truth
on who is an admin, so access can be revoked immediately). Default is
`user`; only an explicit promotion grants `admin`.

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

*Vibe-Coding Journal — Project Constitution v0.1 — draft, pending
Director review before first sprint.*
