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

## PDL-009 — Subscription Price: $10/year flat, no tiers `[SUPERSEDED 2026-07-19 → see PDL-014]`

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

## PDL-012 — AI Provider Quota Strategy: Multi-Account Key Rotation — Known ToS Risk, Consciously Accepted

**Date:** 2026-07-18 (Sprint 06 follow-up)
**Decision:** The Director consciously decided to continue using the
existing 8-key Gemini rotation strategy (`GEMINI_API_KEY_DEV_1..8`,
`lib/ai/gemini-provider.ts`) — 8 separate Google accounts, each
contributing one free-tier API key, specifically to multiply the
per-account daily quota — despite an identified Google Terms of Service
risk. This is a **known, deliberate risk acceptance, not an oversight**.

**The risk:** Google's API/Cloud terms of service (see
`developers.google.com/terms` and `cloud.google.com/terms`) generally
prohibit creating or using multiple accounts to circumvent usage limits,
rate limits, or quotas. This is not a theoretical reading — Google has a
documented history of detecting and acting on this pattern. The Director
cited a known precedent: a multi-account quota-evasion case involving the
YouTube API that resulted in account-level action by Google. **This
specific incident is cited by the Director from their own knowledge; it
has not been independently verified against a primary source by this
assistant**, and is recorded here as the Director's stated basis, not as
an independently-confirmed fact — consistent with M-4 (don't assert
something as verified that wasn't).

**Director's explicit rationale (asked for directly, not inferred):**
this is **testing/development use only, not a permanent production
architecture**. The 8-account set exists to validate the pipeline
(Sprint 05/06) without paying for a Gemini tier before the product has
any paying users. It is not intended as the long-term AI provider
strategy once the product launches with real subscribers (P-13).

**Current key architecture (confirmed by Director 2026-07-18, resolves the
open question from the Sprint 06 dev/prod-separation work):** there is
currently **one** 8-account set, living under the `GEMINI_API_KEY_DEV_*`
env var names. `GEMINI_API_KEY_1..8` (the "prod" names) are intentionally
NOT populated in `.env.local` — this was a deliberate consolidation, not
an accidental loss of the original key values (an earlier factual concern
raised by this assistant, now resolved by this record). `loadApiKeys()`
in `lib/ai/gemini-provider.ts` was updated to fall back symmetrically in
both directions (prod→dev if no prod set exists, dev→prod if no dev set
exists) specifically so this single-set arrangement works correctly under
`VERCEL_ENV === "production"` too — without that fix, an actual production
deploy would have found zero keys and failed every AI call immediately.

**Mitigation implemented (Sprint 06 follow-up, this session):** because
account suspension is now a real, anticipated failure mode (not
hypothetical) rather than only ordinary quota exhaustion, the pipeline
distinguishes the two:
- `GeminiKeysExhaustedError.reason: "quota"` — ordinary daily rate-limit
  exhaustion across all 8 keys. P-6 hold message: *"...quota exhausted for
  today... No action needed; retry next scheduled run."*
- `GeminiKeysExhaustedError.reason: "suspected_suspension"` — at least one
  key in the rotation returned an auth/permission-denied signal (HTTP
  401/403, `PERMISSION_DENIED`/`UNAUTHENTICATED`, or Google's
  `API_KEY_INVALID` reason code — the last one verified live against the
  real API with a deliberately invalid key, returning HTTP 400 /
  `INVALID_ARGUMENT` with that specific reason; 401/403 are kept as
  defensive coverage for a genuinely suspended account, which could not be
  verified live for obvious reasons). P-6 hold message and email subject
  both escalate distinctly: *"All AI providers unavailable — possible
  account suspension..."* / `[URGENT — ACTION NEEDED]`.
- Verified end-to-end with a live test run (all 8 dev keys deliberately
  set invalid, restored byte-for-byte after): `aiSuspectedSuspension: true`
  propagated correctly through Quality Engine → Daily Report → email alert.

**Consequence — binding constraint on future work (CONSTITUTION P-18):**
payment/subscription implementation (P-13, P-16) must not proceed past
governance-only status until this risk is explicitly addressed in the
Sprint 08 (PayPal) scope document, either as a resolved prerequisite (a
paid Gemini tier, or a single legitimate account) or as a knowingly-accepted
launch limitation stated in that document — not silently carried forward
into a product with paying subscribers.

**No ACA may unilaterally "fix" this** by redesigning the key strategy,
changing the account count, or routing around it without a new PDL
proposal to the Director first.

---

## PDL-013 — Gemini Key Code Simplification: Remove Dev/Prod Branch (Follow-up to PDL-012)

**Date:** 2026-07-18 (Sprint 06, same day as PDL-012)
**Decision:** Remove the `VERCEL_ENV`-based dev/prod branching and the
`GEMINI_API_KEY_DEV_*` naming from `lib/ai/gemini-provider.ts` and
`lib/ai/init.ts`. `loadApiKeys()` now reads a single flat list,
`GEMINI_API_KEY_1..8`, unconditionally — no environment check, no
fallback direction, no second name prefix.

**Rationale:** PDL-012 established that there is exactly **one** 8-account
key set, used for both dev and (for now) production, by explicit Director
decision — not two sets that happen to be identical. Once that was true,
the `_DEV_`-named variant and its symmetric fallback logic (added earlier
the same day, before PDL-012 was written) became complexity serving no
real need: with only one set ever populated, the branch always resolved
to the same 8 keys regardless of which path it took. Worse, a
`GEMINI_API_KEY_DEV_*` secret sitting in the Vercel **Production**
dashboard — which is where it would have had to go, since the "prod"
names were empty — reads as a configuration mistake to anyone reviewing
that panel later (Director in six months, a future ACA, a future
collaborator), even though it wasn't one. Director's framing: "cijela DEV
oznaka i fallback logika su sad suvišna složenost koja postoji samo zbog
istorije zabune, ne zbog stvarne potrebe."

**No functional change.** `loadApiKeys()` previously fell back
prod→dev or dev→prod depending on `VERCEL_ENV`; since only the `_DEV_`
set was ever populated, every call already resolved to that same 8-key
set regardless of environment. This PDL removes dead branching, it does
not change which keys the app actually uses.

**Consequence:** the Vercel Production environment gets exactly
`GEMINI_API_KEY_1` through `GEMINI_API_KEY_8` — no `_DEV_` names anywhere,
matching what a reviewer would expect to see. If a genuinely separate
production key strategy is adopted later (per PDL-012's stated
precondition for payment/subscription work), that is its own new PDL and
its own env var naming decision — this entry does not pre-empt it.

---

## PDL-014 — Subscription Pricing: Two Tiers ($10 Basic / $50 Premium) — Supersedes PDL-009

**Date:** 2026-07-19
**Decision:** Replaces the single flat $10/year price (PDL-009,
`[SUPERSEDED]`) with two flat annual tiers, no monthly option:
- **Basic — $10 USD/year.** The product as built through Sprint 06:
  Daily Report, Archive, Bookmarks.
- **Premium — $50 USD/year.** Everything in Basic, plus the Vibe-Coding
  Assistant chatbot (CONSTITUTION P-19). Premium's **sole**
  differentiator is the chatbot — P-8 (Personalization Boundary: Daily
  Report content is the same for all users) is unchanged; Premium does
  not get a different content feed.

**Rationale:** Director's explicit decision, 2026-07-19, made when
scoping the future chatbot feature (P-19). Two tiers exist because the
chatbot has materially higher operating cost and risk than the base
digest product (see P-18/PDL-012 cross-reference below) and is valuable
enough to a subset of subscribers to price separately, rather than
folding its cost into a single raised price for every subscriber
including those who'd never use it.

**Explicitly not yet decided (do not infer, do not implement until a
future PDL resolves these):**
- Whether the 3-day trial (P-13) grants Premium-level access
  temporarily, or only Basic-level — open question for Sprint 07 scope.
- Upgrade/downgrade behavior mid-year (e.g. proration, credit) — same
  not-specified/not-invented discipline PDL-009 already established for
  the single-tier case; still applies, now for tier changes too.

**Cross-reference — this raises the stakes on P-18/PDL-012:** the
Premium chatbot will generate far higher, more visible AI API call
volume per user than the existing daily batch pipeline that PDL-012's
ToS risk was originally weighed against. P-18 already blocks
payment/subscription work from going live until the AI-provider-quota
risk is resolved or consciously re-accepted (Sprint 08 precondition);
this applies with materially higher urgency now that a chatbot —not just
a once-a-day cron job — is the thing that risk has to hold up under.

**Where this is used:** the PayPal Checkout flow (P-16) must charge the
tier-appropriate amount (not a single hardcoded price as PDL-009
originally assumed); `subscription_tier` (new P-4/P-13 schema field)
determines which. `subscription_expires_at` behavior (+1 year from
confirmed payment) is unchanged by this PDL.

**Consequence:** if pricing changes again, that is a new PDL (this entry
gets marked `[SUPERSEDED]`, never deleted) — same discipline PDL-009
established and this entry now continues.

---

## PDL-015 — Operations Timezone vs. Public Display Timezone: Deliberately Different, By Design

**Date:** 2026-07-19

**Decision:** The business's internal operations timezone (read only
from the `OPERATIONS_TIMEZONE` environment variable — set in
`.env.local`, gitignored, and in Vercel's private Production
environment variables; never hardcoded in any committed file, and its
specific IANA value is intentionally not written into this document
either, for the same reason) and the timezone shown to end users
(hardcoded `Europe/London`, freely usable anywhere including in
committed code and UI, since it is the intended public-facing value)
are deliberately different values. Both conversions use real IANA
timezone data (`Intl.DateTimeFormat`) so each stays correct across its
own DST boundary automatically, with no manual twice-yearly
maintenance:
- `lib/cron/schedule-gate.ts` gates the hourly-triggered
  `/api/cron/daily-digest` endpoint to the correct target local hour in
  the operations timezone.
