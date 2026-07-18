# HANDOFF — P-3 Hype Filter Wiring + Admin UI Role Guard

**Scope:** Two targeted fixes on existing Sprint 04 code (finding #14 from
[[SPRINT_04_LESSONS]] + the deferred middleware guard). **Not Sprint 05.**
No AI provider work, no new features.

**Date:** 2026-07-18
**Commits:** `2ffd1656` (hype filter), `360c5903` (admin guard) — separate, as required.

---

## Fix 1 — P-3 hype-word filter wired into the cron hold decision

### What was wrong
`containsHypeWords()` / `HYPE_WORDS` existed since Sprint 03 but the cron's
`generateDailyReport` only checked the confidence threshold. A hype-laden
article would auto-publish in the unattended path, violating P-3.

### What changed
- `features/pipeline/quality-engine.ts`: added `evaluateReportHold()` — a pure,
  unit-testable function. Holds the report if ANY article scores below the
  confidence threshold **OR** contains a hype word in `title` / `summary` /
  `raw_summary`.
- `app/api/cron/daily-digest/route.ts`: `generateDailyReport` now calls
  `evaluateReportHold()` instead of only checking confidence.

### Concrete proof (fresh run, this turn — not a re-narration of an old test)

**PRIJE** — inserted a synthetic article directly into Supabase with
`confidence_score = 0.80` (well above the 0.6 threshold, so confidence cannot
cause a hold) and summary text containing both "revolucionarno" and the
English P-3 term "revolutionary":
```
"summary": "Ovo je revolucionarno i potpuno mijenja način na koji programirate.
             This is a revolutionary approach."
```
`daily_reports` row for today, before the run: `review_status: "auto_published"`
(left over from an earlier run).

**Cron run** (`POST /api/cron/daily-digest`) — actual JSON response:
```json
"dailyReport": {
  "articleCount": 1,
  "reviewStatus": "held_for_review",
  "holdReasons": ["1 article(s) contain hype words (P-3 editorial voice)"]
}
```

**POSLIJE** — Supabase `daily_reports` row for today:
```json
{
  "review_status": "held_for_review",
  "article_count": 1,
  "markdown": "## Proof article 1784394161\nOvo je revolucionarno i potpuno
                mijenja nacin na koji programirate. This is a revolutionary
                approach.\n..."
}
```

**Server log**, same run:
```
[REPORT] Generating report for 2026-07-18 (1 articles)
[REPORT]   ⚠ P-3 hype filter: 1 article(s) with hype words → hold
[CRON]   ✓ Report generated: 1 articles, status: held_for_review
[CRON]   ⚠ Review queue: 1 article(s) contain hype words (P-3 editorial voice)
[EMAIL] Review alert sent to mulalic.davor@outlook.com
```
The review-queue email actually sent (RESEND_API_KEY is now configured),
confirming the full P-6 notification path fires on a hype hold, not just the
DB write.

**Negative control** (same run session) — cleared the article, inserted a
clean one at the *same* confidence (0.80), no hype word:
```
reviewStatus: auto_published
holdReasons: []
```
This isolates the hold to the hype word specifically — confidence was held
constant across both cases.

### ⚠ Important caveat — read before assuming Bosnian text is covered

`HYPE_WORDS` (and CONSTITUTION P-3) list **English terms only**:
`"revolutionary", "game changer", "groundbreaking", "unprecedented",
"disrupts", "changes everything"`.

The proof above used a summary containing **both** "revolucionarno" (Bosnian)
and "revolutionary" (English). The filter matched on the English word. **A
Bosnian-only hype phrase would NOT be caught today.** If AI Summary output
(Sprint 05+) will be generated or reviewed in Bosnian, Bosnian equivalents
must be added to `HYPE_WORDS` and to CONSTITUTION P-3 — that is a Director
content decision, not something to infer silently (M-4).

