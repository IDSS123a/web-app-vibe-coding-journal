# CHANGELOG — Vibe-Coding Journal

Started 2026-09-13 (project began 2026-07-18; earlier work is fully
recorded in `sprints/`, `DECISION_LOG.md`, and `corrections/`, not
reconstructed here retroactively — this file covers from its own start
date forward). One entry per user-visible or operationally significant
change, newest first.

## 2026-09-19

- **The daily pipeline now finishes (PDL-058).** Today's report did not appear because collecting from the sources took minutes and the run was killed. Collection now takes about half a minute, dead sources come back on their own after a pause, every hour does useful background work, and two triggers can no longer run at once. Articles are judged for relevance in batches, so the free AI quota stretches much further, and a second Gemini model is used when the first one's daily quota is spent.
- **No AI writing tells anywhere (PDL-057).** The spaced em dash is replaced by a comma everywhere a reader can see it: pages, emails, AI answers (cleaned before they are stored) and every stored article, report, lesson and quiz. A build check keeps it that way.

- **Dashboard (PDL-056):** the Daily Report now opens with a numbered list of the day's headlines (tap one to jump to it), and while you read, a "↓ N more below" button shows how many articles are left and takes you to the next one.

- **Every screen size (PDL-055):** the site was audited in a real browser at phone, tablet, laptop and wide-screen sizes. Fixed: the top menu overflowing on tablets and phones held sideways (now a hamburger below 1024 px), the admin menu running off a phone screen, the home-page headline being cut off on phones, article cards leaving a narrow text column on phones, tables clipped on small screens, and — on devices set to dark mode — admin pages showing dark boxes and an invisible heading (the app is now consistently light). All buttons and links are at least 44 px to tap. The audit is repeatable: `npm run audit:responsive`.

- **Reliability (PDL-054):** the Vibe-Coding Assistant (and the daily pipeline) no longer fails outright when one Gemini key answers "service unavailable" — the next key is tried. Cron endpoints now refuse every request if their secret is not configured (previously a built-in default). Security headers added (framing blocked, no MIME sniffing, referrer/permissions policies; a Content-Security-Policy in report-only mode). Dead login code and `bcryptjs` removed. The browser tab now shows the site icon (favicon + Apple touch icon). The Vibe-Coding Assistant now shows live progress while generating (it takes 20–40 s), says plainly when the AI service is busy and that nothing was counted against the daily limit, and keeps your answers in the form after a failure.

- **Paywall (PDL-053):** access now follows the subscription, enforced on the server. No payment → no access; $10 Basic → Daily Report, Archive, Bookmarks; $50 Premium → also University, Dictionary, Assistant. The Daily Report and Archive were readable without logging in (the article text sat in the page source); they are now served only by `/api/reports/*` after the token and subscription are verified. Bookmarks require an active subscription too. The dashboard's empty state no longer shows a fake "Auto-published" report.

- **SECURITY (high):** registered users could read all University lessons, quiz answers and unpublished Daily Reports directly through the database API; the ten broad read policies were removed (migration 022, PDL-052). The Daily Report itself is still publicly readable — open decision, see the stress-test plan (S1b).

## 2026-09-18

- **SECURITY (critical):** fixed a database-policy hole that let any signed-in user set their own role/tier/status (migration 021). See PDL-051. Full stress-test report and next-session plan: `sprints/STRESS_TEST_2026-09-18_AND_PLAN.md`.
- **SECURITY (critical):** fixed an authentication bypass — the server accepted hand-built tokens with an invalid signature and treated them as the user (or admin) named inside. Tokens are now verified by Supabase Auth. See PDL-050.

- **Critical fix (P-0):** off-topic articles that the relevance gate had
  excluded were still being published in Daily Reports and were also
  holding every report for review, so no report had ever auto-published.
  Excluded articles are now kept out of the report. The approved
  2026-09-18 report was cleaned of its 6 off-topic articles. See PDL-049.
