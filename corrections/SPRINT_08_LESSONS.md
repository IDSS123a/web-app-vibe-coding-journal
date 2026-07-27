# SPRINT_08 Lessons Learned

**Scope:** PayPal Checkout integration, sandbox-only (P-16). **Outcome:**
create-order and webhook signature verification proven live in both
directions; two real bugs found and fixed via live E2E testing; the
"processed"/activation happy path was never achieved this sprint due to a
sandbox-side payment decline whose root cause sits outside this project's
code. Closed with a documented, explicit gap rather than a silent one.

---

## Technical Findings

### 1. An approved order was never captured — no code called PayPal's Capture Orders endpoint

The original implementation created orders (`createPayPalOrder`) and
verified webhooks, but nothing — not the client SDK's `onApprove`, not
any server route — ever called PayPal's `POST
/v2/checkout/orders/{id}/capture`. An approved order just sits in
`APPROVED` status forever; PayPal only emits `PAYMENT.CAPTURE.COMPLETED`
(the only event this project activates a subscription on) once something
actually captures it. Without a capture call, the webhook the whole
system depends on could never fire, for any transaction, ever.

**How it was found:** live E2E testing — after a real sandbox buyer
approved a real $10 payment, no webhook of any kind arrived, and
`payment_events` stayed empty. Traced to the missing capture step by
grepping the whole payments codebase for `capture` and finding only
comments referencing the concept, never a call.

**Fix:** `capturePayPalOrder(orderId)` added to `lib/payments/paypal-client.ts`,
called server-side via a new `POST /api/payments/capture-order` route.
`PayPalTierButton`'s `onApprove` now calls this route with the approved
`orderID` before showing the "processing" UX state. Capture does **not**
itself touch `subscription_status` — Decision 2 (webhook as sole source
of truth) is unaffected; capture just finalizes payment with PayPal,
which is a precondition for the webhook to exist at all.

### 2. `PAYMENT.CAPTURE.DENIED` should have been `PAYMENT.CAPTURE.DECLINED`

`features/payments/domain.ts`'s list of known non-activating event types
included `PAYMENT.CAPTURE.DENIED` — PayPal's real event name is
`PAYMENT.CAPTURE.DECLINED`. The one-word mismatch meant a real,
successfully-verified decline event fell through to the "unrecognized
event type" branch, was classified `ambiguous` instead of `ignored`, and
fired an unnecessary `[PAYMENT ISSUE]` alert for a perfectly ordinary,
well-understood outcome (payment failed, nothing to activate — not
actually ambiguous at all).

**How it was found:** a real sandbox decline produced exactly this
`[PAYMENT ISSUE]` email, with `reason: "unrecognized event type:
PAYMENT.CAPTURE.DECLINED"` printed directly in the alert body — the bug
announced its own diagnosis.

**Fix:** one-word correction, `DENIED` → `DECLINED`. Re-tested live: the
next real decline was correctly classified `ignored`, no alert.

**Lesson:** don't trust memorized/assumed PayPal event-type spelling —
verify against a real received event's `event_type` field. A single
letter's difference (N vs C) is exactly the kind of thing code review
alone won't catch but a live event payload immediately reveals.

### 3. PayPal's Webhooks Simulator cannot be used to test the ambiguous/processed code paths

The Sandbox Webhooks Simulator sends "mock" events (the Dashboard's own
label) to a registered endpoint. These do **not** carry a signature that
passes real `verify-webhook-signature` validation — every simulator send
this sprint was rejected with 401 before ever reaching classification
logic. This is a genuine, useful confirmation that signature verification
correctly rejects untrusted input, but it means the simulator is *only*
useful for that negative-path test, never for exercising classification,
activation, or alerting — those require a real sandbox transaction.

### 4. Real signature verification proven in both directions

Beyond the simulator's negative-path proof (bogus/mock signatures
rejected), two genuine PayPal-signed webhook deliveries
(`CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.DECLINED`, each sent twice
across two different real checkout attempts) were correctly accepted and
correctly classified — the strongest available evidence that this isn't
"code that exists" but a working integration.

### 5. Local `.env.local` and Vercel Production point to different Supabase projects

Assumed (from prior sprints' "one shared set, no DEV variant" pattern for
Gemini keys) that local dev and production shared one Supabase project.
They don't — a test user registered against the production URL did not
appear when queried via a locally-run diagnostic route using
`.env.local`'s credentials (`totalUsers: 2` in both, but different users).
Any DB-touching diagnostic route for testing something on production must
itself be deployed to production, not run locally against local env vars.
Also means: a future "how many real users exist" audit (Sprint 07's
established pattern) must explicitly check **both** projects, not assume
one covers both.

