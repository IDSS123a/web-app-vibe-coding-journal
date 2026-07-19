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

*Vibe-Coding Journal — Project Decision Log — updated as decisions are made.*
