# DECISION_LOG.md — Vibe-Coding Journal
# Project-level technology decisions
# Inherits: Commander/DECISION_LOG.md (universal decisions, DL-001 through DL-010+)

---

> This document records WHY we chose specific technologies and patterns
> for THIS project specifically, on top of (or overriding) Commander's
> universal DECISION_LOG.md. Never deleted. Superseded entries marked
> `[SUPERSEDED]`, never removed.
>
> Numbering: project-level decisions use prefix `PDL-` to avoid
> collision with Commander's own `DL-` numbering.

---

## PDL-001 — AI Provider: Deferred, Provider Interface Mandatory `[RESOLVED 2026-07-18 → see PDL-006]`

**Date:** 2026-07-18
**Decision:** Do NOT default to Gemini (Commander DL-005) without
review. Build `lib/ai/ai-provider.ts` as a genuine swappable interface
from the first sprint that touches it. The concrete provider (Gemini,
Claude, or another) is an open decision, to be resolved no later than
the sprint implementing the Quality Engine / AI Summary pipeline stage.

**Rationale:** The Director explicitly deferred this choice rather
than accepting the Commander default outright. Editorial voice
requirements for this project (CONSTITUTION.md P-3 — no hype language,
consistent depth-adaptive tone, structured `why_it_matters` /
`worth_trying` fields) are unusually strict for a general-purpose
default and may favor a specific model's steerability. Locking in a
provider before that stage risks a rebuild if steerability proves
insufficient.

**Upgrade path:** When resolved, this entry gets superseded with the
chosen provider, model string(s), and rationale, following the format
of Commander's own DL-005.

---

## PDL-002 — Stack: Commander Default, No Deviation

**Date:** 2026-07-18
**Decision:** Use Commander's default stack as-is: Next.js + Supabase
+ Vercel. No M-16 stack deviation invoked.

**Rationale:** Greenfield project, no inherited codebase. No reason
identified to depart from the proven default (see Commander DL-001,
DL-003, DL-004, DL-008 for the underlying reasoning, which applies
unchanged here).

**Note:** The unattended cron-driven pipeline layer (Source Collector,
Duplicate Engine, Quality Engine, Classifier, Summary, Daily Report)
is architecturally distinct from Commander's five-layer HTTP-cycle
model and is documented as an explicit extension in project
CONSTITUTION.md P-9, not a stack deviation.

---

## PDL-003 — Duplicate Detection: Cosine Similarity Threshold

**Date:** 2026-07-18 (Sprint 02)  
**Decision:** Set initial similarity threshold at 0.85 for fuzzy duplicate detection (Duplicate Engine, feature/pipeline/domain.ts).

**Rationale:** 
- 0.85 provides high confidence in similarity while allowing minor variations (title rewordings, summary edits)
- Below 0.85: too many false negatives (real duplicates slip through)
- Above 0.90: too many false positives (legitimate related articles marked as duplicates)
- Starting point based on industry practice; tunable via constant `SIMILARITY_THRESHOLD`

**Tuning guidance (future sprints):**
- If duplicate duplicates are not caught: increase to 0.90 (stricter)
- If legitimate related articles are over-deduplicated: decrease to 0.80 (looser)
- Threshold is a constant in `features/pipeline/domain.ts`, not hardcoded in algorithm

**Current implementation:**
- Hash-based exact match: O(1) lookup, 100% confidence
- Similarity-based fuzzy match: Jaccard similarity on word-level tokenization (MVP; production would use embeddings)
- Applied during `/api/cron/daily-digest` phase 2 (Duplicate Engine)

---

## PDL-004 — Confidence Threshold: 0.6 for Review Gate

**Date:** 2026-07-18 (Sprint 03)  
**Decision:** Set minimum confidence threshold at 0.6 (60%) for auto-publish. Articles below 0.6 are held for review.

**Rationale:**
- 0.6 is conservative for MVP: catches ~50% of new articles for human review
- Too low (<0.5): risky, more hype/low-quality content auto-published
- Too high (>0.7): excessive review queue burden, slows publication
- Baseline scoring starts at 0.5, individual factors add/subtract 0.1
- Starting point based on editor preference; tunable via constant `CONFIDENCE_THRESHOLD` in features/pipeline/quality-engine.ts

**Tuning guidance (post-launch):**
- Collect 2 weeks of production data
- Analyze approval/rejection patterns
- If >80% of reviews result in approval: lower to 0.55 (more auto-publish)
- If >30% of reviews result in rejection: raise to 0.65 (more manual review)
- Threshold is a constant, not hardcoded in algorithm

**Current implementation:**
- Applied during `/api/cron/daily-digest` phase 3 (Quality Engine)
- Hype-word filter is a separate gate (also holds articles regardless of confidence)
- Both gates feed into review_status = "held_for_review" if either triggers

---

## PDL-005 — Scheduler: Vercel Cron (Decision Pending Implementation)

**Date:** 2026-07-18 (Sprint 04)  
**Decision:** Use **Vercel Cron** for automated `/api/cron/daily-digest` execution.

