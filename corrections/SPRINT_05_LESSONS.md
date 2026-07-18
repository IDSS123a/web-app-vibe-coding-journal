# SPRINT_05 Lessons Learned

**Scope:** GeminiProvider implementation, `summarize()`/`classify()` wired into
the pipeline, P-3 editorial voice tested on real GitHub Blog articles.
**Outcome:** All DoD items verified live, including one organic (not staged)
full key-exhaustion event.

---

## Technical Findings

### 1. Next.js App Router: `_`-prefixed folders are private, never routed
Created a temporary test route at `app/api/_temp_depth_test/` — got a 404.
Next.js App Router treats any path segment starting with `_` as a private
folder (for co-locating non-route files), excluded from routing entirely.
Renamed to `app/api/temp-depth-test/` and it worked immediately.
**Commander candidate:** "When adding a throwaway/temporary API route for a
live test, never prefix the folder with `_` — it silently 404s with no error
in the build. Use a plain name and delete the folder afterward."

### 2. Stale `.next/types` cache broke typecheck after deleting a route
After deleting the temporary test route, `tsc --noEmit` failed referencing a
module path for the now-deleted route — Next.js's generated route-type
manifest (`.next/types/`) still pointed at it. `rm -rf .next` and rebuilding
resolved it immediately.
**Commander candidate:** "After adding/removing an API route directory during
a live-test-and-discard cycle, clear `.next` before the final typecheck/build
— the generated route-type manifest can go stale and produce a false-negative
compile error that has nothing to do with the actual code."

### 3. REST over SDK, live-verified model name over memory
Chose to call the Gemini REST API directly via `fetch` rather than add an SDK
dependency, and verified the model string (`gemini-2.5-flash`) and the
`RESOURCE_EXHAUSTED` error shape by calling the real `ListModels` and
`generateContent` endpoints before writing any code — deliberate, because the
assistant's training cutoff (January 2026) predates the current date
(July 2026) by six months, more than enough time for model names to change.
Guessing either the package name or model string from memory risked a
confident-but-wrong implementation.
**Commander candidate:** "When an assistant's knowledge cutoff is meaningfully
behind the current date and a task depends on an external API's current
shape (model names, error codes, endpoint behavior), verify against the live
API before writing code that assumes it — don't rely on training-data
knowledge for anything that vendors update on their own schedule."

### 4. Self-caught scope creep on the approved interface extension
The Director approved extending `SummarizeOutput` with exactly three fields
(`why_it_matters`, `who_it_affects`, `worth_trying`) matching the existing
`articles` table columns. While implementing, a fourth field
(`worth_trying_reason`) was added without asking — beyond what was approved,
and with no DB column to persist it. Caught before anyone else saw it (while
checking the schema against the interface) and removed; the model's
justification was folded into `why_it_matters` instead of a new field.
**Why this matters:** having one interface-extension exception already
granted made it easy to informally add "just one more small thing" on the
same pass — the exact failure mode the "propose, don't silently add" rule
exists to prevent, almost triggered by the assistant itself minutes after
writing that rule into the scope doc.
**Commander candidate:** "An approved interface/schema extension is scoped to
exactly what was approved, field by field — not a general license to add
'one more related field' during implementation. Each additional field is its
own proposal, even if it seems obviously related to the one just approved."

### 5. `classify()` fallback confirmed working on a real ambiguous case
Article "The cost of saying yes has changed" — the heuristic
`classifyArticle()` (pattern-matching on title/summary keywords) correctly
returned `null` (no keyword match). The AI `classify()` fallback then
returned `"Opinion"`, a reasonable category the heuristic simply has no
pattern for. Confirms the approved integration order (heuristic first, AI
only on `null`) does what it was designed to do, live, not just in theory.

### 6. `ClassifyOutput.category` defensive check against hallucinated categories
`GeminiProvider.classify()` validates the model's returned category against
`input.categories` before accepting it — if the model returns a category
string not in the provided list (hallucinated or off-list), the code treats
it as no match (`category: ""`) rather than trusting it. This is a real
guard, not theoretical: LLMs can return plausible-sounding but off-list
categories under load; the check was exercised structurally even though this
run's actual outputs stayed on-list.

### 7. Free-tier quota is tight enough to be a real operational risk
`gemini-2.5-flash` free tier: 20 requests/day per key per model. 8 keys ×
20 = 160/day theoretical ceiling, but ad-hoc verification calls made *before*
the sprint's actual pipeline test (confirming the model name, testing JSON
mode, checking quota state across all 8 keys) consumed a meaningful slice of
that budget on the same day — directly causing the full-exhaustion event
during the live pipeline run. That event was valuable (it proved the
fallback-on-error and hold-for-review behavior organically), but it also
demonstrates a real production risk: manual dev/test activity against the
same keys the production 9 AM cron will use can starve the actual scheduled
run.
**Commander candidate:** "If a rate-limited external API's keys are shared
between development/testing and the production schedule, either provision
separate dev keys or document a practice of not hand-testing against
production keys close to a scheduled automated run — a exhausted quota from
testing is indistinguishable, from the cron's perspective, from a real
production spike, and both cause the same held-for-review outcome."

### 8. RSS `raw_summary` content is often too thin for a rich AI summary
One real article ("Better tools made Copilot code review worse...") had a
`raw_summary` from GitHub's RSS feed that was essentially just the title
repeated. Gemini's response was honest about this — it explicitly said the
provided content was "insufficient to generate a detailed summary" rather
than inventing plausible-sounding specifics it had no basis for. This is
correct, desired M-4-aligned behavior, but it also means AI Summary quality
is bounded by upstream RSS feed richness — a future sprint improving Source
Collector to fetch full article bodies (not just RSS excerpts) would directly
improve summary quality, independent of the AI provider.

---

## What Worked Well

- **Fallback-on-error key rotation** worked exactly as specified on the first
  real run, verified by an unplanned real exhaustion event rather than a
  contrived test — the most convincing kind of proof available.
- **P-1.1 (fail loudly) held under real failure**: no crash, no silent empty
  report, an explicit and specific hold reason surfaced through the existing
  P-6 review-queue and email-alert path unchanged.
- **Log/secret hygiene requirements were mechanically checkable** (grep for
  the key prefix across the repo and the log file) and both passed cleanly —
  a DoD item phrased as a concrete, automatable check rather than a vague
  "be careful" instruction is easy to actually verify.
- **This sprint got its own approval gate**, separate from the two fixes
  approved just before it — scope approved first (with two Director
  additions folded in), DoD only closed after live evidence, nothing bundled.
  Direct, successful application of [[SPRINT_04_LESSONS]] finding #15 and
  [[PROCESS_LESSONS]] — worth recording as a positive confirmation, not just
  a violation-avoidance.

---

## DONE_CHECKLIST

See `sprints/SPRINT_05.md` Definition of Done — every item is checked with
the specific live evidence inline (not reproduced twice here to avoid drift
between the two documents).

---

*Vibe-Coding Journal — Sprint 05 — governed by Commander v1.2. Commander-candidate items above feed the v1.3 improvement backlog (github.com/IDSS123a/commander).*
