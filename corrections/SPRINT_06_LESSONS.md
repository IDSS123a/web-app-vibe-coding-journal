# SPRINT_06 Lessons Learned

**Scope:** RSS parser CDATA/Atom fix, Gemini dev/prod key work (implemented
then reverted same day), first `vercel login`/`link`/env setup, first push to
`origin`. **Outcome:** all in-scope code items done and live-verified;
production deploy itself intentionally deferred to its own conversation.

---

## Technical Findings

### 1. `rss-parser` fixed a deterministic bug, not a flaky one
The regex `/<title>([^<]+)<\/title>/` cannot match `<title><![CDATA[...]]>`
— `[^<]+` requires a non-`<` character immediately after `<title>`, and
CDATA's next character is always `<`. This affected every hnrss.org item,
every time — not intermittent. `github.blog/feed/` happened to not
CDATA-wrap its `<title>`, which is the entire reason it "worked" in Sprint
04/05 while hnrss silently returned 0 articles. Root cause was confirmed by
diffing real feed XML, not guessed from the symptom.

### 2. Second instance of the same bug class, now named (M-12)
Sprint 04's dedup self-match/RLS defects and this RSS parsing bug are the
same root cause: hand-rolled string/pattern logic standing in for an
established library or a correct query operator. PDL-011 names this pattern
explicitly so a third instance gets caught faster — see DECISION_LOG.md.

### 3. A same-day PDL reversal is a feature of the process, not a failure of it
Dev/prod Gemini key separation was implemented, live-tested (three branches
of fallback logic, all proven), then **completely removed** hours later once
PDL-012 established there was only ever one real key set. The Director's
framing: the branch was "suvišna složenost koja postoji samo zbog istorije
zabune, ne zbog stvarne potrebe" (unnecessary complexity existing only
because of a history of confusion, not a real need). This is worth recording
as a positive pattern, not a wasted-effort embarrassment: the DoD proof from
the now-deleted code (documented in the SPRINT_05_LESSONS addendum and git
history) was real evidence at the time it was written, and catching "we no
longer need this" the same day — before it reached Vercel as a
confusingly-named secret — is exactly what a fast governance loop should do.

### 4. A tracked binary file needs a different audit method than a tracked text file
The pre-push secret audit (`git log --all -p | grep ...`) is blind to
anything inside a binary blob — git's diff output for binary files just says
"Binary files differ," it never dumps content for grep to see. A
`web-app-vibe-coding-journal.zip` tracked since the first commit could have
silently defeated the entire text-based audit if it had contained a secret.
It didn't (confirmed: the current version is GitHub's own auto-generated
"Download ZIP" of the exact commit just pushed — provably a strict subset of
already-audited content, identifiable by the commit SHA printed at the top
of its file listing; the original first-commit version was an early project
scaffold export, unrelated). **Commander candidate:** "A pre-push secret
audit must separately account for tracked binary files — grepping diff text
does not cover them. List all tracked binaries (`git ls-files` filtered by
non-text extensions, or `git diff --stat` binary markers) and either inspect
them directly (e.g. `unzip -l` for archives) or confirm they're excluded
from the audit's scope explicitly, not silently."

