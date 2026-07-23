# SPRINT_07 — Subscription/Trial Data Model & Access Gating
# Vibe-Coding Journal
# Status: SCOPE DRAFT — awaiting Director approval, no implementation started

---

## Scope — IN

### 1. `user_profiles` schema extension (P-13, P-4)

The five fields P-13 already specifies in `CONSTITUTION.md` are documented
but **confirmed absent from the actual table** (checked live via Supabase
REST, 2026-07-22 — an existing row has none of them):

```
subscription_status      enum: trial | active | expired
trial_started_at         timestamp
trial_ends_at            timestamp
subscription_expires_at  timestamp, nullable until first payment
subscription_tier        enum: basic | premium
```

Migration adds these columns. No other schema change in scope.

### 2. Trial lifecycle on registration

New user registration sets `subscription_status = 'trial'`,
`trial_started_at = now()`, `trial_ends_at = now() + 3 days` (P-13: fixed
3-day trial, no card required to start). **`subscription_tier` at trial
start is an open question — see Decisions Needed below, not resolved
here.**

### 3. Hard paywall enforcement on trial/subscription expiry

Per P-13's explicit "hard block, no degraded read-only mode": once
`trial_ends_at` (or `subscription_expires_at`, once that exists) has
passed with no active paid subscription, block access to Daily Report,
Archive, and Bookmarks entirely — redirect to a paywall/subscribe screen.
This is an access-control change to existing routes, not new content
features.

### 4. Admin billing exemption

P-13: admin accounts (P-14 role) are exempt from all billing gates. Must
be an explicit, named, auditable check in `lib/permissions.ts` (P-14's
existing centralization rule) — never an accidental side effect of role
logic living elsewhere.

---

## Scope — OUT (explicitly, do not touch this sprint)

- **PayPal integration itself (P-16)** — explicitly gated by P-18: "must
  not proceed past governance-only status until [the Gemini ToS quota
  risk] is explicitly addressed in the Sprint 08 (PayPal) scope
  document." This sprint builds the *gate*, not the *payment flow* behind
  it.
- Upgrade/downgrade behavior between tiers (proration, mid-year switches)
  — P-13 states explicitly "not specified," future PDL required first.
- Whatever the paywall/subscribe screen's actual visual design ends up
  being beyond functional access-gating — content/design is a separate
  concern from the access-control logic this sprint covers.
- Any change to the Gemini key-rotation ToS-risk posture (P-18) — that's
  Sprint 08's explicit precondition to resolve, not this sprint's.
- Chatbot/Premium-exclusive feature itself (P-19) — Premium tier exists
  as a billing state this sprint, not as a feature with anything
  distinguishing it yet.

---

## Decisions Needed (Director — not invented here, per M-4/M-13)

1. ~~**Trial tier level.**~~ **RESOLVED 2026-07-23 (Director):** the 3-day
   trial grants **Premium-level access**, including the P-19 chatbot once
   it exists.
2. ~~**Paywall screen scope.**~~ **RESOLVED 2026-07-23 (Director + Commander
   FEATURE_LIFECYCLE.md Step 3):** "build strictly in dependency order,
   never jump ahead" — migration → types → validation → repository →
   domain → API route → **UI last**. This sprint builds the full feature,
   including a functional paywall/subscribe screen (without live PayPal
   payment behind it yet), but only after every backend layer is complete
   and tested — not deferred to Sprint 08 as a separate later build.
3. **Existing users at migration time — still open.** The one real
   `user_profiles` row checked live (`admin@test.local`) has no
   subscription fields today. Once the migration runs, does it get
   backfilled with a default state (e.g. `active`, `admin`-exempt anyway
   per item 4) or left null? Director's most recent answer to this
   specific question addressed something else (email routing, now
   resolved separately as PDL-016) — re-asking directly:
   **📌 RECOMMENDATION: backfill existing rows to `subscription_status:
   active`, `subscription_tier: premium`, `subscription_expires_at: NULL`
   (never expires) — since every existing row today is `admin@test.local`
   (billing-exempt anyway) and defaulting real future non-admin backfills
   to a hard-blocked `expired` state on migration day would be a harsh
   surprise with no warning.** Confirm or override.

---

## Constitution References

- **P-13** (Business Model — Subscription & Trial): this sprint's entire
  subject.
- **P-4** (Content Domain Model): `UserProfile` schema block already
  contains these fields, documented ahead of implementation per the
  existing P-12 rule — this sprint is that implementation.
- **P-14** (Roles & Access Control): admin billing exemption must go
  through `lib/permissions.ts`, the existing centralized-check location.
- **P-18** (AI Provider Quota Strategy): explicit boundary — this sprint
  may not be read as authorization to proceed into P-16 payment work.

---

## Definition of Done (draft — none of this is done yet)

- [ ] Migration adds the five `user_profiles` columns, matching the P-4
      schema block exactly (names, types, enum values)
- [ ] Existing-row backfill behavior decided (Decisions Needed #3) and
      applied consistently
- [ ] Registration flow sets trial fields correctly — live-verified via a
      real registration, not just code review
- [ ] Trial-tier decision (Decisions Needed #1) resolved and implemented
- [ ] Hard block verified live: a trial-expired test account genuinely
      cannot reach Daily Report/Archive/Bookmarks, redirects correctly —
      not just "the check exists in code"
- [ ] Admin exemption verified live: an admin account past any expiry
      date still has full access
- [ ] Named, auditable function in `lib/permissions.ts` for the billing
      exemption — no scattered inline checks
- [ ] `tsc --noEmit` / `next build` clean
- [ ] Naming-discipline audit (no forbidden location strings) on every
      new/changed file before commit
- [ ] `corrections/SPRINT_07_LESSONS.md` and a handoff note created at
      close

---

## Approval Record

**Not yet approved.** This is a scope draft only — per this project's
standing discipline (every prior sprint required explicit Director
approval before implementation began), no code changes happen against
this scope until reviewed and confirmed. Decisions 1 and 2 resolved
2026-07-23; Decision 3 (migration backfill behavior) still open.

---

## Handoff Note Template (fill at sprint end)

```
HANDOFF NOTE — Sprint 07
Completed: [...]
Not completed: [...]
Open risks: [...]
Technical debt: [...]
Next sprint: [...]
```

---

*Vibe-Coding Journal — Sprint 07 — governed by Commander v1.2*
