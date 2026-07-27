# SPRINT_08 — PayPal Checkout Integration
# Vibe-Coding Journal
# Status: CLOSED 2026-07-27 — partial DoD, closed by explicit Director decision (see Known Gaps + Approval Record)

---

## ⚠ Read this before anything else — the P-18/PDL-012 precondition

`CONSTITUTION.md` P-18 states this explicitly, as a hard gate on this
exact sprint:

> Payment/subscription work (P-13, P-16) must not proceed past
> governance-only status until this risk is explicitly addressed in the
> Sprint 08 (PayPal) scope document — either as a resolved prerequisite
> (e.g., a paid Gemini tier, or a single-account arrangement) or as a
> knowingly-accepted launch limitation, stated in that scope document,
> not silently carried forward.

The risk: the Gemini key-rotation strategy (8 free-tier keys across 8
Google accounts, `lib/ai/gemini-provider.ts`) is a Google ToS risk
(PDL-012), accepted so far because there were no paying subscribers
depending on it. Once real payment goes live, a paying subscriber's Daily
Report could go dark because of an infrastructure choice made for a
free/testing-only phase — a materially different risk posture.

**Director's resolution (2026-07-27), scoped precisely — see Decision 1:**
PDL-012 resolution is **knowingly deferred through this sprint's
sandbox/test phase only** — sandbox mode moves no real money, so the risk
during Sprint 08's own development and testing is low. **This is not a
permanent or general acceptance.** The P-18 gate stays fully open and
unresolved for actual live launch — PayPal LIVE mode may not be activated
until PDL-012 is either resolved (e.g. a paid Gemini tier) or
consciously re-approved *specifically for live launch*, as its own
decision, not inferred from this sandbox-phase deferral. This is encoded
as a hard-blocking Definition of Done item below, not just this
paragraph — see the DoD's live-mode gate item.

Pricing itself is unchanged and not open for renegotiation here — PDL-014
(two flat annual tiers, Basic $10 / Premium $50) stands as-is.

---

## Scope — IN

### 1. PayPal Checkout, sandbox only (P-16)

Wire the Sprint 07 paywall screen's "Subscribe" buttons (currently
disabled placeholders) to a real PayPal Checkout flow, for the
tier-appropriate flat annual fee (Basic $10 / Premium $50, PDL-014 — not
a single hardcoded price). **Sandbox/test-mode credentials only, without
exception, for all development and this sprint's own testing** — P-16's
explicit rule. Live-mode credentials are a separate, later, reviewed step
immediately before public launch, not part of this sprint.

### 2. Payment confirmation → subscription activation

**Webhook is the sole source of truth (Decision 2, resolved).** A PayPal
webhook (server-to-server, signature-verified) is what flips
`subscription_status` → `active`, sets `subscription_expires_at` to +1
year from confirmation, and sets `subscription_tier` to whichever tier
was purchased. The client-side redirect after checkout is **UX
confirmation only** — it may show the user a "thanks, activating…" style
message, but it never itself writes `subscription_status`. A user
returning to the site after checkout is not evidence of payment; a
verified webhook is. Reuses the Sprint 07 data model and
`SubscriptionGuard` unchanged — this sprint only adds the write path that
flips a blocked account to an unblocked one, and it's a server-to-server
path, not a client-triggered one.

### 3. Ambiguous payment states never resolve silently (P-1 applied to money)

P-16's explicit rule: if a webhook or confirmation step fails, times out,
or returns an unexpected shape, the system must not assume success or
failure — it flags the account for manual admin review (P-14).
**Mechanism (Decision 3, resolved): a separate, distinctly-labeled alert
path from the existing P-6 review-queue emails** — a `[PAYMENT ISSUE]`
subject-prefix pattern, mirroring PDL-012's existing `[URGENT]`
escalation precedent, not folded into or confused with content-hold
(held Daily Report) notifications. Different severity, different
audience expectation.

### 4. Secrets — three distinct credentials, same discipline as always

- **Client ID** — client-safe by design (ships in the frontend SDK
  script), not held to server-secret standards.
- **Client Secret** (if server-side payment verification needs it) —
  server-only, never logged, never pasted in chat with any ACA. Same
  discipline as `SUPABASE_SERVICE_ROLE_KEY` / `GEMINI_API_KEY_*`.
- **Webhook ID/Secret** (for signature verification on the webhook
  endpoint) — a **third, distinct** credential from Client ID/Secret, not
  the same value reused. Same never-echo, Sensitive-typed Vercel env var
  pattern already established for `CRON_SECRET` and every other secret
  this project handles: generated/obtained out-of-band, piped directly
  into `vercel env add` without ever appearing in a visible command or
  chat message, never hardcoded anywhere in committed code.