- `lib/time/format-public-timestamp.ts` formats the report's real UTC
  generation timestamp into `Europe/London` local time (GMT/BST label
  included automatically) for display on the dashboard.

**Rationale:** Deliberate business-location-privacy decision — the
operations timezone is not the same as the publicly displayed
timezone, on purpose, so that the business's operating location cannot
be inferred from published timestamps. This is not a bug or an
oversight if the resulting gap between "when a report was actually
generated" and "what time zone it displays in" is ever noticed; it is
an intentional specification. The specific operations timezone value
is deliberately omitted from this document (a public, already-pushed
file) — recording *that* the two values differ and *why* is the
decision worth logging; recording *what* the operations value
literally is would defeat the purpose of making the decision in the
first place.

**Consequence:** any future code touching cron scheduling or
public-facing timestamp display must keep reading the operations value
only from `OPERATIONS_TIMEZONE` (never hardcode it, never let it reach
a user-visible string) while treating `Europe/London` as free to
hardcode. If this separation is ever removed, that is a new PDL
superseding this one, not a silent revert.

---

## PDL-016 — `REVIEW_QUEUE_EMAIL` cannot yet be the P-15 contact address — Resend sandbox restriction, verified live

**Date:** 2026-07-23

**Finding:** Director instructed that all application communication route
to `ai-hero-studio@outlook.com`, consistent with P-15's stated contact
channel. Attempted directly via a live Resend API call (not assumed):
Resend rejected it with `403 validation_error` — *"You can only send
testing emails to your own email address (mulalic.davor@outlook.com)."*
This is Resend's standard unverified-domain sandbox restriction: until a
domain is verified at resend.com/domains, delivery is hard-limited to the
account owner's own address.