### 5. `node_modules` and a stray `.zip` are the same underlying mistake at different scales
Both were generated/derived artifacts that ended up tracked in git from the
very first commit, discovered only during a pre-push audit rather than
caught at the time. `node_modules` was 89MB/19,687 files (fixed via
`git filter-repo`, one-time approved exception); the zip was 305KB/1 file
(fixed via plain `git rm --cached`, no rewrite needed — small enough that a
rewrite wasn't worth the risk). Same category of oversight, different
remediation cost — worth remembering that catching this kind of thing early
(before the *next* derived artifact accumulates) is cheaper than catching it
at first-push time.

### 6. Live-verifying a platform assumption caught a bug worse than expected
Assumed (reasonably, from the original project brief) that the daily cron
should fire at 07:00 Sarajevo time. `vercel.json` declared `0 9 * * *` (09:00
UTC). The actual mismatch — verified by computing it, not eyeballing it —
was 09:00 UTC = **11:00** Sarajevo (summer/DST, UTC+2), a 4-hour miss, not
the 2-hour miss that would result from the more obvious "used UTC hour
literally" mistake. Corrected to `0 5 * * *`. This was caught only because
the Director explicitly asked for the exact math to be shown, not just
"looks about right."

### 7. Vercel's own current docs, fetched live, surfaced two things training data wouldn't have caught
Fetched `vercel.com/docs/cron-jobs/manage-cron-jobs` directly (dated
2026-06-02, current relative to today) rather than relying on
memory (cutoff January 2026, ~6 months stale for a platform that ships
continuously):
- **Confirmed, not assumed:** Vercel automatically sends
  `Authorization: Bearer <value>` using the exact env var named
  `CRON_SECRET` when invoking a cron job — our route's check already matches
  this convention with zero additional wiring needed.
- **New, load-bearing constraint found:** this project is on the **Hobby**
  plan (confirmed by decoding the `VERCEL_OIDC_TOKEN` JWT claims — real
  verification, not an assumption from the account name). Hobby-tier cron
  jobs are **not** minute-precise — Vercel may invoke anywhere within the
  declared hour. Even with the schedule now correctly set to `0 5 * * *`,
  the actual daily run could land anywhere in the 07:xx Sarajevo hour, not
  exactly 07:00:00. This is a platform limitation no amount of correct cron
  syntax overrides — worth stating plainly rather than implying false
  precision.

### 8. A static UTC cron schedule silently drifts across DST boundaries
`0 5 * * *` is only "07:00 Sarajevo" while Sarajevo observes UTC+2 (until
late October 2026). After the DST changeover it becomes 06:00 local until
someone manually updates the schedule to `0 6 * * *` — and back to
`0 5 * * *` again around late March 2027. Vercel Cron has no DST-aware
scheduling primitive; this is an inherent limitation of any UTC-based cron
serving a project whose audience is in a DST-observing timezone. Flagged
here as a recurring operational reminder, not solved this sprint (no
automation exists for it — would need either a scheduled reminder or a
small serverless function that self-adjusts, neither in scope now).

### 9. "Sensitive"-typed Vercel env vars cannot be read back — `vercel env pull` returns a placeholder, not the value

**Discovered later** (schedule-gate/deploy work, see HANDOFF_SCHEDULE_GATE.md),
recorded here because it's a general Vercel-platform finding, not specific to
that feature. `CRON_SECRET` is stored as a **Sensitive** env var — by design,
Vercel never returns its plaintext again to anyone, through any channel
(dashboard, CLI, API), once set. `vercel env pull` still exits 0 and writes a
line for it, but the value is the literal 13-character string `[SENSITIVE]`,
not the real secret — indistinguishable from a real value unless you
specifically check for it.

This caused a real, unnoticed bug: when copying `CRON_SECRET` from Vercel
Production to GitHub Actions (so the external hourly trigger could
authenticate), the pulled value was piped straight into `gh secret set`
without inspecting it first. The GitHub secret silently became the literal
string `"[SENSITIVE]"`. This was reported as fixed without independent
verification against the live endpoint, and only surfaced when a real
scheduled run returned `401 Unauthorized` — a full round trip later than it
should have.

**Rule for any future work with Sensitive-typed Vercel env vars:** never
`vercel env pull` an existing Sensitive value to copy it elsewhere. It is
architecturally unrecoverable once set — the only correct method to
replicate a Sensitive value across platforms (e.g. Vercel → GitHub Actions)
is to generate a **new** value and set it identically on both sides in the
same step, then verify with a real request before considering it done. This
applies to any future Sensitive var, not just `CRON_SECRET`.

**Process gap this also exposes:** "piped the value, command exited 0" is
not verification. A fix touching a live secret/credential should be
confirmed with a real end-to-end request before being reported as done, the
same discipline already applied to DoD proof elsewhere in this project.

### 10. Future-dated test fixtures left in the production DB silently blocked every real cron run since

**Discovered later** (schedule-gate/deploy work, see HANDOFF_SCHEDULE_GATE.md).
During Sprint 06 admin-UI click-through testing (2026-07-18, 14:13–14:49
UTC), 8 `daily_reports` test rows were inserted directly with **future**
`date` values (`2026-07-21` through `2026-10-02`) so each manual
approve/reject test would have its own row without colliding with the
others. None were cleaned up afterward.

Once the real hourly cron went live, its idempotency check
(`getDailyReportByDate(todayDate)` — added specifically to prevent
double-running the pipeline on the same day) started reading these test
rows as "today's report already exists" as soon as the real calendar date
caught up to each one, and skipped the pipeline entirely. `2026-07-21`'s
target-hour run returned a clean `{"skipped":true,"reason":
"already_generated_today"}` — indistinguishable, from the log alone, from
a genuinely completed prior run. This meant the real pipeline (RSS fetch,
dedup, Quality Engine, Gemini calls) had never actually executed in
production, discovered only by directly inspecting the DB row's
`created_at` (three days old) and `markdown` (labeled "Email Test 2") —
not by anything in the cron's own output. `2026-07-22` was already primed
to repeat the same false-skip the next day, and 6 more rows sat further out
through October.

**Rule going forward:** any test/fixture row inserted into a production
table during manual testing must be either (a) deleted in the same session
it was created, (b) tracked as an explicit DoD/cleanup checklist item
before the sprint closes, or (c) seeded with a date that can never
naturally collide with real data (e.g. `1970-01-01`, or a dedicated
`is_test` flag) — never a near-future date that looks exactly like what
real production data will eventually look like. This applies beyond
`daily_reports` to any table where a "does this already exist for
today/this key" check gates real work.

### 11. Discarding an entire error body to protect a secret also destroys legitimate diagnostics

**Discovered later**, investigating why 23/30 articles hit Gemini key
exhaustion in the real production pipeline test above. `gemini-provider.ts`
deliberately never logged Gemini's error response body at all — reasonable
intent (the key must never leak into logs), but the implementation threw
away the *whole* body, including fields that carry zero secret material:
`quotaId` (e.g. `GenerateRequestsPerDayPerProjectPerModel-FreeTier` — which
alone distinguishes a per-day cap from a per-minute one), `quotaValue`,
`retryDelay`, and the API's own `status` string. Result: post-mortem
analysis of *why* a run failed was impossible from any log, complete or
not — the only way to get this data was a fresh live diagnostic call after
the fact, hours later, wasting more quota to find out what the original
failure already knew and had thrown away.

**Fix:** `extractSafeQuotaInfo()` now pulls exactly that small allowlist of
fields into the existing `[GEMINI]` warn lines — never the key, never the
request URL, never the free-text `message` field (redundant with the
structured fields and not on the allowlist). Verified live: triggered a
real 429 through `GeminiProvider.summarize()` locally, confirmed the log
line contains `quotaId=...`/`retryDelay=...`, and confirmed zero
occurrences of the key prefix `AIzaSy` anywhere in the full server output.

**Rule going forward:** "never log the secret" and "never log anything
from the error response" are not the same rule — conflating them trades
away debuggability for a safety margin the narrower rule already provides.
When redacting a response body for logging, allowlist the specific fields
known to be safe rather than blanket-discarding everything.

### 12. Gemini free-tier RPD quota resets at midnight Pacific — not at the configured operations-timezone midnight, and not a fixed offset from it

Confirmed directly against Google's current docs (`ai.google.dev/gemini-api/docs/rate-limits`,
fetched live): *"Requests per day (RPD) quotas reset at midnight Pacific
time."* Also confirmed live via a real 429 body during this investigation:
`quotaId: "GenerateRequestsPerDayPerProjectPerModel-FreeTier"`,
`quotaValue: "20"` — i.e. this project's actual free-tier cap is 20
requests/day/model/project, not a number pulled from generic web docs.