---

## Scope — OUT (explicitly, do not touch this sprint)

- **Live-mode PayPal credentials or any live-money testing** — a
  separate, later, explicitly reviewed step immediately before public
  launch, per P-16's own rule.
- **Pricing changes** — PDL-014 stands unchanged; this sprint is not an
  invitation to revisit $10/$50.
- **Upgrade/downgrade between tiers mid-year (proration, credit)** —
  still explicitly "not specified" per P-13/PDL-014, needs its own future
  PDL first.
- **Any change to the Gemini key-rotation / AI provider strategy itself**
  — whatever Decision 1 resolves, actually *changing* the infrastructure
  (e.g. moving to a paid Gemini tier) is its own separate body of work,
  not folded into "PayPal integration."
- **Archive / Bookmarks pages** — still don't exist as routes (Sprint 07
  handoff note); nothing to gate with payment status yet.
- **Chatbot (P-19), Contact form (P-15/Sprint 09)** — unchanged from
  Sprint 07's exclusions, still far-future / deferred.

---

## Decisions Needed (Director — not invented here, per M-4/M-13)

1. ~~**P-18/PDL-012 resolution for this sprint.**~~ **RESOLVED 2026-07-27
   (Director) — scoped narrowly, not a general acceptance:** PDL-012
   resolution is deferred through Sprint 08's **sandbox/test phase only**
   (no real money moves in sandbox mode, so the risk is low for
   development and testing purposes). **The live-launch question remains
   fully open** — PayPal LIVE mode must not be activated until PDL-012 is
   either resolved (e.g. a paid Gemini tier or single-account
   arrangement) or explicitly re-approved *specifically for live launch*,
   as its own dedicated decision at that time, never inferred from this
   sandbox-phase deferral. See the DoD's hard-blocking live-mode gate
   item — this is enforced there, not just stated here.
2. ~~**Payment confirmation mechanism.**~~ **RESOLVED 2026-07-27
   (Director):** webhook (server-to-server, signature-verified) is the
   sole source of truth for activation. Client-side redirect is UX
   confirmation only, never a trigger for writing `subscription_status`.
   See Scope IN item 2.
3. ~~**Ambiguous-payment admin alert.**~~ **RESOLVED 2026-07-27
   (Director):** a separate path from the existing P-6 review-queue
   emails, distinctly labeled (`[PAYMENT ISSUE]` prefix, mirroring the
   `[URGENT]` precedent from PDL-012), never mixed with content-hold
   notifications. See Scope IN item 3.

---

## Constitution References

- **P-18** (AI Provider Quota Strategy): the explicit precondition this
  entire sprint is gated behind — see the top of this document.
- **P-16** (Payment Integration — PayPal): this sprint's entire subject.
- **PDL-014** (DECISION_LOG.md): two-tier pricing, unchanged, cited not
  re-decided.
- **P-13** (Business Model — Subscription & Trial): the state machine
  this sprint's payment flow writes into, built in Sprint 07.
- **P-1** (fail loudly): applied specifically to money in P-16's
  ambiguous-state rule — a silent wrong guess here is real financial
  harm, not just a data-quality issue.
- **P-14** (Roles & Access Control): manual admin review is the fallback
  for anything payment confirmation can't resolve automatically.

---

## Definition of Done (draft — none of this is done yet)

- [x] Decision 1 (P-18/PDL-012) explicitly answered and recorded before
      any code is written — the Constitution gate itself, not just this
      sprint's own preference. Resolved for the sandbox/test phase only
      (2026-07-27) — see the hard-blocking live-mode gate item below,
      which this does NOT satisfy.
- [ ] **🔒 HARD GATE — PayPal LIVE mode is NOT activated.** No live
      Client ID, live Client Secret, or live-mode API call anywhere in
      this sprint's work. This item cannot be checked off by finishing
      sandbox development — it is only satisfied at the point of an
      actual future launch decision, made explicitly and specifically
      for live mode, never inferred from the sandbox-phase deferral
      above (Decision 1). Any future sprint/session proposing to flip
      sandbox → live must re-verify this item is still unchecked and
      treat checking it as its own explicit approval step, not a
      side-effect of unrelated work.
- [x] PayPal sandbox order creation live-verified against the real
      sandbox API (Basic tier, real order ID + approve URL returned).
      **Partial:** only Basic was click-tested end-to-end in a real
      browser; Premium ($50) was never separately click-tested.
