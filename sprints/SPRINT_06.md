# SPRINT_06 — RSS Parser Fix, Dev/Prod Gemini Key Separation, Vercel Deploy
# Vibe-Coding Journal
# Status: APPROVED 2026-07-18 — implementation in progress

---

## Scope — IN

### 1. RSS parser CDATA + Atom fix (`features/sources/actions.ts`)

**Root cause confirmed by fetching the real feeds (2026-07-18), not guessed:**
- `hnrss.org` (both configured HN sources) wraps `<title>` and `<description>`
  in `<![CDATA[...]]>`. The current regex `/<title>([^<]+)<\/title>/` requires
  a non-`<` character immediately after `<title>`, but the next character is
  `<` (the start of `<![CDATA[`) — the match fails entirely, `titleMatch` is
  `null`, and the whole `<item>` is silently dropped (`titleMatch?.[1] &&
  linkMatch?.[1]` guards the push). This is deterministic on any CDATA title,
  not flaky.
- `github.blog/feed/` does **not** CDATA-wrap `<title>` (only `<dc:creator>`
  and `<category>` do) — which is exactly why it parsed successfully in
  Sprint 04/05 while hnrss consistently returned 0 articles. Confirmed by
  diffing the two feeds' raw XML side by side.
- Separately observed: `hnrss.org` returned an unrelated `502 Bad Gateway` on
  one fetch during this investigation — a transient upstream hosting issue,
  not a parser bug. **Must produce a distinguishable error message from a
  parse failure** (see Fix, below) so a future "0 articles" doesn't get
  misdiagnosed as the parser again, and so P-7 health monitoring can treat
  the two cases differently: a 502 is transient (retry next cadence, count
  toward `failure_count` as today), while a parse failure was permanent
  until this fix (would have kept failing every run, not something a retry
  ever resolves) — the error message itself must say which kind it is.

**Fix (RESOLVED — Director confirmed 2026-07-18): use `rss-parser`, not a
regex extension.**
- **Decision:** adopt the `rss-parser` npm package instead of extending the
  hand-rolled regex parser further.
- **Why over `fast-xml-parser`:** `fast-xml-parser` is a generic XML→JS
  parser — it would solve CDATA (real parser, not regex) but has no RSS/Atom
  awareness; the `<item>` vs `<entry>`, `<link>text</link>` vs
  `<link href="...">`, `<pubDate>` vs `<updated>` normalization would still
  have to be hand-written, solving only half the bug class. `rss-parser` is
  purpose-built for exactly this: internally uses a real XML parser (CDATA
  handled for free) **and** normalizes RSS 2.0 and Atom to the same output
  shape (`title`, `link`, `pubDate`/`isoDate`, `contentSnippet`/`content`,
  `guid`), which maps directly onto the existing internal `ParsedArticle`
  shape with minimal glue code.
- **This is the second bug from the same root-cause class** (custom
  string/regex parsing standing in for a real library — the first was the
  dedup self-match/RLS issue class from Sprint 04). Logged as its own PDL
  per M-12 (don't silently repeat a known bug class without recording the
  pattern).
- Atom-format handling comes for free from `rss-parser`'s normalization — no
  separate hand-written Atom code path needed. **No currently configured
  source is Atom-format** (all 4 are RSS 2.0); still exercised in DoD via a
  realistic Atom sample, since the library claims to support it and that
  claim gets verified, not assumed.
- **Error-message distinction (P-7), built into the fix, not just diagnosed:**
  `parseFeed`/`collectArticlesFromAllSources` must produce a different error
  string for (a) the HTTP-level reachability failure already checked before
  parsing (unchanged — `checkSourceReachability` HEAD request; a 502 there
  already surfaces as `"Source unreachable (failure N/3)"`) vs. (b) a parse
  failure — bad/unparseable XML from `rss-parser` after a successful fetch —
  which must be labeled distinctly (e.g. `"Feed parse error: <library
  message>"`) so it reads unambiguously as "the feed responded but its
  content is broken," not conflated with reachability.

### 2. Dev/prod Gemini key separation — SUPERSEDED same day by PDL-013

**Original plan (below) was implemented, then deliberately reverted.**
After PDL-012 established that there is genuinely only **one** 8-account
key set (not two), the dev/prod branch this section describes became
complexity with no corresponding need — and a `_DEV_`-named secret in the
Vercel Production dashboard would read as a mistake to anyone reviewing
it later. See DECISION_LOG.md PDL-013 for the full rationale. Current
state: `lib/ai/gemini-provider.ts` reads a single flat `GEMINI_API_KEY_1..8`
list, no `VERCEL_ENV` check, no `_DEV_` name, no fallback branching.
SPRINT_05_LESSONS finding #7 (shared quota risk) is addressed at the
governance level instead — PDL-012 states this is deliberate, temporary,
testing-only use, with payment/subscription work (P-13/P-16) blocked on
resolving it — not by a code-level dev/prod split that implied a
separation which didn't actually exist.