Computed via real IANA data (`Intl.DateTimeFormat`, not manual UTC
arithmetic — Pacific and the configured operations timezone (see
`OPERATIONS_TIMEZONE`, DECISION_LOG.md PDL-015) don't share a DST
calendar):
- **Most of the year:** midnight Pacific = **09:00 local** in the
  configured operations timezone (both zones in DST together, e.g.
  `2026-07-21`, or both out together, e.g. `2026-01-15`).
- **During the two US/EU DST-mismatch windows** (roughly mid-March, when
  the US has already sprung forward but the EU hasn't yet; and roughly
  late-October to early-November, when the EU has already fallen back but
  the US hasn't yet): midnight Pacific = **08:00 local** — a full hour
  earlier than the rest of the year. Verified for `2026-03-10` and
  `2026-10-28` specifically.

**Why this matters operationally:** any manual Gemini-quota testing done
close to the actual scheduled target-hour run (see `lib/cron/schedule-gate.ts`)
risks consuming the same day's quota the real run will need — the reset
does not happen at the operations timezone's own midnight, so "wait until
tomorrow, local time" is not when quota actually refreshes. Plan manual
testing with the real 08:00/09:00-local Pacific-midnight reset in mind, not
local intuition about "a new day."

### 13. A third-party trigger's own client-side timeout is not a pipeline-kill signal — and its failure notification will false-alarm on every real run

Investigated whether an external scheduler (cron-job.org, added as a
second, more reliable trigger after the GitHub Actions scheduling-gap
finding) with a 30s request timeout would actually terminate the
`/api/cron/daily-digest` pipeline mid-run, since a real run with a full
RSS set takes 105s+. Tested directly against production: forcibly
disconnected the client at 25s (`curl --max-time 25` → exit 28, no
response received), then verified independently via a direct DB query
that server-side execution completed ~105s after the call started —
**79 seconds after the client had already given up.** Vercel functions
keep running after the client disconnects; the client's timeout is not a
kill signal. No architecture change (e.g. an immediate-202-plus-`waitUntil`
pattern) was needed.

**Direct consequence, easy to miss:** because every real pipeline run
genuinely exceeds cron-job.org's 30s timeout, cron-job.org's own
"execution of the cronjob fails" notification will fire on **every single
real run**, success or not — not because anything is actually wrong, but
because its own client gave up waiting before the server was done. Initially
configured to enable that notification (reasonable-sounding default);
reversed once this was understood, since normalized false alarms are worse
than no alarm — they train you to stop reading them, which is exactly when
a real failure slips through unnoticed. cron-job.org is used only as a
trigger mechanism here; the actual success/failure signal comes from the
application's own logic (`held_for_review` → email alert, plus direct DB
inspection), never from the third-party scheduler's own opinion of whether
the call it made looked successful.