### 6. Real payment-widget iframes resist browser automation — by design

PayPal's Buttons SDK renders inside a cross-origin iframe that the
accessibility tree cannot see into (confirmed: a single opaque
`presentation` node, no children, `read_page` with full depth returns
nothing further). Combined with this session's Browser pane being unable
to composite/screenshot (blocking coordinate-based clicks entirely), the
actual "click PayPal's button" step could not be automated. This is
consistent with anti-fraud/anti-bot hardening common to real payment
widgets, not a project-specific bug. **Resolution:** the Director
performed the actual click-through personally in their own browser while
this session drove setup (order creation, log monitoring) and verification
(DB state checks) around it. Worth remembering for any future payment-UI
automation: budget for a human click-through step, don't assume full
automation is achievable.

### 7. A real secret fragment was briefly exposed in this session's own transcript

While inspecting `.env.local`'s structure, a `tail -c 50 | cat -A`
command (intended only to check for a trailing newline) printed the
tail-end characters of `PAYPAL_WEBHOOK_ID`'s actual value into the
conversation. Caught immediately, disclosed to the Director without
minimizing it, and the Director rotated the webhook (created a new one,
re-entered `PAYPAL_WEBHOOK_ID`). **Rule reinforced:** never run
`tail`/`head`/`cat` against a file known to contain secrets, even for
purely structural checks (line count, trailing-newline presence,
byte-length) — use `wc -l`, `grep -c '^KEY='`, or `cut -d= -f1` (key names
only) instead, which cannot leak a value under any circumstance.

### 8. `payment_events.user_id` has a foreign-key constraint — cleanup order matters

Deleting a test user whose `id` is referenced by `payment_events.user_id`
rows fails silently-ish (an unhelpful empty error object from
`auth.admin.deleteUser`) until the referencing `payment_events` rows are
deleted first. Test-account cleanup for any future payment-related sprint
must delete `payment_events` (or any other FK-referencing table) before
deleting the `user_profiles`/`auth.users` row.

---

## Process Notes

- Followed the sprint's own required pattern throughout: naming-discipline
  grep audit before every commit (all clean), `tsc --noEmit`/`next build`
  clean at every step, separate commits for code fixes vs. this
  lessons/handoff documentation.
- Temporary diagnostic routes (`temp-force-expire`, `temp-check-payment-event`,
  a one-off `temp-paypal-live-test`) were created, deployed to
  **production** (necessary once the local/production Supabase split was
  discovered — see finding #5), used, and deleted, matching this
  project's established temp-route testing pattern, extended here to
  cover the production-deploy case that local-only testing couldn't
  reach.
- All test data was cleaned up: the throwaway `sprint08-e2e-verify@example.com`
  account and its `payment_events` rows were deleted from production at
  close, keeping the real-account count consistent with Sprint 07's
  established audit baseline.
- Sprint closed with an explicit, Director-approved partial DoD rather
  than either (a) silently declaring victory on an unproven activation
  path, or (b) blocking indefinitely on a sandbox-side issue outside this
  project's code. See `sprints/SPRINT_08.md`'s "Known Gaps" section for
  the specific carried-forward item.

---

## DONE_CHECKLIST

See `sprints/SPRINT_08.md` Definition of Done for the full item-by-item
list and its "Known Gaps" section for what remains open. Summary:

- [x] Order creation live-verified against real sandbox PayPal API
- [x] Webhook signature verification live-verified in both directions
      (bogus signature rejected; genuine signatures accepted)
- [x] Real ambiguous-payment alert delivery confirmed end-to-end
      (received email, correct `[PAYMENT ISSUE]` subject prefix)
- [x] Three distinct PayPal secrets confirmed Sensitive-typed in Vercel
      Production
- [x] No live-mode credential anywhere; hard gate DoD item stays unchecked
- [x] Two real bugs found via live testing, fixed, committed separately
- [x] `tsc --noEmit` / `next build` clean throughout
- [x] Naming-discipline audit clean on every commit
- [ ] **NOT DONE:** genuine `PAYMENT.CAPTURE.COMPLETED` / subscription
      activation never achieved — sandbox-side decline, root cause
      outside this project's code, carried forward as an explicit gap

---

*Vibe-Coding Journal — Sprint 08 — governed by Commander v1.2.*
