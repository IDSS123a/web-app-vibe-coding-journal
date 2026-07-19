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
