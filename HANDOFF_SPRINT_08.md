# HANDOFF — Sprint 08 (PayPal Checkout Integration)

**Status:** ⏸ PAUSED — blocked on a PayPal sandbox **merchant/business
account** problem, not on this project's code. Per this sprint's own DoD,
the "live-verified against a real sandbox payment" items stay unchecked
until at least one sandbox payment actually succeeds — that has not
happened yet, so this sprint is not done, only paused pending the
Director's own investigation in the PayPal Developer Dashboard (most
likely a Negative Testing setting on the sandbox Business account). See
`sprints/SPRINT_08.md`'s Known Gaps section.

**No further code changes should be attempted for this specific problem.**
Everything already proven live — signature verification (both
directions), the `[PAYMENT ISSUE]` alert pipeline, and the two real bugs
found and fixed — is correct and should not be touched. **Once the
Director confirms the merchant-account issue is resolved, the next step
is simply to repeat the live test (order → approval → webhook →
activation) with the exact code already written — no code changes
expected to be needed.**
**Date:** 2026-07-27
**Commits:** feature code (`a43a362`), two live-bug fixes
(`5a2cc6f` capture-order, `827301d` DENIED→DECLINED), temp diagnostic
routes added and removed (`3cee5f5`…`f2d35d6`), governance docs (this
handoff + lessons + `sprints/SPRINT_08.md` updates).

---

## What shipped

1. **`payment_events` table** (`supabase/migrations/006_payment_events.sql`,
   applied by the Director) — idempotency + audit log for every PayPal
   webhook delivery, unique on `paypal_event_id`.
2. **`lib/payments/paypal-client.ts`** — raw-fetch PayPal REST client
   (OAuth token, create order, **capture order**, verify webhook
   signature). `PAYPAL_API_BASE` hardcoded to
   `api-m.sandbox.paypal.com` — switching to live mode requires an
   explicit code change, never a config toggle, per the sprint's hard
   gate.
3. **`POST /api/payments/create-order`** and **`POST
   /api/payments/capture-order`** — authenticated routes for the two
   halves of the PayPal Orders v2 flow.
4. **`POST /api/webhooks/paypal`** — signature-verified webhook receiver.
   Records the *actual* outcome of activation (not the predicted
   classification) so a DB failure never leaves the audit log claiming
   "processed" when nothing activated.
5. **`sendPaymentIssueAlert`** (`lib/email/resend.ts`) — separate
   `[PAYMENT ISSUE]`-prefixed alert path, distinct from the existing P-6
   review-queue emails.
6. **`SubscriptionGuard`'s paywall** now renders real PayPal Buttons
   (dynamically-loaded SDK) for both tiers, with `onApprove` calling
   capture server-side and polling `/api/me` for the webhook-confirmed
   state — never writing `subscription_status` client-side (Decision 2).

## Concrete proof (this session, live — not code review)

- **Order creation** — real sandbox order created via direct API call
  ($10, Basic tier, correct `custom_id` correlation).
- **Signature verification, both directions** — a deliberately bogus
  signature was genuinely rejected (`verified: false` from PayPal's own
  API); multiple genuine PayPal-signed webhook deliveries
  (`CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.DECLINED`) were genuinely
  accepted and correctly classified.
- **Real ambiguous-alert pipeline** — a real sandbox decline (before the
  DENIED→DECLINED fix) produced a real `[PAYMENT ISSUE]` email, confirmed
  received.
- **Three distinct secrets** — `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`,
  `PAYPAL_WEBHOOK_ID` confirmed as separate Sensitive-typed Vercel
  Production env vars, plus `NEXT_PUBLIC_PAYPAL_CLIENT_ID` for the
  client-safe SDK load.
- **Two real bugs found and fixed live** — see
  `corrections/SPRINT_08_LESSONS.md` findings #1 and #2.

### ⚠ Not achieved — genuine payment success / subscription activation

Two different sandbox buyer accounts (one with no configured funding
source, one with a full default bank+card funding set) both had their
real $10 capture attempt **declined** by PayPal's sandbox. Buyer funding
was ruled out. Root cause not identified within this sprint — most likely
the sandbox **business/merchant** account
(`sb-vdkwb49652610@business.example.com`) has some restriction or
limitation. This means:

- `PAYMENT.CAPTURE.COMPLETED` classification/activation code path is
  implemented and reasoned through, but has **never been exercised by a
  real successful payment**.
- The `subscription_status: active` write, `subscription_expires_at`
  calculation on a real confirmed payment, and the tab-close/late-webhook
  independence behavior are all **unverified** against real data.

**Director is investigating directly in the PayPal Developer Dashboard.**
Leading hypothesis: a **Negative Testing** setting on the sandbox
Business account (`sb-vdkwb49652610@business.example.com`) deliberately
forcing declines — a known PayPal sandbox feature, not a code defect.
No further code changes should be attempted for this specific problem
until the Director confirms what the account-side issue actually was.

---

## DONE_CHECKLIST

See `sprints/SPRINT_08.md` Definition of Done — most items checked with
live evidence above; the "Known Gaps" subsection lists what remains open,
explicitly and by name, not silently.

---

## Explicitly NOT done here (by design)

- **Live-mode PayPal credentials or any live-money path** — untouched,
  per P-16/the sprint's hard gate. `PAYPAL_API_BASE` stayed hardcoded to
  sandbox throughout.
- **Pricing changes, tier upgrade/downgrade, Archive/Bookmarks pages,
  chatbot, contact form** — all explicitly out of scope per
  `sprints/SPRINT_08.md`, unchanged from that scope document.
- **Root-causing the sandbox merchant-account decline** — the Director's
  own investigation, not an ACA code task (see above).

---

## Next Steps

1. **Director** investigates the sandbox Business account directly in the
   PayPal Developer Dashboard (Negative Testing setting is the leading
   hypothesis). No code changes should be attempted for this from the ACA
   side until that's confirmed.
2. Once the Director confirms the account-side issue is resolved: **repeat
   the exact same live test** (order → approval → webhook → activation)
   using the code already written, no changes expected. This re-run
   either checks off the remaining DoD items (real `PAYMENT.CAPTURE.COMPLETED`
   → `subscription_status: active` with correct
   `subscription_expires_at`/`subscription_tier`; Premium tier
   click-through; tab-close/late-webhook independence) or surfaces a new,
   different finding if something still doesn't work.
3. Live-mode launch prep (separate, explicitly reviewed step per the hard
   gate) remains untouched and un-scheduled.

---

*Vibe-Coding Journal — Sprint 08 — governed by Commander v1.2.*