### Test artifact
`scripts/test-hype-hold.mjs` — automated version of the same proof (positive +
negative case, 5 assertions), self-contained (disables/restores sources,
cleans up test articles). Re-run anytime: `node scripts/test-hype-hold.mjs
http://localhost:PORT`.

---

## Fix 2 — Admin UI role guard for `/admin`

### What was wrong
`/api/admin/*` routes independently verify the admin role (defense in depth,
correct), but nothing prevented a signed-in non-admin from *loading* the
`/admin` UI shell itself — they'd just see failed fetches, not a clean denial.
Server middleware cannot see the session because it's client-side
(supabase-js in localStorage), not a cookie — a real architectural constraint,
not an oversight.

### What changed
- `lib/auth/verify-token.ts`: split `getVerifiedUser` (resolves any valid
  token → role) from `verifyAdminToken` (also requires admin).
- `app/api/me/route.ts` (new): `GET /api/me` → `{authenticated, isAdmin, email}`
  from the caller's bearer token.
- `components/AdminGuard.tsx` (new): client component, wraps
  `app/admin/layout.tsx`. Calls `/api/me` with the session token; renders
  "Not authorized" for signed-in non-admins, a sign-in prompt for anonymous
  visitors, and the real content only for admins.
- `middleware.ts`: replaced the old misleading TODO with an accurate comment
  explaining the two-layer guard (UI + API) and why middleware can't do it
  directly today.

### Concrete proof (fresh browser session, this turn)

1. Logged in via the real `/login` form as **`user@test.local`** (role=`user`
   in `user_profiles`, confirmed non-admin).
2. Login redirects to `/admin/review-queue`. Page rendered:
   > **Not authorized**
   > Your account does not have admin access.
   > [Back to dashboard →]
   (Screenshot captured.)
3. Direct navigation to a nested route, `/admin/review-queue/2026-07-18`, as
   the same non-admin session → **same "Not authorized" screen** — confirms
   the guard is at the layout level and covers the whole `/admin` subtree, not
   just the list page.
4. Positive control, same browser: logged in as `admin@test.local` →
   `/admin/review-queue` renders normally ("No held reports at this time" —
   correct, since the hype-filter test above had already cleaned up its
   articles).

No code was read to "confirm it exists" — this was driven end-to-end through
the actual login form and actual page loads.

---

## DONE_CHECKLIST

- [x] Hype-word filter wired into the cron's report-level hold decision
- [x] Held vs. auto-published proven with real before/after state (DB row,
      cron JSON response, server log), not just a passing test assertion
- [x] Negative control run (clean text, same confidence → auto-published)
- [x] Email notification path confirmed firing on a hype-triggered hold
- [x] Caveat documented: HYPE_WORDS/P-3 is English-only; Bosnian terms need an
      explicit Director decision before Bosnian hype text would be caught
- [x] `tsc --noEmit` zero errors
- [x] Fix 1 committed separately (`2ffd1656`)
- [x] Admin UI guard added at the layout level (`/admin/*`)
- [x] Non-admin blocked — proven by browser click-through (real login, real
      page load, screenshot), not by reading the source
- [x] Guard covers nested admin routes, not just the top-level list
- [x] Admin still passes through (positive control, same session)
- [x] `/api/admin/*` routes still independently enforce role (defense in
      depth unchanged)
- [x] Fix 2 committed separately (`360c5903`)
- [x] This handoff note created, scoped to these two fixes only

**Legend:** all items [x] — no partial/gap items on this pass.

---

## Explicitly NOT done here (by design — out of scope for this handoff)

- Sprint 05 / GeminiProvider implementation — **not started**, awaiting
  separate Director go-ahead per the last instruction.
- Bosnian hype-word terms — flagged above, needs a content decision.
- Cookie-based SSR sessions (would let real middleware do this instead of the
  UI-level guard) — not needed now; documented as the upgrade path if ever
  required.

---

*Governed by Commander v1.2. Two isolated fixes, two isolated commits, one
handoff — no batch approval (see SPRINT_04_LESSONS finding #15).*
