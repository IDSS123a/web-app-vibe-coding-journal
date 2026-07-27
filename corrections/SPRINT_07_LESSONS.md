# SPRINT_07 Lessons Learned

**Scope:** subscription/trial data model (P-13), hard paywall enforcement,
admin billing exemption. **Outcome:** all four in-scope items implemented
and live-verified; one significant pre-existing bug found and fixed along
the way (out of this sprint's own scope, but blocking its verification).

---

## Technical Findings

### 1. Registration passed an already-hashed password to Supabase Auth — nobody could ever log in

`features/onboarding/actions.ts`'s `registerAction` called
`supabaseAdmin.auth.admin.createUser({ password: await hashPassword(parsed.password), ... })`.
Supabase's Admin API hashes the password itself internally and expects the
plaintext value — passing an already-bcrypt-hashed string made the stored
credential correspond to `bcrypt_hash_of(password)`, not `password`
itself. Every user who ever registered through this flow got a real
account row but could never sign back in with their actual password.

**How it was found:** live-verifying Sprint 07's trial-active dashboard
access required logging in as a freshly-registered test user through the
real `/login` page. The very first attempt returned Supabase's real
`"Invalid login credentials"` error — not a Sprint 07 bug, but it fully
blocked verifying Sprint 07's actual behavior end-to-end.

**Fix:** pass `parsed.password` directly; Supabase does its own hashing.
`lib/auth/password.ts`'s `hashPassword`/`verifyPassword` are unused by
this path (and were already unused before this fix — `loginAction` never
called `verifyPassword` either) — left in place, not deleted, since
removing unused-but-not-provably-dead exports is a separate decision from
fixing this specific bug.

**Commander M-12 note:** this is arguably a "used a value in the wrong
shape" class of bug, not quite the established "hand-rolled parsing
standing in for a library" pattern from PDL-011 — recorded here as its
own thing rather than force-fit into that pattern.

### 2. An unrelated project's dev server can silently occupy the expected port

Mid-verification, `http://localhost:3000` served **a completely different
project** (`web-app-IDSS-handbook`, an unrelated school handbook app)
instead of this one. `netstat` + `Get-CimInstance Win32_Process`
(PowerShell) confirmed the actual command line and working directory
before touching anything — the process was left running untouched (it
belongs to unrelated, possibly-active work), and this project's dev
server was started fresh, which Next.js correctly auto-assigned to port
3001 with an explicit console warning.

**Rule going forward:** don't assume `localhost:3000` is the current
project just because a dev server responds there — when working across
multiple local projects on the same machine, verify the actual page
content (or the process's command line) matches expectations before
running any test against it, especially before any destructive/test-data
action. A wrong assumption here could have meant testing against, or
worse mutating test data in, a completely unrelated project's database.

### 3. Testing an authorization *exemption* requires deliberately breaking the thing it's exempt from

Admin billing exemption (`isBillingExempt`) could not be meaningfully
verified by testing an admin account in its normal (`active`) state —
that would only prove "active subscriptions get through," which is a
different code path (`evaluateSubscriptionAccess`) and would pass even if
the exemption check were completely broken or missing. Verified by
temporarily setting `admin@test.local`'s `subscription_status` to
`expired`, confirming dashboard access still worked, then restoring the
original state immediately after. Applies generally: an "X is exempt from
Y" claim isn't proven by observing X pass while also satisfying Y anyway —
it requires making X fail Y and observing it still pass.

---

## Process Notes

- Migration execution required a manual step (Director running
  `supabase/migrations/005_subscription_trial.sql` via the Supabase
  Dashboard SQL Editor) — no DDL execution path was available
  (PostgREST doesn't support schema changes, `supabase` CLI wasn't
  authenticated to this project, and the connected Supabase MCP tool
  points at an unrelated project). Matches this project's own established
  pattern (`SUPABASE_ADMIN_SETUP_GUIDE.md`) for this kind of one-time
  manual step.
- Built in Commander's mandated dependency order (migration → types →
  validation → repository → domain → API route → UI → integration) —
  repository layer needed zero new code since `select("*")` already
  returned the new fields automatically once the migration landed.
- `isBillingExempt`'s signature was deliberately narrowed to `{ role:
  string } | null` rather than the full `PermissionContext` other
  permission functions use — the only caller has a verified token, not a
  full `UserProfile`, and forcing the wider signature would have meant
  fabricating irrelevant fields just to satisfy a type.
- All test data (two throwaway registrations, one temporary admin-state
  mutation) created during verification was deleted/restored in the same
  session, confirmed via a final direct DB read showing exactly the two
  original pre-existing accounts, both correctly backfilled.

---

## DONE_CHECKLIST

See `sprints/SPRINT_07.md` Definition of Done for the full item-by-item
list. All items complete:

- [x] Migration applied, backfill verified live (both pre-existing rows:
      `active`/`premium`/never-expires)
- [x] Real registration verified live twice (once before, once after the
      password fix) — both produced correct trial fields
- [x] Trial-active access verified live through the real UI
- [x] Trial-expired hard block verified live — real paywall screen, no
      dashboard content leaked
- [x] Admin billing exemption verified live, isolated from the
      active-subscription path specifically (finding #3 above)
- [x] `tsc --noEmit` / `next build` clean
- [x] Naming-discipline audit clean on every new/changed file
- [x] Out-of-scope bug found during verification fixed and committed
      separately, not folded into Sprint 07's own commit

---

*Vibe-Coding Journal — Sprint 07 — governed by Commander v1.2.*