- [x] Webhook signature verification actually implemented and
      live-verified — both directions, against real deliveries: a
      bogus/mock signature was genuinely rejected (401), and multiple
      genuine PayPal-signed events (`CHECKOUT.ORDER.APPROVED`,
      `PAYMENT.CAPTURE.DECLINED`) were genuinely accepted.
- [ ] **NOT DONE.** Confirmed payment (via verified webhook) correctly
      setting `subscription_status: active` was never live-verified — no
      real sandbox capture ever reached `COMPLETED` this sprint (see
      Known Gaps). The code path is implemented and unit-reasoned but
      unproven against a real success case.
- [ ] **NOT DONE.** Browser-tab-close / late-webhook independence was
      never explicitly tested this sprint — deprioritized once the
      capture-success gap (above) became the blocker.
- [x] A payment scenario (real sandbox `PAYMENT.CAPTURE.DECLINED`)
      genuinely produced a `[PAYMENT ISSUE]`-labeled alert, confirmed
      received in the inbox — before the DENIED→DECLINED fix, when this
      event type was still unrecognized. Not a *deliberately constructed*
      ambiguous case as originally envisioned, but a real one the system
      caught correctly and alerted on, exactly as designed.
- [x] Client ID, Client Secret, and Webhook ID/Secret confirmed as three
      distinct values, Sensitive-typed in Vercel Production
      (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`),
      plus `NEXT_PUBLIC_PAYPAL_CLIENT_ID` (same Client ID value,
      client-exposed by design per P-16).
- [x] No live-mode PayPal credential anywhere in this sprint's work —
      `PAYPAL_API_BASE` stayed hardcoded to
      `api-m.sandbox.paypal.com` throughout, never touched.
- [x] `tsc --noEmit` / `next build` clean at every commit.
- [x] Naming-discipline audit clean on every new/changed file before
      every commit.
- [x] `corrections/SPRINT_08_LESSONS.md` and `HANDOFF_SPRINT_08.md`
      created at close.

### Known Gaps (accepted by Director 2026-07-27, see Approval Record)

- **No genuine `PAYMENT.CAPTURE.COMPLETED` was ever achieved.** Two
  different sandbox buyer accounts (one with no configured funding
  source, one with a full default bank+card funding set) both had their
  $10 capture attempt **declined** by PayPal's sandbox. Buyer funding was
  ruled out as the cause. Root cause not identified — most likely
  something on the sandbox **business/merchant** account
  (`sb-vdkwb49652610@business.example.com`) side, not in this project's
  code. Follow-up: investigate that account's status/limitations in
  PayPal's Sandbox Accounts dashboard, or try a fresh business+buyer
  account pairing, before Sprint 09 or before live-launch prep.
- Premium tier and the tab-close/late-webhook independence check were
  never separately live-verified (deprioritized behind the capture-decline
  investigation above).

---

## Approval Record

**Approved 2026-07-27 (Director).** All three Decisions resolved:

1. PDL-012 — sandbox-phase deferral only; live-mode gate stays
   hard-blocked in the DoD, not satisfied by anything in this sprint.
2. Payment confirmation — webhook is the sole source of truth;
   client-side redirect is UX confirmation only.
3. Ambiguous-payment alert — separate, `[PAYMENT ISSUE]`-labeled path,
   distinct from the P-6 review-queue.

Implementation may begin. The hard-blocking live-mode DoD item remains
unchecked and stays that way for the entirety of this sprint — checking
it is never a side-effect of finishing sandbox work.

**Closed 2026-07-27 (Director), partial DoD, explicit decision:** after
live E2E verification surfaced and fixed two real bugs (missing order
capture call; `PAYMENT.CAPTURE.DENIED`→`DECLINED` event-name typo) and
hit a sandbox-side payment decline whose root cause sits outside this
project's code (see Known Gaps above), Director chose to accept the
evidence gathered so far — real signature verification proven in both
directions, real classification proven against genuine PayPal events,
real `[PAYMENT ISSUE]` alert delivery proven — rather than continue
chasing the sandbox decline within this sprint. The unproven "processed"
activation path is carried forward as an explicit, documented gap, not a
silent one. Live-mode hard gate remains unchecked, unaffected by this
closure.

---

## Handoff Note Template (fill at sprint end)

```
HANDOFF NOTE — Sprint 08
Completed: [...]
Not completed: [...]
Open risks: [...]
Technical debt: [...]
Next sprint: [...]
```

---

*Vibe-Coding Journal — Sprint 08 — governed by Commander v1.2*
