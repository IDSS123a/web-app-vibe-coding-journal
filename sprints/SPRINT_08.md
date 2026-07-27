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
free/testing-only phase — a materially different risk posture. **This
document does not resolve it below — Decision 1 asks the Director to.**
Per the Constitution's own rule, this sprint may not proceed past scope
status until that decision is made, one way or the other.

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

1. **P-18/PDL-012 resolution for this sprint — required by the
   Constitution before this sprint can proceed past scope status.**
   Resolved prerequisite (e.g. a paid Gemini tier or single-account
   arrangement, actioned before Sprint 08 code begins) — or a
   knowingly-accepted launch limitation (real subscribers depend on
   pipeline uptime that carries a real, if so-far-unrealized, Google ToS
   suspension risk)? 📌 No recommendation offered here deliberately —
   this is exactly the kind of institutional-policy, real-money-risk
   decision M-4/M-13 says isn't the ACA's to invent or nudge.
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

- [ ] Decision 1 (P-18/PDL-012) explicitly answered and recorded before
      any code is written — the Constitution gate itself, not just this
      sprint's own preference
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
("ne implementiraj ništa dok ne vidim i odobrim scope").** All three
Decisions above, especially Decision 1, need an explicit answer before
implementation begins.

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