**Decision:** `REVIEW_QUEUE_EMAIL` stays `mulalic.davor@outlook.com` for
now — the only address Resend will currently deliver to. Changing it to
`ai-hero-studio@outlook.com` was attempted, proven broken via a live send
attempt, and reverted the same session rather than shipped in a state that
would silently fail every P-6 review-queue alert going forward.

**Resolution path (not yet actioned):** verifying a domain with Resend
would lift this restriction and allow the P-15 address to be used for
real, including as the `RESEND_FROM` sender (currently
`onboarding@resend.dev`, itself only usable because no domain is
verified). Needs a Director decision on which domain to verify and DNS
access — out of scope to resolve unilaterally tonight.

---

---

## PDL-017 — P-0 relevance gate added to the content pipeline — CRITICAL fix, urgent

**Date:** 2026-09-11

**Finding:** Director reported real published off-topic content (an NTSB
aviation-accident update, a Navier-Stokes math post, a music-theory essay,
a NASA/Mars imaging piece, and an essay about keeping old cables) and
asked directly why it appeared. Investigation confirmed neither
`scoreArticleConfidence()` nor `classifyArticle()`
(`features/pipeline/quality-engine.ts`) ever checked topical relevance to
vibe-coding — the former scores generic source/freshness/length signals,
the latter classifies genre by keyword, and nothing upstream gated on
subject matter at all. A direct violation of CONSTITUTION.md P-0
(🔴 CRITICAL): *"It is not a general AI news aggregator... every piece of
content must pass one test: does this help someone who builds apps with
AI tools make a better decision today?"*

**Director directive:** "Pauziraj hold-gate rad, riješi ovo ODMAH kao
hitno" (pause hold-gate-calibration work, fix this now as urgent) —
implemented directly given the CRITICAL severity + explicit urgency, not
via the full specify/plan-feature/tasks ceremony used for the sibling
hold-gate-calibration feature.

**Decision:** Added `assessRelevance()` to the `AIProvider` interface
(`lib/ai/ai-provider.ts`, `lib/ai/gemini-provider.ts`), validated via
`assessRelevanceOutputSchema` (`lib/validation/schemas.ts`, E-2/
AUDIT-003), and wired into `runQualityEngine()`
(`app/api/cron/daily-digest/route.ts`) before scoring/classify/summarize
for each non-duplicate article. A judged-irrelevant article gets
`confidence_score = 0` — reusing the existing `CONFIDENCE_THRESHOLD`
filter in `getArticlesForDailyReport()` rather than a schema migration,
given the urgency — and skips classify/summarize entirely (saves Gemini
quota, consistent with the free-only principle already established for
hold-gate-calibration). The gate fails OPEN (treats an article as
relevant) on any assessment failure or unparseable response: a bad AI
day must never behave worse than the pre-fix status quo.

