# CHANGELOG — Vibe-Coding Journal

Started 2026-09-13 (project began 2026-07-18; earlier work is fully
recorded in `sprints/`, `DECISION_LOG.md`, and `corrections/`, not
reconstructed here retroactively — this file covers from its own start
date forward). One entry per user-visible or operationally significant
change, newest first.

## 2026-09-26

- **Fixed the real reason the Daily Report and University lesson generation were stuck, even with 10 Gemini keys (PDL-090).** When one key took too long to answer, the app used to give up completely instead of trying the next key. Now it moves on, the same way it already did for a key that was simply out of quota.
- **Fixed a second cause of the same stuck report (PDL-090).** With hundreds of articles backed up waiting for a relevance score, scoring them used the entire time budget every run, so summarising (the step that actually makes a report possible) never got a turn. Summarising now always gets roughly half the time, whatever the backlog's size.
- **Fixed password reset e-mails not arriving (PDL-090, configuration only, no code change).** Two separate problems in the mail server settings: an outdated key, then a sender address on a domain that was never verified for sending. Confirmed live: the e-mail now arrives and the link works.

## 2026-09-25

- **Fixed a hardcoded limit that would have silently ignored new Gemini keys (PDL-088).** The AI provider only ever looked for up to 8 keys; it now looks for up to 30, so keys added to relieve daily quota limits actually get used.
- **Fixed why the Daily Report had stopped (PDL-087).** No new report had been generated in three days: collecting from 30 sources could take long enough that summarising never got its turn before time ran out. Sources now wait less before being skipped, and an article that got scored but never summarised is no longer permanently skipped.
- **Fixed two broken Dictionary terms, and why approving a lesson could create more (PDL-086).** "Auto-Invocation" and "Skill Listing" now have a topic, a level and a link back to the lesson that proposed them. Approving a University lesson with new terms now files them the same way every other new term is filed, instead of silently skipping that step.

## 2026-09-22

- **The fixed corner credit line removed (PDL-085).** The small "Prompt Hero Studio™" badge that used to sit in the bottom-right corner of every page is gone. The same studio name and contact e-mail are already in the footer at the bottom of every page, next to the Terms, Privacy, Refund and Subscription links.
- **Fixed the welcome page (PDL-084).** After a payment the "Welcome to Vibe-Coding Journal" heading is properly centred, and the feature tiles in a row now share the same height.
- **Admin panel checked end to end, and the sign-in heading fixed (PDL-083).** Changing a user's tier now shows its confirmation, admins have an Admin link back into their panel, the dark admin pages no longer have unreadable text, there is an AI usage page, and the heading of the sign-in and register cards no longer breaks inside a word on wide screens.
- **Ready for launch (PDL-079 to PDL-082).** The site is prepared for its own address, real PayPal payments and the law: Terms of Use, Privacy Policy, Refund Policy, Subscription and renewal, and a cookie notice; a page where you can download all your data or delete your account; Forgot password; a free-trial banner and a renewal banner; and protection against paying twice. New: certificates of completion you can print or save as a PDF and anyone can verify, a Try it live sandbox task in every Prompt School chapter, and Scan mode for the Daily Report.

## 2026-09-21

