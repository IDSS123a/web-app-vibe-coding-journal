# HANDOFF — Sprint 06 (RSS Parser, Gemini Key Cleanup, Vercel Setup)

**Status:** ✅ Code complete and live-verified. ⏸ Production deploy
intentionally deferred to its own conversation.
**Date:** 2026-07-19
**Key commits:** `9800bb0d`/`4d4f2f04` (rss-parser + PDL-011), `bf3abf9b`→`ab465508`
(dev/prod keys, implemented), `7a31995`/`1734928` (dev/prod keys, reverted —
PDL-013), `c81be34` (cron timezone fix), plus the node_modules/zip
housekeeping and first-push commits from this same session.

---

## What Was Accomplished

### 1. RSS parser: CDATA + Atom fixed with `rss-parser`
Replaced the hand-rolled regex parser in `features/sources/actions.ts`.
Root cause (CDATA-wrapped `<title>` on hnrss.org, silently dropping every
item) confirmed by diffing real feed XML. `rss-parser` solves CDATA (real
XML parser) and RSS2/Atom normalization (same output shape for both) in one
library call. Error messages now distinguish `"Feed fetch error: ..."`
(transient, retry-worthy) from `"Feed parse error: ..."` (was permanent
until this fix) — P-7 requirement.

**Live proof:** hnrss.org went from 0 articles (documented bug) to 20 real
articles per feed; GitHub Blog regression-checked unchanged at 10; Atom +
CDATA together verified via a realistic sample; parse-vs-fetch error
distinction verified against a deliberately broken feed URL.

### 2. Gemini dev/prod key separation: built, then removed same day
Implemented VERCEL_ENV-based key selection (dev/prod branch), proved all
three logic branches live, fixed a real bug found along the way (production
branch had no fallback, would have found 0 keys on an actual deploy). Then,
once PDL-012 established there was genuinely only one 8-account key set (not
two), the branch was recognized as unnecessary complexity and removed
(PDL-013) — `lib/ai/gemini-provider.ts` now reads a flat `GEMINI_API_KEY_1..8`
list, no environment branching. Net effect: simpler code, same 8 keys used
throughout, no `_DEV_`-named secret sitting in the Vercel dashboard implying
a separation that never existed.

### 3. Quota vs. suspected-suspension distinction (PDL-012 follow-up)
Because the 8-key rotation itself carries a Google ToS risk (PDL-012),
account suspension is a real failure mode, not hypothetical.
`GeminiKeysExhaustedError` now carries a `reason: "quota" | "suspected_suspension"`
field; the P-6 hold message and email subject (`[URGENT — ACTION NEEDED]`)
escalate distinctly when suspension is suspected. Detection includes a
real, live-verified signal (`HTTP 400` / `API_KEY_INVALID` reason code for
an invalid key — found by testing against the real API, not assumed to be
401/403 as the general Google error model would suggest) plus defensive
coverage for 401/403/PERMISSION_DENIED/UNAUTHENTICATED (not verifiable live
— no safe way to trigger a real account suspension for testing).

**Live proof:** a full test run with all 8 (test) keys deliberately invalid
produced `aiSuspectedSuspension: true`, the correct differentiated hold
message, and `[GEMINI]` logs correctly labeled "auth/permission failure" —
0 key values anywhere in the log throughout.

### 4. First Vercel setup: login, link, 15 production env vars
`vercel login` (Director authenticated), `vercel link` (created
`idsssarajevo/web-app-vibe-coding-journal`, connected to GitHub). All
env vars added to Production via `vercel env add`, grouped and confirmed by
the Director before each group ran — Supabase (3), Gemini (8), `CRON_SECRET`
(1, freshly generated via `crypto.randomBytes(32)`, piped directly, never
printed, `unset` after), Resend/email (3, caught proactively — not
originally in the Director's named groups, would have caused production
email alerts to silently stop working).

### 5. First push to `origin` — with a same-day approved history rewrite
Pre-push secret audit (full history, not just the diff) found zero real
secret values. Also found `node_modules` (19,687 files) tracked since the
first commit — Director explicitly approved a one-time `git filter-repo`
exception (recorded in `corrections/PROCESS_LESSONS.md`, including a finding
that the stated "nothing pushed yet" justification wasn't quite accurate —
one commit already existed on `origin/main`, harmless only because it never
contained `node_modules`). Push completed as a clean fast-forward, no force
needed. A smaller version of the same mistake (`web-app-vibe-coding-journal.zip`
tracked since the first commit) was found and fixed the same way but without
a rewrite (`git rm --cached`, small enough not to be worth it).

### 6. Cron schedule timezone bug found and fixed before any deploy
`vercel.json` declared `0 9 * * *` (09:00 UTC) — verified to compute to
**11:00 Sarajevo**, not the intended 07:00, a 4-hour miss. Corrected to
`0 5 * * *`. Live-verified against Vercel's current documentation (fetched
directly, not from training data) that `CRON_SECRET` auto-injection works
as our code expects with zero extra config, AND that this project is on the
**Hobby plan**, which does not guarantee minute-precision — the actual
trigger may land anywhere in the 07:xx Sarajevo hour once deployed, a
platform constraint, not a config bug.

---

## Explicitly NOT Done (deferred, not forgotten)

- **`vercel --prod` itself.** Per the Director's explicit request, this is
  its own separate conversation — the first time real production AI keys,
  real cron, and real email work together, with a Preview deploy
  (`vercel` without `--prod`) planned first, and a request to watch the
  first live cron invocation together rather than "deploy and check
  tomorrow."
- **Cron-fires-on-schedule verification** — cannot happen before the deploy
  above.
- **DST-aware cron scheduling** — no automation exists; `0 5 * * *` will
  need manual updating to `0 6 * * *` around late October 2026 when Bosnia
  exits DST, and back around late March 2027. Flagged, not solved.

---

## Known Limitations / Follow-ups

- Hobby-plan cron imprecision (±59 min within the declared hour) is a
  platform limitation, not something this project's code can fix. If exact
  timing ever becomes a hard requirement, the only lever is upgrading the
  Vercel plan.
- `subscription_tier` (P-13/P-14, from the parallel governance track this
  session) is documented but not implemented — unrelated to this sprint's
  actual scope, noted for completeness only.

---

## DONE_CHECKLIST

See `sprints/SPRINT_06.md` Definition of Done — every in-scope item checked
with inline evidence. Two items intentionally left open (production deploy,
cron-fires verification), explicitly marked as deferred-by-design, not
silently incomplete.

---

## Next Steps (separate conversation, per Director's request)

1. Review the exact `vercel --prod` plan together (not a continuation of
   tonight's session).
2. Preview deploy first (`vercel`, no `--prod`) — confirm build/env work on
   real Vercel infrastructure.
3. Production deploy, watched together.
4. Watch the **first live cron invocation** together in real time, not
   "check tomorrow morning."

---

*Governed by Commander v1.2. This sprint's own gate — governance addenda
(CONSTITUTION P-13 revision, P-19, PDL-014) that arrived during this same
session are tracked separately, not part of this sprint's scope or DoD.*