**Verification:** Live-tested against production via a temp route
(`app/api/temp-test-relevance/route.ts`, deleted after use) using the
Director's own five off-topic examples plus two genuine on-topic
examples. All seven judged correctly (5/5 off-topic → `isRelevant:
false`, 2/2 on-topic → `isRelevant: true`) after the key-rotation fix in
PDL-018 below (verification initially surfaced that unrelated bug, not a
flaw in this gate itself).

**Consequence:** Any future pipeline stage that scores or filters
articles must not assume relevance is already covered elsewhere — this
gate is the only place P-0 topical relevance is actually enforced.

---

## PDL-018 — Gemini key rotation must not abort on a 404 model-not-found key

**Date:** 2026-09-11

**Finding:** Found live while verifying PDL-017: key #3 of the 8
configured `GEMINI_API_KEY_*` values returns HTTP 404 `NOT_FOUND` for the
configured model, with Google's own message *"This model
models/gemini-2.5-flash is no longer available to new users. Please
update your code to use models/gemini-3.6-flash."* Keys #1/#2 were
merely rate-limited (expected under the free-tier 20/min cap) and keys
#4–#8 still worked. `classifyFailure()`
(`lib/ai/gemini-provider.ts`) only ever rotated past a 429 or an
401/403/`PERMISSION_DENIED`/`API_KEY_INVALID` response — a 404 fell into
the "surface immediately, do not rotate" branch, so *any* call whose
rotation reached key #3 before a working key failed outright, discarding
five perfectly good remaining keys. This affects every AI-provider call
(`summarize`, `classify`, `judgeHoldReason`, `assessRelevance`), not just
the new PDL-017 gate, any time keys #1–#2 happen to be rate-limited
first — a routine occurrence, not an edge case.

**Decision:** `classifyFailure()` now recognizes 404/`NOT_FOUND` as a
new `"model_unavailable"` kind (a per-key/project configuration
difference, not a malformed request — a genuine bad request would 404 or
400 identically on every key, so rotating past it is the correct
response, same reasoning already applied to rate limits). Added a third
`GeminiExhaustionReason`, `"model_deprecated"`, for the case where this
eventually happens on the *last* remaining key too — distinct from
`"quota"` (self-resolves by waiting) and `"suspected_suspension"` (an
account problem): a deprecated model needs a code/config change and will
not fix itself no matter how many times the run retries. Threaded through
`runQualityEngine()`/`generateDailyReport()` with its own accurate hold
reason ("Update GEMINI_MODEL; retrying will not resolve this on its
own") instead of being folded into the misleading "possible account
suspension" wording.

**Not decided here:** whether to migrate `GEMINI_MODEL` from
`gemini-2.5-flash` to `gemini-3.6-flash` (Google's own recommendation in
the 404 body) — a model/cost decision left for the Director, since it may
affect quota limits, pricing, or output quality in ways not verifiable
from inside this fix. Left as an open follow-up, not actioned
unilaterally.

**Consequence:** If a *different* key index starts returning 404 in the
future (e.g. a second project also loses access to the model), the same
rotation logic handles it without another code change — only total
exhaustion across all 8 keys now surfaces as `model_deprecated`, which
should be treated as urgent, not "wait for tomorrow's quota reset."

---

---

## PDL-019 — Batch-approved overnight sprint run, human sign-off gate explicitly waived by the Director

**Date:** 2026-09-11

**Context:** `corrections/SPRINT_04_LESSONS.md` finding #15 established a
standing project rule: *"Each sprint requires an independent review gate
before the next sprint may begin: a real-data (not synthetic) exercise
of the sprint's primary path, and a sign-off distinct from the
implementation pass. Multiple sprints MUST NOT be approved in a single
batch."* Tonight, after a backend quality audit, the Director approved
an entire sprint plan and full autonomous implementation in one
instruction, going to sleep: *"napravi plan sprintova i kreni sa
implementacijom... ja idem da spavam a ti sve slobodno završi u
pozadini. Dajem ti odobrenje."*

**Decision:** Proceed, but keep the half of the gate that doesn't
require the Director present: a genuine real-data verification of each
sprint's primary path before the next sprint begins (not synthetic/
mocked checks, not just `tsc`/`build`). The other half — an independent
human sign-off between sprints — is knowingly unavailable while the
Director sleeps, and is being skipped by the Director's own explicit,
informed choice, not silently dropped by ACA. Each sprint doc
(`sprints/SPRINT_10.md` onward, tonight) records this explicitly rather
than presenting a batch of sprints as if each had passed a normal gate.