<details>
<summary>Original plan (historical, no longer implemented)</summary>

- New env var pair: `GEMINI_API_KEY_DEV_1` through `GEMINI_API_KEY_DEV_8`
  (mirrors the existing `GEMINI_API_KEY_1..8`, which become the production-only
  set).
- **Selection logic, confirmed:** `process.env.VERCEL_ENV === "production"` →
  load `GEMINI_API_KEY_*` (prod). Anything else (local `next dev`, Vercel
  preview deployments, or `VERCEL_ENV` unset/undefined — explicit fallback
  case for local work) → load `GEMINI_API_KEY_DEV_*` first, falling back to
  the prod set only if no dev keys are configured at all (so an unconfigured
  local `.env.local` doesn't silently break, but a developer who *has* set up
  dev keys never touches production quota). Directly resolves
  SPRINT_05_LESSONS finding #7.

</details>
- No change to the fallback-on-error rotation logic itself — only which key
  array gets loaded.

### 3. Vercel deploy — cron actually runs on schedule

`vercel.json` already declares the cron (`0 9 * * *` → `/api/cron/daily-digest`),
written in Sprint 04 but never deployed. This sprint activates it for real.

**Mechanism (RESOLVED — Director confirmed after reviewing the exact skill
steps, read directly from
`~/.claude/plugins/cache/claude-plugins-official/vercel/0.44.0/commands/{deploy,bootstrap,env}.md`,
not assumed):**
- Primary flow: the `/deploy` command — preflight (CLI present, project
  linked else `vercel link`, uncommitted-changes check, prod-only
  observability warnings), explicit plan statement before executing
  (**the skill itself refuses to run `vercel --prod` without the user's
  clear "yes"** — this is a built-in gate, not something layered on top),
  then verification (`vercel inspect`, `vercel logs`, a post-deploy error
  scan for production).
- `/env add <NAME>` for each required variable, one at a time, before the
  deploy — production mutations require explicit confirmation per variable
  (built into the `/env` command).
- `CRON_SECRET` generation follows the pattern from `/bootstrap`'s
  `AUTH_SECRET` step: generate high-entropy value, pipe directly into
  `vercel env add CRON_SECRET production` without ever printing it to the
  terminal, then `unset` the local shell variable. **Full `/bootstrap` flow
  is NOT used** — it provisions Postgres/Neon via Vercel integrations, which
  this project doesn't need (Supabase is already configured and working).