- **Wider screens, and deleting Assistant prompts (PDL-078).** Pages now use the whole width of your screen: lists show more columns, lesson text flows in columns, and the sandbox sits side by side. You can also delete a prompt from your Assistant history (Delete, then Confirm); a deleted prompt still counts toward your daily limit.
- **Try it live in Prompt School (PDL-077).** Six lessons now have a "Try it live" panel: write your own prompt, run it on a real model against a fixed sample text and see what it does, next to a short list to check the answer yourself. Three runs a day, practice only, nothing you type is stored.
- **Wording pass (PDL-076).** Nothing in the app says any more that it updates itself: the tagline reads "Daily intelligence digest for vibe-coders", reports are simply "Published", and the Dictionary no longer talks about growing, or shows New and Trending markers.
- **Badges, and coins for the University (PDL-075).** There are now 12 badges: your first lesson, your first chapter, a badge for each passed level test in Prompt School and in the University, finishing all of Prompt School, seven and thirty day streaks and finding the book. They are on a new Badges page, reachable from your coin balance, and a new one gets the confetti celebration. The University now pays coins like Prompt School: 5 per lesson, 30 per chapter quiz and 150 per level test, each once.
- **New look: the KANON visual system (PDL-074).** The whole app now follows one type and line system: Unbounded for headings and dates, Source Serif 4 for reading the Daily Report, Inter for the interface, Geist Mono for sources, scores and times, Figtree for learning. The Daily Report opens with a large date and a bar in the colour of the weekday. Prompt School and the University are a friendlier learning layer with rounded cards, the technical admin screens are dark, and everything else keeps thin black lines and square corners. Content, pages and behaviour are unchanged.
- **A workshop for every blueprint (PDL-073).** Each of the fifteen blueprints in the Prompt School now ends in a hands-on workshop: adapt the blueprint to a case of your own and get feedback on the parts that make it work (for example the running stock of the production plan, the ban on protected characteristics in the banking analysis, or asking an investigative assistant for only what the documents state). Twelve new workshops, so each blueprint chapter has 14 exercises.
- **Prompt School pays coins and celebrates (PDL-072).** Finishing a lesson earns 5 Vibe Coins, passing an exercise for the first time 5, completing a chapter 50 and passing a level test 150, each once. After you check an answer the result now shows the coins you earned, your balance updates at once, and a completed chapter, a passed level test or a new level gets the confetti celebration. Before, answers were graded and saved but nothing visibly happened.

## 2026-09-20

- **Prompt School level tests (PDL-071).** Each level of the School now ends with a test: 12 beginner, 11 intermediate and 14 advanced new questions, answered in one sitting and graded together. A test opens when you have completed every chapter of its level, and it is passed at 80 percent. After the test you see your score, which questions you missed and which chapters to review, but no answers, so a retake really tests what you learned. You can retake it as often as you like.
- **Prompt School now teaches the whole book (PDL-070).** The last four parts are open: the techniques quick reference (48 techniques in four lessons), the glossary (all 91 terms in seven lessons) and the two guides to further reading and to choosing your prompting platform and workbench. The School has 101 lessons in 18 chapters and covers every section of the book. Finishing a chapter's practice now names the chapter that opens next.
- **Prompt School: the fifteen blueprints (PDL-069).** Appendix B of the book becomes three workshops, one lesson per blueprint with the scenario, the reasons behind each technique, the complete copy-ready prompt, the logic of its flowchart in steps and the suggested next steps: sales analysis, warehouse dispatch, production material flow, banking under ethical rules, lesson plans, retail replenishment, pharmaceutical analysis, call center quality, personal finance guidance, a to-do assistant, a language center, laboratory tracking, fitness assessment, investigative journalism and scientific writing, plus the closing on turning blueprints into your own tools. 17 lessons and 30 exercises; the School now has 86 lessons in 14 chapters and covers 93 percent of the book.
- **Prompt School: the advanced level (PDL-068).** Four more chapters written from the book: "Ethics and Bias" (finding, measuring and reducing bias, the hiring audit workshop), "Cutting-Edge Methods" (tool use, multimodal prompting, collaborative Markdown), "Real-World Case Studies" (the customer chatbot built step by step, the lab assistant) and "The Future of Prompting" (how systems learn preferences, six trends, the principles that endure). 19 lessons and 40 exercises; the School now has 69 lessons in 11 chapters and covers 85 percent of the book.
- **Prompt School: the intermediate level (PDL-067).** Four more chapters written from the book: "Making the Model Think" (chain of thought, tree of thoughts, distillation, the debate case study), "Structuring and Protecting Interaction" (tagged output, prompt injection defenses, stress-testing, the SupportBot workshop), "Prompting for Code and Research" (the blacksmith's forge, the archivist's lens) and "Optimizing and Debugging Prompts" (refinement cycles, A/B testing, seven common failures, the blog workshop). 27 lessons and 40 exercises; the School now has 50 lessons in 8 chapters.
- **The book pops up instead of sitting on the page (PDL-066).** On the Prompt School pages the book "Mastering Prompt Engineering" now appears as a window every 5 minutes of reading, with "Get the book" and "Not now". It closes by itself after 20 seconds if you do nothing, and it is no longer a fixed block.
- **Prompt School: the Markdown manual (PDL-065).** "Formatting Prompts Clearly" is written from the book's Appendix C, with 5 lessons and 9 exercises covering headings, emphasis, lists, code blocks, inline code, blockquotes, horizontal rules, tables and escaping, including a repair exercise that turns a run-on prompt into a structured one. The beginner level now has four chapters.
- **Greek names and a third stress test (PDL-064).** The Prompt School page is titled "Prompt School - Ἀγορά" and the University page "Vibe-Coding University - Στοά". The stress test found and fixed: the same article stored twice when two feeds titled it differently (now one row per link, and 15 stored repeats were marked as duplicates), two layouts that overflowed the narrowest phone screen, and Premium features missing or unmarked on the welcome page, the upgrade banner, the dashboard links and the README.
- **Prompt School covers the whole book, and sells it (PDL-063).** The plan now includes every part of the book (18 chapters, about 98 lessons) and each lesson records which sections of the book it teaches, so nothing can be skipped unnoticed. The first three chapters were completed against the book: a welcome lesson from the foreword, the full delimiter and workshop sections in The Five Pillars (now 8 lessons), and seven worked examples in Foundational Techniques. The School page also shows the book's cover: tap it for a small celebration (25 bonus coins the first time) and the book's payment page opens in a new window.