**Consequence:** Every sprint completed under this waiver should be
treated as provisionally done until the Director actually reviews it
awake — same as the original finding #15 rationale ("DONE is
provisional until the gate passes on real inputs"), just with the human
half of that review deferred to morning instead of skipped forever. If
a real defect is found in Director review, treat it as this gate finally
running, not as a process failure — the process is doing exactly what
the waiver anticipated.

---

---

## PDL-020 — Hold-Gate Calibration suggestion-status PATCH now returns real 404s

**Date:** 2026-09-11

**Finding:** `updateSuggestionStatus`
(`features/hold-gate-calibration/repository.ts`) PATCHing a nonexistent
suggestion id silently returned `200 {success:true}` instead of `404` --
diagnosed via a live browser test against a real admin session with a
deliberately-bogus UUID, before the P-0 relevance-gate emergency
interrupted this feature's implementation. Supabase's
`.update().eq("id", suggestionId)` does not error on zero matching
rows, and neither the function nor the route checked whether a row was
actually affected.

**Decision:** `.select().maybeSingle()` appended after the update --
`data` is `null` iff nothing matched, which zero matching rows cannot
otherwise signal. A new `SuggestionNotFoundError` is thrown in that
case and translated to a real `404` by the PATCH route
(`app/api/admin/hold-gate-calibration/suggestions/[id]/route.ts`).
Re-verified live 2026-09-11 against production: the same bogus UUID now
returns `404` with a clear message; a disposable test suggestion row
PATCHed successfully returns `200` and the database genuinely reflects
the change (checked directly, not assumed from the response body).

**Consequence:** Any future PATCH/DELETE-by-id route in this codebase
built the same way (`.update().eq(...)` or `.delete().eq(...)` with no
`.select()` afterward) should be checked for the same class of bug --
Supabase's client does not treat "zero rows matched" as an error by
default.

---

## PDL-021 — Hold-Gate Calibration: free-only Gemini call constraint (retroactively logged)

**Date decided:** 2026-09-11 · **Date logged here:** 2026-09-11 (same
day, but genuinely missed as its own `DECISION_LOG.md` entry when
`specs/hold-gate-calibration-learning/PLAN.md` was written — found while
closing out TASKS.md Step 11 during Sprint 11)

**Finding:** Director's instruction on Gemini cost for this feature:
*"Samo besplatno rješenje dolazi u obzir"* (only a free solution is
acceptable).

**Decision:** The system never re-judges a hold-reason occurrence
already judged by a prior run. Each run only calls `judgeHoldReason` for
occurrences from reports not yet covered by an existing
`hold_gate_calibration_findings` row (later hardened further by
migration 008's dedicated scan-tracking table -- see the `getReportsNotYetJudged`
JSDoc in `features/hold-gate-calibration/repository.ts` for the real bug
that first version had). A run with nothing new to judge makes zero AI
calls -- a normal outcome, not an error. This bounds the feature's
Gemini usage to genuinely new content only, for its entire lifetime,
satisfying the free-tier constraint by construction rather than by
monitoring usage after the fact.

**Consequence:** Any future change to this feature that would cause a
report to be re-judged (e.g. "re-scan everything" as an admin action)
needs a fresh, explicit decision -- this constraint is load-bearing for
staying within the free tier, not an incidental detail.

---

## PDL-022 — P-11 "Monthly Self-Audit" does not exist anywhere in this codebase (retroactively logged)

**Date decided:** 2026-09-11 · **Date logged here:** 2026-09-11 (same
day; see PDL-021's note on why this is retroactive)

**Finding:** While scoping the Hold-Gate Calibration feature's cadence
(Director wanted it "tied to the existing Monthly Self-Audit cadence"),
checked the actual codebase: no code anywhere implements P-11 (source
usage, review-queue volume, engagement signals, monthly cadence). It is
CONSTITUTION.md text with no implementation -- the same class of gap as
the dashboard-wiring bug found and fixed earlier the same day (real
behavior silently not matching what the governing docs describe).

**Decision:** Hold-Gate Calibration does not attempt to build P-11
broadly -- out of this feature's explicit scope (M-4: don't expand scope
to fix an unrelated gap discovered along the way). Instead it ships its
own narrow, independent monthly GitHub Actions trigger
(`.github/workflows/monthly-hold-gate-calibration.yml`), reusing the
exact pattern already proven reliable for the daily digest cron.

**Consequence:** If/when P-11 itself is ever built as its own feature,
this workflow should be folded into it rather than staying a separate
monthly trigger forever -- noted here so that consolidation isn't
forgotten. Until then, "P-11 monthly self-audit" in
`CONSTITUTION.md` should be read as aspirational for everything except
this one narrow calibration slice.

