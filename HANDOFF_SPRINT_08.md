# HANDOFF — Sprint 08 (PayPal Checkout Integration)

**Status:** ✅ Complete. A real sandbox payment succeeded end-to-end —
order → buyer approval → capture → webhook → signature verification →
classification → `subscription_status: active` — confirmed live, not by
code review. The sprint spent time **paused** (2026-07-27 to 2026-09-09)
blocked on a PayPal sandbox merchant-account problem unrelated to this
project's code; resolved by the Director creating a new sandbox Business
account, with no code changes needed to fix it.
**Date:** 2026-09-09 (feature work 2026-07-27, resolution + final proof
2026-09-09)
**Commits:** feature code (`a43a362`), three live-bug fixes/gaps
(`5a2cc6f` capture-order, `827301d` DENIED→DECLINED, plus an untracked
`.env.local` correction for `NEXT_PUBLIC_PAYPAL_CLIENT_ID` drift), temp
diagnostic routes added and removed across both sessions, governance
docs (this handoff + lessons + `sprints/SPRINT_08.md` updates).

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
- **Three real bugs/gaps found and fixed live** — see
  `corrections/SPRINT_08_LESSONS.md` findings #1, #2, and #10.
- **Genuine payment success, real activation** — the blocking gap from
  earlier in this sprint. A new US-region sandbox Business account
  (`sb-rvlhv50635659@business.example.com`) and App replaced the original
  BA-region one that had declined every attempt; no code changes. The
  exact same live-test procedure succeeded completely on the first real
  attempt: real capture reached `COMPLETED`, real
  `PAYMENT.CAPTURE.COMPLETED` webhook received and signature-verified,
  correctly classified `processed`, `subscription_status` flipped to
  `active` with correct `subscription_tier: basic` and a correct +1-year
  `subscription_expires_at`. The client UI (already-built polling
  mechanism) correctly reflected this without ever writing state itself.

### Original blocker, now resolved

Two different sandbox buyer accounts against the *original* Business
account (one with no configured funding source, one with a full default
bank+card funding set) both had their real $10 capture attempt
**declined**. Buyer funding was ruled out; root cause was confirmed to be
account-side (not this project's code) by the clean before/after result
of simply switching to a new account — the precise PayPal-side cause
(most likely a Negative Testing setting) was never confirmed in detail,
and didn't need to be once this comparison was this clean.

---

## DONE_CHECKLIST

See `sprints/SPRINT_08.md` Definition of Done — all items checked with
live evidence above, except Premium-tier click-through and an explicitly
isolated tab-close/late-webhook test, which the Director accepted as
sufficient without separate re-verification (see that DoD item's note).

---

## Explicitly NOT done here (by design)

- **Live-mode PayPal credentials or any live-money path** — untouched,
  per P-16/the sprint's hard gate. `PAYPAL_API_BASE` stayed hardcoded to
  sandbox throughout.
- **Pricing changes, tier upgrade/downgrade, Archive/Bookmarks pages,
  chatbot, contact form** — all explicitly out of scope per
  `sprints/SPRINT_08.md`, unchanged from that scope document.
- **Premium tier click-through and isolated tab-close/late-webhook
  test** — not separately re-verified; Director explicitly accepted the
  Basic-tier proof as sufficient.

---

## Next Steps

Sprint 08 is closed. `sprints/SPRINT_09.md` (branding + contact form,
P-15) is the next scope document — see that file for what's proposed;
no Sprint 09 code has been started.

---

*Vibe-Coding Journal — Sprint 08 — governed by Commander v1.4.*