- **Prompt School: two more chapters (PDL-062).** "The Prompt Engineer's Craft" (why prompting is a craft, the draft, test, analyze, refine loop, defining success, thinking like an engineer) and "Foundational Techniques" (zero-shot, few-shot, choosing good examples) are open, each with 4 lessons and 8 exercises, including rewriting a vague goal into a precise prompt and turning a plain request into a recipe card with worked examples. The course now follows the book's order: chapter 1, then The Five Pillars, then chapter 3, each opening when the previous one is complete.

- **Prompt School (PDL-061).** A new card next to the University, built from the book Mastering Prompt Engineering, for the same Premium subscription. The first chapter, "The Five Pillars", is open with 6 lessons and 8 interactive exercises: choose, fill in the blanks of a real prompt, put the parts in order, spot the flaw, and rewrite a weak prompt yourself. Every attempt is checked at once with feedback on what to fix, and your best score and finished lessons are remembered. The rest of the course (12 chapters, about 47 lessons, beginner to advanced) is listed as coming soon. Like the University, it opens step by step: finish a chapter's lessons to open its practice, pass the practice (75 percent) to open the next chapter. Basic and trial readers see what the School offers and can buy Premium on the same screen. The menu switches to the compact button below 1280 px wide because it now has one more link.

## 2026-09-19

- **Upgrade screens that sell (PDL-060).** When a reader reaches the University, the Dictionary or the Assistant without Premium, they now see what that feature gives them, what Premium includes, the price ($40 for a paying Basic subscriber, $50 otherwise, about 14 cents a day) and a checkout button on the same screen. A trial user no longer sees a $40 upgrade offer that could not work.
- **Fills any screen (PDL-060).** The layout now scales up on large monitors instead of staying a narrow column, follows the visible height of phone browsers, and shows a clear focus outline for keyboard users. Checked from a 280 px foldable to a 3440 px ultrawide.
- **Second stress test (PDL-060).** A date such as 2026-13-45 in a report link no longer causes a server error; internal links no longer reload the whole page; lint is configured and part of CI; security, end to end and responsive checks can be re-run with one command each.

- **Dictionary (PDL-059).** The Dictionary now holds 2,639 terms (was 13), organised so it stays easy to use: instant search that also finds abbreviations, 14 topic tiles with counts, an A to Z list, beginner / intermediate / advanced filters, "see also" links, and a switch that keeps deep machine learning and infrastructure vocabulary out of the default view. It also learns: terms that appear repeatedly in the day's articles from several sources are added automatically and marked "new", and terms mentioned a lot this week are marked "trending".
- **More sources (PDL-059).** 20 verified feeds added (32 in total): vendor changelogs, independent analysts and developer communities. University lessons are now generated daily instead of weekly.
- **Clean-up (PDL-059).** 309 off-topic stored articles and 40 pile-up reports from before the relevance gate were removed (full backup kept), and removed items cannot come back from their feeds.

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