---

---

## PDL-023 — "Vibe-Coding Intelligence & Knowledge Engine" mandate reconciled against P-19/PDL-021

**Date:** 2026-09-13

**Finding:** Director pasted a 50-section mandate proposing to evolve
the Journal into a trust-scored, evidence-classified knowledge engine
feeding a chatbot with 100+ sources. Checked against this project's own
recorded state before planning anything (M-4): the mandate's Phase 13/
24-29 assume a chatbot querying a live knowledge base at runtime, and
propose 100+ sources with per-claim evidence cross-checking.

Two direct conflicts with already-recorded decisions:
1. `CONSTITUTION.md` P-19 (2026-07-23, the Director's own decision): no
   RAG, no vector database, the not-yet-built chatbot receives verified
   content only via system-prompt injection, never live retrieval.
2. PDL-021 (free-only Gemini constraint) is already under real strain
   at 14 sources — one of 8 rotating keys lost model access this week
   (PDL-018). 100+ sources with per-claim AI verification would need
   materially more AI call volume than the free tier has room for.

**Decision (Director, 2026-09-13, asked directly rather than assumed):**
- P-19's no-RAG decision stands. The chatbot remains a separate, later,
  dedicated sprint — this mandate's ideas are applied to the Journal
  itself (better sources, evidence framing, event clustering, a
  restructured report format), not to a knowledge-graph/retrieval layer.
- Stay free-only. Grow the source directory gradually and individually
  verified, not as a 100+ bulk addition. No fixed source-count target
  is set.

**Resulting plan:** `specs/vibe-coding-intelligence-engine/ROADMAP.md`
— five phased sprints (Source Directory & Trust Score, Relevance Score
Upgrade, Evidence Framing, Event Deduplication, Daily/Weekly
Intelligence Format), each independently real-data-verified per
`corrections/SPRINT_04_LESSONS.md` finding #15. Knowledge-graph
entities, chatbot retrieval, cross-source AI verification, and an
alerts system are explicitly parked, not silently dropped.

**Consequence:** Any future proposal that reintroduces RAG/knowledge-
graph retrieval or a large source-count jump must explicitly revisit
this PDL and P-19/PDL-021, not treat either standing constraint as
already lifted.

---

---

## PDL-024 — Evidence framing added to P-3 editorial voice

**Date:** 2026-09-13

**Context:** Phase 3 of `specs/vibe-coding-intelligence-engine/ROADMAP.md`
("No marketing as fact," from the reconciled Intelligence Engine
mandate, PDL-023). The existing hype-word ban (P-3) blocks specific
banned phrases ("revolutionary," etc.) but does nothing about a vendor
stating an unverified benefit claim in plain, non-hype language (e.g.
"our new agent makes developers 5x faster") — P-3 as written would let
that through as stated fact.

**Decision:** `CONSTITUTION.md` P-3 extended with an evidence-framing
rule: a vendor's own unverified claim about their product's
performance/productivity/capability/benchmarks must be attributed
("The company reports...", "X claims...") rather than restated as
established fact. Applies only to the vendor's own evaluative claims
about impact — a factual report that a release shipped needs no hedge.
Implemented by extending the existing `summarize()` prompt's
`P3_SYSTEM_RULES` block (`lib/ai/gemini-provider.ts`) — no new AI call,
per the roadmap's explicit "folded into the existing summarize() call"
design.

**Consequence:** Any future editorial-voice rule addition should follow
the same pattern (extend `P3_SYSTEM_RULES`, not a separate AI call)
unless a genuinely new judgment is needed that summarize() can't
express in one pass.

---

---

## PDL-025 — Event Deduplication built on a dormant Sprint 02 engine, not from scratch

**Date:** 2026-09-13

**Finding:** Scoping Phase 4 (Event Deduplication/Clustering,
`specs/vibe-coding-intelligence-engine/ROADMAP.md`), found
`features/pipeline/domain.ts` already contained a complete
similarity-based duplicate-detection engine (`isDuplicate()`,
`cosineSimilarity()`, `SIMILARITY_THRESHOLD` with its own PDL-003 from
Sprint 02, 2026-07-18) — but `app/api/cron/daily-digest/route.ts`'s
`deduplicateArticles()` only ever called exact-hash matching
(`getArticleByHash`), never this engine. It had been dormant, unused,
since Sprint 02. A second dormant/broken function,
`findArticlesByTextSimilarity()` (`features/pipeline/repository.ts`),
took a `_text` parameter it never used — a stub that returned "recent
articles with a summary," not actual similarity-filtered results —
also never called anywhere.

**Decision:** Extended the existing engine rather than building a
parallel one (M-4 / this project's "adapt to existing architecture"
principle): `isDuplicate()` now also compares titles
(`TITLE_SIMILARITY_THRESHOLD = 0.5`, more lenient than the existing
summary threshold — titles are short, so a genuine cross-source match
on the same proper nouns rarely reaches 0.85 Jaccard overlap the way
near-identical summaries do). New `clusterDuplicateEvents()` groups a
batch of articles into events, canonical = earliest published. Wired
into `deduplicateArticles()` as a second pass after exact-hash dedup,
bounded to one cron run's newly-collected batch only (never an all-time
comparison — the unbounded-growth lesson from
`getArticlesForDailyReport`, fixed 2026-09-10, applied deliberately
here). The dead `findArticlesByTextSimilarity()` was deleted as part of
this same change — it is now genuinely superseded, not just unused.

