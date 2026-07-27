# SPRINT_08 — PayPal Checkout Integration
# Vibe-Coding Journal
# Status: SCOPE DRAFT — awaiting Director approval, no implementation started

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

On confirmed payment: `subscription_status` → `active`,
`subscription_expires_at` set to +1 year from confirmation,
`subscription_tier` set to whichever tier was purchased. Reuses the
Sprint 07 data model and `SubscriptionGuard` unchanged — this sprint only
adds the write path that flips a blocked account to an unblocked one.

### 3. Ambiguous payment states never resolve silently (P-1 applied to money)

P-16's explicit rule: if a webhook or confirmation step fails, times out,
or returns an unexpected shape, the system must not assume success or
failure — it flags the account for manual admin review (P-14). Exact
mechanism (reuse the existing P-6 review-queue/email-alert path, or a new
one specific to payments) is Decision 2 below, not assumed here.

### 4. Client ID / Client Secret handling

PayPal Client ID is client-safe by design (ships in the frontend SDK
script) — not held to server-secret standards. If a Client **Secret** is
ever needed (server-side payment verification), it gets the exact same
discipline as `SUPABASE_SERVICE_ROLE_KEY` / `GEMINI_API_KEY_*`:
server-only, never logged, never pasted in chat with any ACA.

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
2. **Payment confirmation mechanism:** PayPal webhook (server-to-server,
   more reliable, needs a public endpoint + signature verification) vs.
   client-side redirect/capture confirmation (simpler, but a closed
   browser tab mid-flow is a real ambiguous-state case per item 3 above)
   vs. both? Affects the actual implementation shape significantly.
3. **Ambiguous-payment admin alert:** extend the existing P-6
   review-queue/email mechanism (`lib/email/resend.ts`,
   `sendReviewQueueAlert`) to cover payment anomalies, or build a
   separate, distinctly-labeled alert path? A payment ambiguity and a
   held Daily Report are different severities/audiences.

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
- [ ] PayPal sandbox Checkout wired to both tiers' correct flat annual
      fee — live-verified with real sandbox transactions, not mocked
- [ ] Confirmed payment correctly sets `subscription_status: active`,
      `subscription_expires_at` = +1 year, correct `subscription_tier`
      — live-verified against a real sandbox payment, not just code
      review
- [ ] A deliberately-broken/ambiguous payment scenario (sandbox) verified
      live to produce a flagged-for-review state, never a silent
      guess either way
- [ ] No live-mode PayPal credential anywhere in this sprint's work
- [ ] `tsc --noEmit` / `next build` clean
- [ ] Naming-discipline audit clean on every new/changed file before
      commit
- [ ] `corrections/SPRINT_08_LESSONS.md` and a handoff note created at
      close

---

## Approval Record

**Not yet approved — scope draft only, per explicit Director instruction
("ne implementiraj ništa dok ne vidim i odobrim scope").** Decision 1
resolved 2026-07-27, narrowly (sandbox/test phase only — the live-mode
question stays open, enforced by the hard-blocking DoD gate). Decisions 2
and 3 still need an explicit answer before implementation begins.

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