**Rule going forward:** when wiring any external trigger/monitoring service
to a long-running endpoint, check whether the service's own
success/failure notification is derived from *its own request timeout*
rather than the actual work's outcome — if so, and the timeout is shorter
than the real expected duration, that notification is structurally
guaranteed to misfire and should be disabled, not tuned.

### 14. `isPastCatchUpDeadline` has a permanent local-midnight blind spot — KNOWN BUG, NOT YET FIXED, PRIORITY #1

**Status: open.** `lib/cron/schedule-gate.ts`'s catch-up check
(`local hour >= 12`) wraps to `0` at the configured operations timezone's
own local midnight. Because the `daily_reports.date` field is keyed on the
**UTC** calendar date, not local calendar date, there is a recurring
~2-hour window — local `22:00–00:00` — where local hour has already
wrapped to `0`/`1` (so `isPastCatchUpDeadline` returns `false` again) while
the UTC calendar date that "today" actually refers to hasn't rolled over
yet. If neither external trigger has produced a report by the start of
that window, catch-up becomes structurally unable to fire for the
remainder of that UTC day — not delayed, permanently missed until
tomorrow's target hour.

**First observed real-world consequence:** `2026-07-22` most likely ended
with zero report generated. Not because of a logic error in the deployed
code (reproduced and confirmed `isPastCatchUpDeadline` returns the
mathematically correct value for every timestamp tested) — the catch-up
fix itself only went live at local-time-equivalent `21:49 UTC` (see finding
#13's commit `3f57297`), giving an 11-minute window before the blind spot
began at local `22:00`/`22:00 UTC`, with no trigger confirmed to land in
that gap.

**Not fixed tonight, by design** — Director's explicit call: document and
stop, no live changes this late, no real users yet so a missed day is
acceptable short-term. **This is priority #1 for the next session, before
anything else.**

**Likely direction for the fix** (not committed to, needs actual
implementation): base the catch-up decision on remaining time before UTC
date rollover rather than pure local-hour arithmetic, or track "has today's
target hour already passed" independently of local-hour wraparound —
either way, the fix needs to be live-tested across the same local-midnight
boundary that caused this, not just the noon boundary already covered by
finding #13's test suite.

---

## Process Notes

- **Governance work (CONSTITUTION P-13 revision, new P-19, PDL-014
  superseding PDL-009) ran in parallel with Sprint 06's actual code scope**
  and is tracked separately — it was never part of SPRINT_06.md's own scope
  (RSS parser / Gemini keys / deploy prep), it just happened during the same
  session. Not conflated with this sprint's DoD.
- **Two `CONSTITUTION_ADDENDUM*.md` files arrived mid-session, unannounced,
  both times.** Both times: confirmed the file didn't exist before assuming
  content, read it in full before merging anything, never fabricated
  governance content. This is now a established, repeatable pattern for this
  project — worth naming explicitly since it's happened twice.
- Every `vercel env add` this sprint used the `grep '^VAR=' .env.local | cut
  -d'=' -f2- | vercel env add VAR production` pattern — the value is
  extracted and piped entirely within one shell execution, never typed
  literally into a command by the assistant, so it never appears in any
  visible tool-call transcript. `CRON_SECRET` additionally generated inline
  and `unset` immediately after, matching the Director's exact requested
  bootstrap.md-derived pattern.

---

## DONE_CHECKLIST

See `sprints/SPRINT_06.md` Definition of Done for the full item-by-item
list with inline evidence. Two items remain open by design (production
deploy, cron-fires-on-schedule verification) — deferred to a dedicated
deploy conversation, not gaps in this sprint's own scope.

---

*Vibe-Coding Journal — Sprint 06 — governed by Commander v1.2. Commander-candidate items above feed the v1.3 improvement backlog (github.com/IDSS123a/commander).*