**Rationale:**
- **Platform-native** (E-5: Vercel deployment = Vercel scheduler)
- **Zero external dependencies** (no third-party cron service)
- **Declarative** (cron config in vercel.ts, version-controlled)
- **Reliable** (Vercel infrastructure, AWS-backed)
- **Observable** (Vercel dashboard shows cron invocations + logs)
- **No cost** (included with Vercel platform)
- **Limitation:** Vercel projects only (acceptable given PDL-002 stack commitment)

**Alternative considered:**
- GitHub Actions: Works, but adds CI/CD coupling
- External service (EasyCron, etc.): Adds external dependency, cost

**Implementation:** 
- Create `vercel.ts` at project root with cron config
- Schedule: 9 AM UTC daily (adjustable per timezone needs)
- Cron calls `/api/cron/daily-digest` with Bearer token auth (CRON_SECRET)

**Current status:** Pending implementation in Sprint 04

---

## PDL-006 — AI Provider Resolved: Gemini (Commander default, no deviation)

**Date:** 2026-07-18 (resolves PDL-001)
**Decision:** Adopt **Google Gemini** as the concrete AI provider behind the
`lib/ai/ai-provider.ts` interface. This aligns with the Commander default
(DL-005); no M-16 stack deviation is invoked.

**Rationale:**
- PDL-001 deferred the choice to protect P-3 editorial voice quality. On review,
  the Director elected to take the Commander default rather than deviate — Gemini
  has a usable free tier and is the proven default, and the swappable
  `AIProvider` interface (built in Sprint 01) keeps the cost of switching low if
  steerability proves insufficient later.
- The provider abstraction stays mandatory: no pipeline stage may import a vendor
  SDK directly; all calls go through `getAIProvider()`.

**Implementation notes (for the sprint that wires AI Summary — NOT yet done):**
- Concrete `GeminiProvider implements AIProvider` replacing `NoOpProvider`.
- Config via env: `AI_PROVIDER=gemini`, `GEMINI_API_KEY=...`, and a
  `GEMINI_MODEL` (exact model string to be confirmed against Google's current
  lineup at implementation time — do not hardcode a guessed version).
