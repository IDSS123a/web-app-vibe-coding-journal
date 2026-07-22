# HANDOFF — Trigger Reliability (GitHub Actions gap, cron-job.org, catch-up net, quota logging)

**Scope:** four related findings/fixes discovered while watching the first
real production runs after deploy — all trace back to one root question:
"does the report actually get generated every day, and if not, why not."
**Not a new sprint** — continuation of [[HANDOFF_SCHEDULE_GATE]], same as
that file was a continuation of already-closed Sprint 06.

**Date:** 2026-07-20 through 2026-07-22
**Commits:** `47525fd` (Gemini quota logging fix), `31e42a1`/`07ba223`/`7d1b024`/`8588bf6`
(lessons #9-13), `3f57297` (catch-up safety net) — see [[HANDOFF_SCHEDULE_GATE]]
for the original `f5177ae` schedule-gate work these build on.

---

## Finding 1 — GitHub Actions' hourly schedule isn't hourly

**What was found:** measured the gap between every consecutive scheduled
run of `.github/workflows/hourly-digest-trigger.yml` since it went live
(28 runs). **26 of 28 gaps exceed 90 minutes** — most run 100–215 minutes
apart against a configured `cron: "0 * * * *"`. Not a one-off: consistent
across the entire history checked.

**Concrete consequence:** on `2026-07-22`, the target-hour window
(`05:00–05:59 UTC`) received **zero invocations** — the nearest runs were
`03:32:43Z` and `06:27:29Z`, a 175-minute gap that skipped straight over
it. Verified directly against the database: `daily_reports` had 0 rows for
that date. Both nearby runs correctly returned `not_target_hour` (they
genuinely weren't in the window) — the schedule-gate logic worked exactly
as designed; GitHub's own scheduler simply never called it during the
target hour.

**Root cause:** a known, documented GitHub Actions limitation — scheduled
workflows on lower-activity repos get deprioritized/delayed by GitHub's own
infrastructure. Not a bug in anything built here.

## Finding 2 — cron-job.org added as a second, independent trigger

Added as mitigation for Finding 1. Required one architectural question to
be answered with evidence, not assumption, before trusting it in
production: **does a client-side request timeout (cron-job.org's 30s) kill
server-side execution?**

**Tested directly against production:** forcibly disconnected a client at
25s (`curl --max-time 25` → exit 28, no response received) while calling a
route that sleeps 105s (matching the real pipeline's observed duration)
before writing a DB marker row. Checked the marker independently of the
disconnected client: `created_at` matched the predicted ~105s completion
time, **79 seconds after** the client had already given up. **Vercel keeps
executing after the client disconnects** — no architecture change (e.g. an
immediate-202-plus-`waitUntil` pattern) was needed. Test route and marker
row both deleted after use.

**Direct consequence, initially missed:** because every real pipeline run
exceeds cron-job.org's 30s timeout by design, its own "execution fails"
notification fires on **every real run**, success or not. Enabled
initially (reasonable-sounding default), then disabled once this was
understood — normalized false alarms are worse than no alarm. The
project's own signal (`held_for_review` → email, direct DB inspection)
is what's trusted, never the third-party scheduler's opinion of its own
request.

**Also caught before it caused a silent failure:** the cron-job.org form
was initially going to use `GET`; the endpoint only implements `POST`
(confirmed in `route.ts` — no `GET` handler exists). Flagged before the
form was saved.

## Finding 3 — catch-up safety net

Direct response to Finding 1: even with two independent hourly triggers,
both could in principle miss the same target-hour window on the same day.
`lib/cron/schedule-gate.ts` now exports `isPastCatchUpDeadline()` (noon
local, in the configured operations timezone) as a third layer — if the
target hour was missed entirely by that point in the day, the next
invocation runs the pipeline anyway rather than silently waiting for
tomorrow. Idempotency (`getDailyReportByDate`) is unchanged and still
governs whether a run actually happens; this only widens *when* a run is
allowed to be attempted.

**Live-verified** (temporary test route, deleted after use): 6
boundary/DST cases — the 11:59/12:00 local deadline boundary in both
summer and winter, and confirmation the target hour itself is still
mutually exclusive with the catch-up window — all matched expected values.

## Finding 4 — Gemini quota error logging was over-redacted

Investigating why a real pipeline run hit heavy Gemini key exhaustion
(23/30 articles), found `gemini-provider.ts` discarded the *entire* error
response body to keep the API key out of logs — including fields with zero
secret content (`quotaId`, `quotaValue`, `retryDelay`, the API's own
`status` string) that are exactly what's needed to tell a per-day cap
apart from a per-minute one during a post-mortem. Fixed:
`extractSafeQuotaInfo()` now allowlists those specific fields into the
existing `[GEMINI]` warn lines — never the key, request URL, or free-text
message. **Verified live:** triggered a real 429 through
`GeminiProvider.summarize()` locally, confirmed the new fields appear in
the log and zero occurrences of the key prefix `AIzaSy` anywhere in
output.

**Also established during the same investigation** (live diagnostic call,
not memory): this project's actual Gemini free-tier cap is confirmed
`quotaValue: "20"` requests/day/model/project (`quotaId:
GenerateRequestsPerDayPerProjectPerModel-FreeTier`), and RPD resets at
midnight Pacific time (confirmed against Google's current docs) — which is
**09:00 local** in the configured operations timezone most of the year,
**08:00 local** during the two US/EU DST-mismatch windows (mid-March,
late-Oct/early-Nov). Recorded as lesson #12 for future test-timing
planning.

---

## DONE_CHECKLIST

- [x] GitHub Actions scheduling gap measured and quantified (26/28 gaps
      >90min), not just suspected
- [x] Root cause of `2026-07-22`'s missing report identified via direct DB
      check, not inferred from logs alone
- [x] cron-job.org added; disconnect-survival question answered with a
      real production test, not documentation-reading
- [x] cron-job.org `GET`-vs-`POST` mismatch caught before the form was
      saved
- [x] cron-job.org's structurally-guaranteed false-alarm notification
      identified and disabled before it could train anyone to ignore real
      alerts
- [x] Catch-up safety net implemented, live-verified across DST boundaries
- [x] Gemini error logging fixed to preserve diagnostics without exposing
      the key; verified zero key leakage in output
- [x] Actual free-tier quota value and RPD reset timing confirmed live,
      not assumed from generic docs
- [x] Naming discipline maintained throughout — one self-caught near-miss
      (a lesson-doc draft initially used the literal forbidden location
      term before committing; rewritten to the established generic
      "operations timezone" phrasing before commit, not after)
- [x] All temporary test routes and marker rows deleted, production
      redeployed clean after each
- [x] All commits pushed to `origin/main`

---

## Explicitly NOT done here

- No forced/synthetic test of the catch-up net against the real endpoint —
  deliberately left for the next natural trigger (already past the
  catch-up deadline as of this handoff, with no report yet today) rather
  than spending real Gemini quota on a manufactured test.
- The negative/`held_for_review`-under-realistic-conditions path beyond
  what the AI-unavailability case already exercised — still open from
  [[HANDOFF_SCHEDULE_GATE]], unrelated to trigger reliability specifically.

---

*Governed by Commander v1.2. Continuation of [[HANDOFF_SCHEDULE_GATE]],
itself a continuation of already-closed Sprint 06 — not a reopening of
either.*