**Consequence:** `duplicate_of` now means "same event," not only
"byte-identical republish." Report/dashboard/archive rendering shows
"Also covered by: X, Y" for a canonical article with clustered
duplicates (`getRelatedSourcesForArticles()`), so multi-source coverage
is surfaced, not silently hidden the way pure exact-hash dedup would
have hidden it.

---

---

## PDL-026 — Pre-P-0 reports hidden from public view; SubscriptionGuard correction; "delete without a trace" declined

**Date:** 2026-09-13

**Finding:** Director spotted a real off-topic article ("Music Theory
for the 21st-Century Classroom") live on the public dashboard and
asked why. Root cause: the article was never newly collected — it's
part of the 2026-09-10 report, generated the day *before* the P-0
relevance gate shipped (2026-09-11). The dashboard was showing it
because `getMostRecentPublishedDailyReport()` falls back to the most
recent `auto_published`/`manually_approved` report, and every report
since (09-11, 09-12, 09-13) is correctly `held_for_review` under the
new gate — nobody had reviewed them yet via `/admin/review-queue`, so
the 3-day-old pre-fix report kept surfacing as "the current digest."

**Audit performed** (Director: "provjeri ima li još sličnih
sadržaja"): checked every report with `review_status` in
`(auto_published, manually_approved)` — the only statuses a real
visitor can ever see. Found two more, both predating the P-0 gate by
even more: 2026-07-24 (73 articles, heavily off-topic — same unfiltered
Hacker News Front Page pattern: "Future euro banknote design
proposals," "The day Steve Jobs dissed me in a keynote," "Medici family
mystery," "Mickey Mouse Sells a Bundle," etc.) and 2026-07-20 (a dev
test artifact, `"# Email Test Report"`, never real content at all).

**Decision:** All three corrected to `review_status: 'rejected'` —
09-10, 07-24, 07-20. This is a status correction, not a content
rewrite: each report's row and its `markdown` are untouched, only
public visibility changes. Verified live: `/dashboard` now shows the
honest empty-state message, `/archive` shows "No past reports yet" —
nothing off-topic is reachable by a real visitor.

**Declined:** the Director's instruction to delete the offending
content "bez tragova" (without a trace). Two reasons, both explicit:
(1) this directly contradicts the Director's own earlier recorded
decision (2026-09-09/10) to keep the historical held/bloated reports
as records specifically so Hold-Gate Calibration and future audits can
learn from real history — permanently erasing the evidence undoes that
on its own authority; (2) permanently deleting data is outside what
this assistant does unilaterally, regardless of instruction, given how
irreversible it is. The status-correction above achieves the actual
goal (nothing objectionable is publicly visible) without destroying
anything. If the Director still wants a literal hard delete after
understanding this trade-off, that needs its own explicit, separate
confirmation — not inferred from "clean this up."

**Correction to an earlier same-day statement:** this session had
claimed "/dashboard has no paywall enforcement at all." That was
incomplete. `app/dashboard/layout.tsx` wraps the page in
`SubscriptionGuard` (`components/SubscriptionGuard.tsx`), a real,
functioning client-side gate — but because the wrapped page is a
Server Component whose full rendered output (including the actual
report text) is already part of the initial page payload before the
client-side check ever runs, the gate only controls what a real
browser *displays* by default; the underlying content is still present
in the page source/RSC payload and readable via `curl`, view-source, or
a browser with JavaScript disabled. `/archive` and `/bookmarks` have no
`layout.tsx` at all, so this doesn't apply there the same way (archive
truly has zero gating; bookmarks requires login for an unrelated
reason — it's inherently per-user data, not a subscription check).
Properly closing the paywall leak needs cookie-based SSR sessions
(`@supabase/ssr`) so a Server Component can check subscription status
before rendering real content at all — a real architectural change,
not a quick patch, and not undertaken here.

**Consequence:** Any report published before 2026-09-11 (when P-0
shipped) should be treated as unverified against the current relevance
standard by default — if one is ever manually approved or otherwise
surfaced again, re-check it against `RELEVANCE_THRESHOLD` first. The
paywall-leak finding above is a real, open item for a future sprint if
the Director wants gated content to actually be inaccessible to a
determined non-subscriber, not just hidden from the default UI.

---

## PDL-027 — Active production outage: five layered root causes, all fixed and live-verified

**Date:** 2026-09-14

**Finding:** `FUNCTION_INVOCATION_TIMEOUT` (300s) on the cron endpoint
(`/api/cron/daily-digest`), confirmed via 3+ consecutive real failed
runs in both `vercel logs` and `gh run view --log`. Not a single bug —
each fix uncovered the next bottleneck only after deploying and
re-testing live, in strict order:

1. `assessRelevance()`/`judgeHoldReason()` truncated by
   gemini-2.5-flash's internal "thinking" tokens eating
   `maxOutputTokens` before visible output — raised 512→2048.
2. `getNonDuplicateArticles()` (Quality Engine caller) had no `.limit()`
   — a backlog left by earlier failed runs made Quality Engine try to
   AI-score far more than one run could afford. Capped via
   `MAX_ARTICLES_PER_QUALITY_RUN` (tried 20, still timed out under
   Gemini's per-minute free-tier rate limit; lowered to 5, confirmed
   holding).
3. `features/sources/actions.ts`'s `parseFeed()` had a timeout that was
   cleared right after `fetch()` resolved (headers-only), not after the
   body was fully read — a single stalled source could hang Phase 1
   indefinitely. Fixed: `AbortController` stays armed through
   `response.text()`, plus a hard `withTimeout()`/`Promise.race` ceiling
   per source (`SOURCE_PROCESSING_BUDGET_MS=10000`).
4. `lib/ai/gemini-provider.ts`'s `callGeminiJSON()` had **no timeout at
   all** on its `fetch()` to Gemini — the exact same bug class as #3,
   just never fixed here. A single stalled Gemini response could burn
   the entire remaining budget regardless of how small the Quality
   Engine cap was. Confirmed live: a run capped to 5 articles still hit
   exactly 300s, its last log line a bare key-rotation warning with
   nothing after it. Fixed: 25s `AbortController` timeout, armed through
   the response body read, same lesson as #3.
5. **The actual dominant cost**, found only after #4 shipped and a run
   *still* timed out with zero rate-limiting involved:
   `deduplicateArticles()` called `getNonDuplicateArticles()` with no
   limit at all, despite its own comment claiming the batch was
   "typically tens of items." That was true only while the backlog
   stayed small. A direct count query (via a temporary authenticated
   diagnostic route, deleted immediately after use) found the *real*
   backlog was **2786 unscored articles**, not the 1000 the Dedup
   phase's own log line suggested — that number was just
   Supabase/PostgREST's default per-request row cap silently masking
   the true size. `clusterDuplicateEvents()` (`features/pipeline/
   domain.ts`) is O(n²) and its own doc comment explicitly warns it
   must never run against an all-time article set — it was receiving up
   to 1000 per run anyway. Fixed: `MAX_ARTICLES_PER_DEDUP_RUN=200`, same
   bounded-batch pattern as #2.

**Verified live, not assumed:** after all five fixes, a fresh triggered
run completed the full pipeline (`Pipeline completed in 114138ms`) —
Phase 1 collected 372 articles, Phase 2 deduped 200 (capped, working),
Phase 3 scored 5, Phase 4 generated a real report (20 articles,
`held_for_review` — correctly held on confidence, not a bug) and sent
the review-queue email. `gh run view` on the triggering workflow shows
`conclusion: success`.

**Process gap found while verifying:** this project has **no GitHub →
Vercel auto-deploy integration** — pushing to `main` does not trigger a
new Vercel deployment on its own. Every fix this session required an
explicit `vercel --prod` after the push, confirmed by two consecutive
pushes (homepage copy, then the Gemini timeout fix) sitting live on
GitHub for 10+ minutes with no corresponding new Vercel deployment
until manually triggered. Until this is wired up (or deliberately kept
manual), **a merged/pushed fix is not live until someone runs
`vercel --prod`** — worth remembering for any future session, and worth
asking the Director whether manual deploy is intentional or should be
automated.

**Open, not closed:** the real backlog (2786 at time of writing) will
now drain at up to 200/run for Dedup and 5/run for Quality Engine
(hourly), not instantly. `MAX_ARTICLES_PER_QUALITY_RUN` and
`MAX_ARTICLES_PER_DEDUP_RUN` are both explicitly documented as
conservative first values to revisit upward once several consecutive
runs are confirmed completing well under budget — do not raise either
without live evidence, per this incident's own repeated lesson.

---

*Vibe-Coding Journal — Project Decision Log — updated as decisions are made.*