- The summarize stage must enforce P-3: strip/refuse hype words, produce
  `summary` + `why_it_matters` + `who_it_affects` + `worth_trying`, and respect
  the user's `depth_preference`. Output still passes through the existing
  hype-word filter before publish (and that filter must first be wired into the
  cron hold decision — see SPRINT_04_LESSONS finding #14).

**Status:** Decision made; implementation deferred to Sprint 05 (awaiting
Director go-ahead and `GEMINI_API_KEY`).

---

## PDL-007 — Daily Report Content Language: English (by design)

**Date:** 2026-07-18
**Decision:** Daily Report content — summaries, `why_it_matters`, and all
editorial-voice output — is **English**. `HYPE_WORDS` (P-3) and every P-3
example are English by design, not an oversight.

**Rationale:** Surfaced by a hype-hold test that used a mixed
Bosnian/English sentence — the filter caught the English term
("revolutionary") and would have missed a Bosnian-only equivalent
("revolucionarno"). Rather than silently expand `HYPE_WORDS` with guessed
Bosnian terms (M-4: no invented business logic), the Director confirmed
English as the deliberate output language for this MVP.

**Consequence:** If Bosnian (or any other language) Daily Report output is
ever needed, `HYPE_WORDS` and CONSTITUTION P-3 must be updated explicitly,
in the same change, before that language ships — not inferred by an ACA.

---

## PDL-008 — Payment Provider: PayPal

**Date:** 2026-07-18
**Decision:** PayPal is the payment provider for the flat annual
subscription (CONSTITUTION P-16). No alternative provider (Stripe, etc.)
evaluated or adopted.

**Rationale:** Director's explicit choice. No stack-deviation justification
needed (M-16 doesn't apply — this is a new integration, not a departure from
an existing default).

**Client ID / Client Secret handling:**
- The PayPal **Client ID** is client-safe by PayPal's own design — it ships
  inside the frontend SDK `<script>` tag and is not a server-side secret. It
  does not require the grep-audit/never-log discipline that
  `SUPABASE_SERVICE_ROLE_KEY` or `GEMINI_API_KEY_*` require.
- If a **Client Secret** is ever needed (server-side payment verification),
  it is held to the exact same standard as those keys: server-only env var,
  never logged, never pasted into chat with any ACA, covered by the same
  kind of secret-hygiene grep audit used in Sprint 05 (PDL-006 / SPRINT_05
  DoD).

**Sandbox-first rule (no exception):** all development and Sprint testing
uses PayPal's sandbox/test-mode environment and sandbox credentials.
Live-mode credentials are introduced only immediately before public launch,
as their own reviewed step — never used for iterative development or Sprint
DoD testing. This mirrors the Gemini dev/prod key separation principle
(SPRINT_05_LESSONS #7 / SPRINT_06 PDL, once logged): don't let development
activity touch production-consequence credentials.

**Ambiguous payment states:** per CONSTITUTION P-16, a failed/timed-out/
unexpected-shape webhook or confirmation never resolves as an assumed
success or failure — it flags the account for manual admin review. P-1
applied specifically to money: a silent wrong guess here is real financial
harm, not just a data-quality issue.

**Status:** Decision made; PayPal integration implementation is a future
sprint (Director-proposed: Sprint 08), with its own scope document before
any code — not folded into an unrelated sprint, per CONSTITUTION P-16's own
stated DoD rigor requirement.

---

## PDL-009 — Subscription Price: $10/year flat, no tiers

**Date:** 2026-07-18
**Decision:** Single flat price: **$10 USD per year**. No monthly option,
no feature tiers, no free-forever tier — one subscription, one price.

**Rationale:** Director's explicit choice, consistent with CONSTITUTION
P-13's "one tier only" rule. Simplicity over revenue optimization at this
stage — matches the project's broader MVP-first posture (no personalization,
no bulk admin actions, etc. — see prior sprint OUT-of-scope items) rather
than a special exception for pricing.

**Where this is used:** the PayPal Checkout flow (P-16) charges this exact
amount; `subscription_expires_at` is set to +1 year from confirmed payment
regardless of when in the trial or expired period the purchase happens (no
prorating logic — not specified, not to be invented).

**Consequence:** if the price ever changes, that is a new PDL entry (this
one gets marked `[SUPERSEDED]`, never deleted), not a silent edit to this
entry or to the PayPal integration code.

---

## PDL-010 — RBAC: Two Roles Only (user, admin) — No Superadmin Tier

**Date:** 2026-07-18
**Decision:** Exactly two roles: `user` and `admin` (already the `role`
enum shipped in Sprint 04 — `user_profiles.role`, migration 003). No third
"Superadmin" tier. The project's own operational admin account is simply
the first `admin` row — nothing schema-special distinguishes it from any
future admin account.

**Rationale:** Director's explicit choice (CONSTITUTION P-14). Keeps
authorization logic in `lib/permissions.ts` a single binary check
(`role === 'admin'`) rather than a hierarchy — less surface area for a
privilege-escalation bug, and nothing in the currently described feature
set ("advanced control" admin features per P-14 — block/grant/revoke
access, activation/reactivation, usage stats, AI provider key swapping)
requires a role above `admin`.

**Consequence:** all "advanced control" admin features build on the
existing two-role model incrementally, one sprint at a time (Commander
M-13) — a future sprint must not introduce a third role as a shortcut for
scoping one of those features; if that ever seems necessary, it is its own
PDL proposal to the Director first, not a code-level decision.

---

## PDL-011 — RSS/Atom Parsing: `rss-parser` Library (Second Instance of a Known Bug Class)

**Date:** 2026-07-18 (Sprint 06)
**Decision:** Adopt the `rss-parser` npm package (v3.13.0) to replace the
hand-rolled regex-based RSS parser in `features/sources/actions.ts`.

**Rationale:** Root cause confirmed by fetching and diffing real feed XML
(not guessed): `hnrss.org` wraps `<title>`/`<description>` in
`<![CDATA[...]]>`; the regex `/<title>([^<]+)<\/title>/` requires a
non-`<` character immediately after `<title>`, so it silently dropped
every hnrss item (deterministic, not flaky). `github.blog/feed/` doesn't
CDATA-wrap `<title>`, which is why it worked while hnrss consistently
failed. Considered `fast-xml-parser` (generic XML→JS, solves CDATA but has
no RSS/Atom awareness — item/entry and link normalization would still be
hand-written) vs. `rss-parser` (purpose-built: real XML parser under the
hood, and normalizes RSS 2.0 **and** Atom to the same output shape).
`rss-parser` solves both bugs (CDATA and RSS2/Atom structural differences)
in one library call; `fast-xml-parser` would only have solved the first.

**M-12 pattern note:** this is the **second instance** of the same
root-cause class — custom string/regex parsing standing in for a real
library — the first being the dedup self-match/RLS defect class from
Sprint 04 (see SPRINT_04_LESSONS findings #12–13). Logged explicitly so a
third instance of this class gets caught faster: when a hand-rolled parser
touches a well-established external format (XML, and by extension any
other standard wire format), prefer an established library over extending
custom string matching, even for a "just one more edge case" fix.

**Verified live (SPRINT_06 DoD):** hnrss.org feeds went from 0 articles
(documented bug) to 20 real articles each; github.blog regression-checked
at unchanged 10 articles; Atom + CDATA together verified via a realistic
Atom sample; parse-vs-fetch error message distinction verified against a
deliberately non-XML feed response.

**Process note:** the implementation commit (`9800bb0d`) referenced this
PDL as already logged before it actually was — this entry was written
immediately after as a follow-up commit, not by rewriting the prior
commit's message (PROCESS_LESSONS: no history rewrites, no exceptions).
Recorded here for accuracy, not to hide the ordering mistake.

---

*Vibe-Coding Journal — Project Decision Log — updated as decisions are made.*
