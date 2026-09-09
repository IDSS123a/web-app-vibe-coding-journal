# SPRINT_08 Lessons Learned

**Scope:** PayPal Checkout integration, sandbox-only (P-16). **Outcome:**
create-order and webhook signature verification proven live in both
directions; two real bugs found and fixed via live E2E testing; a
sandbox-side payment decline blocked the "processed"/activation happy
path for a while, root-caused (informally) and resolved by switching to
a new sandbox Business account — no code changes needed. **Sprint
genuinely closed 2026-09-09**, real activation proven end-to-end against
real data.

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
nothing further). In the original session, the Browser pane was also
unable to composite/screenshot at all, which blocked coordinate-based
clicks entirely, so the actual "click PayPal's button" step could not be
automated — the Director performed that click-through personally.

**Update, later session (2026-09-09):** in a fresh session where the
Browser pane *could* composite/screenshot, coordinate-based clicks into
the same cross-origin PayPal iframe worked correctly end-to-end —
button click, email entry, password entry, and "Complete Purchase" all
succeeded via `computer{action:"left_click", coordinate:[...]}` and
`type`, once verified against a screenshot rather than the (still-blind)
accessibility tree. So the earlier limitation was this session's
screenshot/compositing capability specifically, not an inherent
PayPal/anti-bot restriction on synthetic input. Lesson: if
`read_page`/`find` come up empty inside a payment iframe, don't assume
automation is impossible — try screenshot-based coordinate clicks first;
only fall back to a human click-through if screenshots themselves are
unavailable.

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

### 9. RESOLVED — the sandbox decline was genuinely the merchant account, confirmed by switching accounts

After a long pause (this sprint spanned 2026-07-27 to 2026-09-09),
Director created a brand-new sandbox Business account
(`sb-rvlhv50635659@business.example.com`, US region) with its own new
sandbox App, entirely separate from the original
`sb-vdkwb49652610@business.example.com` (BA region) that had declined
every attempt. **No code changes were made.** The exact same, unmodified
live-test procedure succeeded completely on the first real attempt
against the new account — real capture reached `COMPLETED`, real webhook
arrived, correct activation. This is about as clean a confirmation as
this kind of environmental issue gets: identical code, different
external account, different (successful) outcome. The original account's
specific problem was never root-caused precisely (most likely a Negative
Testing setting, per the Director's own reasoning, but not confirmed),
and that's fine — it didn't need to be, once the account-vs-code
distinction was proven this cleanly.

### 10. `NEXT_PUBLIC_PAYPAL_CLIENT_ID` silently diverged from `PAYPAL_CLIENT_ID`

While re-running the live test with the new US account's credentials,
the paywall showed "Failed to load PayPal SDK" even though
`PAYPAL_CLIENT_ID` had been correctly updated — `.env.local`'s
`NEXT_PUBLIC_PAYPAL_CLIENT_ID` still held an unrelated, unexplained old
value rather than mirroring the new `PAYPAL_CLIENT_ID`. Since these two
variables must always hold the *same* value (one server-only, one
client-exposed by design), any future credential rotation should
explicitly re-derive `NEXT_PUBLIC_PAYPAL_CLIENT_ID` from
`PAYPAL_CLIENT_ID` (a one-line `awk`/`sed` copy) rather than assuming a
manual paste kept both in sync — it's an easy thing to miss since the
symptom (SDK load failure) only shows up client-side, not in any
server-side check.

### 11. A long real-world gap (over a month) can invalidate saved CLI auth

Returning to this sprint after roughly six weeks, the Vercel CLI's saved
token had expired ("The specified token is not valid"), requiring a
fresh `vercel login` (device-flow, browser approval) before any `vercel
env`/deploy commands would work again. Worth expecting this whenever a
sprint resumes after a long real-world gap, not just for Vercel but for
any CLI-based tool with a session/token lifetime.

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
- Sprint went through an explicit **paused** state, not closed, while a
  documented blocking gap (sandbox merchant decline) was unresolved,
  rather than either (a) silently declaring victory on an unproven
  activation path, or (b) marking the sprint done when its own DoD wasn't
  met. Once the Director resolved the account-side issue and the same
  live test succeeded, the sprint was genuinely closed
  (`sprints/SPRINT_08.md`).

---

## DONE_CHECKLIST

See `sprints/SPRINT_08.md` Definition of Done for the full item-by-item
list. Summary:

- [x] Order creation live-verified against real sandbox PayPal API
- [x] Webhook signature verification live-verified in both directions
      (bogus signature rejected; genuine signatures accepted)
- [x] Real ambiguous-payment alert delivery confirmed end-to-end
      (received email, correct `[PAYMENT ISSUE]` subject prefix)
- [x] Genuine `PAYMENT.CAPTURE.COMPLETED` → `subscription_status: active`
      confirmed end-to-end against a real sandbox transaction
      (2026-09-09, new US sandbox Business account)
- [x] Three distinct PayPal secrets confirmed Sensitive-typed in Vercel
      Production
- [x] No live-mode credential anywhere; hard gate DoD item stays unchecked
- [x] Three real bugs/gaps found via live testing, fixed, committed
      separately (missing capture call; DENIED→DECLINED typo;
      `NEXT_PUBLIC_PAYPAL_CLIENT_ID` drift during credential rotation)
- [x] `tsc --noEmit` / `next build` clean throughout
- [x] Naming-discipline audit clean on every commit
- [~] Premium tier and an isolated tab-close/late-webhook test not
      separately re-verified — Director explicitly accepted this as
      sufficient rather than requiring further testing

---

*Vibe-Coding Journal — Sprint 08 — governed by Commander v1.2 through most of this sprint's work, v1.4 as of closure (2026-09-09).*