- This step touches a shared, external system (a live Vercel project). Each
  of the following remains a distinct confirmation point, not batched
  through silently, even though this document's scope is now approved:
  1. Vercel authentication (Director's own account).
  2. Project link/creation.
  3. Each environment variable added: `NEXT_PUBLIC_SUPABASE_URL`,
     `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
     `CRON_SECRET` (freshly generated, never the local dev placeholder),
     `RESEND_API_KEY`, `REVIEW_QUEUE_EMAIL`, `RESEND_FROM`, and
     `GEMINI_API_KEY_1..8` (production set only — `_DEV_` keys never
     uploaded to Vercel).
  4. The actual `vercel --prod` invocation — explicit go-ahead required
     immediately before this specific step, per the `/deploy` skill's own
     built-in rule.

---

## Scope — OUT (explicitly, do not touch this sprint)

- Cookie-based SSR sessions / middleware admin guard upgrade — unchanged,
  documented upgrade path only.
- Any further AI provider work (already resolved, Sprint 05 complete).
- Bosnian/non-English hype words — PDL-007 stands.
- Personalization, bulk admin actions, admin role management UI.
- Full `/bootstrap` flow (Postgres/Neon provisioning) — not needed, Supabase
  already configured.
- Any git history rewrite — restated per PROCESS_LESSONS, no exceptions.
- **Changing `GEMINI_API_KEY_1..8` (the current keys) into the new prod-only
  role silently** — they already exist and already work in production
  naming; this sprint does not rename or move them, it only adds the new
  `_DEV_` set alongside them and teaches the provider which to read.

---

## Constitution References

- **P-1.1** (Fail Loudly): a feed parse failure (CDATA miss, Atom mismatch,
  upstream 502) must be visible in `sourceCollector.errors`, never silently
  yield 0 articles with no explanation.
- **P-7** (Source Health Monitoring): the parsing step's error output must
  now distinguish a transient reachability failure (502, timeout — retry
  next cadence) from a parse failure (was permanent until this fix, not
  something a retry would have resolved) — the message text itself carries
  this distinction, not just the diagnosis in this document.
- **M-12** (don't silently repeat a known bug class): `rss-parser` adoption
  logged in DECISION_LOG.md as the second instance of "custom
  string/regex parsing standing in for a real library" — the pattern itself
  is the point of the log entry, not just this one fix.
- **SPRINT_05_LESSONS #7**: this sprint's item 2 directly resolves the
  documented dev/prod quota risk.

---

## Decisions Confirmed by Director (2026-07-18)

1. RSS fix: `rss-parser` library (not regex extension, not `fast-xml-parser`)
   — see item 1 rationale above.
2. Dev/prod key signal: `VERCEL_ENV === "production"`, explicit fallback to
   dev keys when `VERCEL_ENV` is undefined (local work).
3. Deploy mechanism: `/deploy` skill (primary) + `/env add` per variable +
   `/bootstrap`'s secret-generation pattern for `CRON_SECRET` only — exact
   steps enumerated above from the real skill files, not assumed.
4. `CRON_SECRET`: freshly generated, Vercel production env only, never in
   `.env.local` or the repo.

---

## Definition of Done

Full Commander DONE_CHECKLIST.md applies, plus Sprint 06 specifics:

- [ ] `rss-parser` added as a dependency; PDL logged in DECISION_LOG.md
      (M-12 pattern: second instance of custom parsing vs. a real library)
- [ ] **RSS fix proof — hard requirement, real feed, not synthetic:**
      run the fixed collector against the live `hnrss.org/frontpage` feed
      (the actual feed that fails today) and show a real before/after: 0
      articles before → N real articles after, with at least one shown
      example article's title correctly extracted from its CDATA wrapper
- [ ] GitHub Blog collection still works after the fix (regression check —
      the fix must not break the feed that already worked)
- [ ] Atom-format normalization verified against a real or realistic Atom
      sample (library claims support — claim gets verified, not assumed)
- [ ] `sourceCollector.errors` text distinguishes a reachability failure
      (unchanged HEAD-check path) from a parse failure (new — labeled
      distinctly, e.g. `"Feed parse error: ..."`) so P-7 monitoring and any
      future debugging never conflates the two again
- [x] ~~`GEMINI_API_KEY_DEV_*` used in local/preview, `GEMINI_API_KEY_1..8`
      used only when `VERCEL_ENV === "production"`~~ — superseded by
      PDL-013 same day: single flat `GEMINI_API_KEY_1..8` list, no branch.
      Original dev/prod selection logic WAS proven live before removal
      (both directions, plus the symmetric-fallback fix) — see
      SPRINT_05_LESSONS addendum and git history for that evidence; not
      re-proven here since the branch it proved no longer exists.
- [ ] `tsc --noEmit` / `next build` clean
- [ ] Vercel project linked, env vars set (prod secrets only where
      appropriate — dev Gemini keys never uploaded), production deploy
      completed **only after explicit Director go-ahead immediately before
      that specific step**
- [ ] Cron actually fires on Vercel's schedule — verified via Vercel's own
      deployment/cron logs showing a real invocation, not just that
      `vercel.json` is syntactically present
- [ ] `CRON_SECRET` rotated to a real value for production, confirmed not
      equal to the local dev placeholder
- [ ] corrections/SPRINT_06_LESSONS.md created
- [ ] HANDOFF_SPRINT_06.md created, scoped to this sprint only

---

## Approval Record

Scope approved by the Director 2026-07-18, all four open decisions answered
directly (RSS library choice, dev/prod key signal, deploy mechanism after
reviewing the real skill file contents, CRON_SECRET generation practice) —
this sprint's own gate, per SPRINT_04_LESSONS finding #15 and
PROCESS_LESSONS, not bundled with prior sprints. Deploy remains subject to
per-step confirmation during implementation (auth, link, each env var,
the final `--prod` invocation) regardless of this scope approval — those are
distinct confirmation points, not pre-authorized by approving this document.

---

## Handoff Note Template (fill at sprint end)

```
HANDOFF NOTE — Sprint 06
Completed: [...]
Not completed: [...]
Open risks: [...]
Technical debt: [...]
Next sprint: [...]
```

---

*Vibe-Coding Journal — Sprint 06 — governed by Commander v1.2*