- **Feature:** `/set-password` for admin-invited accounts.
- **Feature:** admin can change an existing user's tier from
  `/admin/users` (tier only; status and expiry untouched, with a
  confirmation). Account creation now reports the real reason for the two
  failures seen in testing (email sending limit reached, email already
  registered) instead of a generic error.
- **Ops (Supabase Auth config, no code):** custom SMTP via Resend
  (`noreply@idss.ba`), production Site URL, email limit raised to 30/hour,
  branded invite email template.

- **Feature:** Admin Console & Subscription Lifecycle — `/admin/users`
  (list, usage and payment history, block/unblock, create accounts by
  invite into the $10 or $50 tier), 7-day and 2-day subscription-expiry
  emails (daily cron), and a Basic→Premium upgrade for the $40
  difference. See `specs/admin-console-and-subscription-lifecycle/` and
  `DECISION_LOG.md` PDL-048 (includes what is not yet live-tested).
- **Fix:** Assistant generation no longer aborts on the shared 25s Gemini
  timeout (own 90s limit for that single call only).

## 2026-09-16

- **Feature:** shipped the Vibe-Coding Assistant (`/assistant`, Premium
  $50-tier only) — resolves the long-standing P-19 "Future Scope"
  entry. A structured wizard turns a vibe-coder's project idea into a
  copy-pasteable initial prompt for Claude Code, following the
  Director's book's "Blueprint" format (Domain/Scenario/Goal →
  per-pillar explanation → delimited prompt → Mermaid diagram →
  next steps). Generation history is saved per user. Bounded to a
  daily per-user and global generation cap to protect the shared
  free-tier Gemini quota; usage is visible to admins via
  `/api/admin/assistant-usage`. See `specs/prompt-blueprint-builder/`
  and `DECISION_LOG.md` PDL-046/PDL-047.

## 2026-09-13

- **Sources:** grew active content sources from 2 to 14 — added Reddit
  (r/ChatGPTCoding, r/LocalLLaMA, r/artificial), OpenAI News, Google AI
  Blog, Vercel Blog, four targeted Hacker News queries (Claude Code,
  GitHub Copilot, Windsurf, Cursor AI), and Lobsters' AI tag. Re-enabled
  a properly-targeted Hacker News source that had been silently
  disabled since July. Fixed a real bug where an RSS fetch with no
  User-Agent header got rate-limited by Reddit.
- **Fix:** the daily digest no longer publishes an empty "0 articles"
  report when source collection fails entirely (e.g. a Supabase
  timeout) — it now skips and lets the next hourly run retry instead.
- **Planning:** reconciled a large "Intelligence Engine" proposal
  against two standing decisions (no chatbot RAG/knowledge-graph;
  free-only AI cost) — see `specs/vibe-coding-intelligence-engine/ROADMAP.md`.

## 2026-09-11

- **Critical fix:** the content pipeline never checked whether an
  article was actually about vibe-coding at all — added a relevance
  gate (P-0) that does.
- **Fix:** Gemini API key rotation aborted the whole call when one key
  hit a deprecated-model error instead of trying the rest.
- **Security:** patched a CRITICAL unauthenticated RCE in Next.js
  (15.5.20 → 15.5.25).
- **New:** Bookmarks and Archive, end-to-end (previously empty stub
  files with no UI or API).
- **New:** Hold-Gate Calibration admin page; fixed a bug where applying/
  dismissing a nonexistent suggestion silently returned success instead
  of a 404.
- **New:** this project's first automated test suite (64 tests) and its
  first CI pipeline (typecheck/test/build on every push).

## 2026-09-09 and earlier

See `sprints/SPRINT_01.md` through `SPRINT_09.md`, `DECISION_LOG.md`,
and `corrections/` for the complete history — registration/auth,
the content pipeline, the admin review queue, Gemini-powered
summarization, subscription/trial data model, and PayPal checkout.
