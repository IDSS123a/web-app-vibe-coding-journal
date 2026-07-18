# CLAUDE.md — Vibe-Coding Journal
# Commander-Governed Project

---

## GOVERNANCE — READ FIRST, EVERY SESSION

This project is governed by Commander v1.2. Before writing any code,
read documents per M-21 tier rules appropriate to your task.

**TIER 2 (sprints, features, bug fixes) — read these:**

```
https://raw.githubusercontent.com/IDSS123a/commander/main/CONSTITUTION.md
https://raw.githubusercontent.com/IDSS123a/commander/main/ENGINEERING_RULES.md
https://raw.githubusercontent.com/IDSS123a/commander/main/ARCHITECTURE_PATTERNS.md
https://raw.githubusercontent.com/IDSS123a/commander/main/ACA_COMMUNICATION_PROTOCOL.md
https://raw.githubusercontent.com/IDSS123a/commander/main/DONE_CHECKLIST.md
```

Project Constitution (project-specific rules, wins over Commander for this project):
```
https://raw.githubusercontent.com/IDSS123a/web-app-vibe-coding-journal/main/CONSTITUTION.md
```

Current sprint:
```
https://raw.githubusercontent.com/IDSS123a/web-app-vibe-coding-journal/main/sprints/SPRINT_01.md
```

---

## AUTOMATIC LESSON CAPTURE — NO PERMISSION NEEDED

**This is a standing order. Execute it automatically. Never ask the
Director whether to do it. Never wait for a reminder.**

### Continuous capture (during work)

The moment ANY of the following happens, immediately append an entry
to `corrections/SPRINT_[current]_LESSONS.md` — in the same turn,
before continuing with the task:

1. The Director corrects something you did (wrong approach, wrong
   assumption, wrong output format, misunderstood intent)
2. You hit an environment gotcha (tooling trap, dependency issue,
   platform quirk, failed command that needed a workaround)
3. You discover a bug caused by violating or overlooking a Commander
   rule
4. You make a 🔄 COURSE CORRECTION
5. You identify an improvement candidate for Commander (a rule that
   is missing, unclear, outdated, or slowed the work)

Entry format (append, never overwrite):

```markdown
### [YYYY-MM-DD HH:MM] — [one-line title]
- **What happened:** [1-2 sentences]
- **Resolution:** [what fixed it]
- **Commander relevance:** [M-XX / E-XX / C-XX / "new rule candidate" / "none"]
```

If `corrections/` folder or the sprint file does not exist yet:
create it silently and continue.

**Why continuous, not end-of-sprint:** session context gets compacted
during long work. A lesson captured immediately survives; a lesson
held in memory until sprint end may be lost. The filesystem is the
memory (M-18).

### End-of-sprint consolidation (automatic)

When a sprint is declared complete (Done Checklist passed), WITHOUT
being asked:

1. Review `corrections/SPRINT_[current]_LESSONS.md` — consolidate
   duplicate entries, sharpen wording
2. Add the three summary sections at the top of the file:
   `## Corrections Applied`, `## Gotchas Discovered`,
   `## Commander Improvement Candidates`
3. Fill in the COMMANDER COMPLIANCE score (from DONE_CHECKLIST.md)
4. Commit the file: `docs: sprint XX lessons learned`
5. State in the handoff note: "Lessons captured: [N] entries in
   corrections/SPRINT_XX_LESSONS.md"

### End-of-project (only step that needs the Director)

When the Director says **KRAJ**, execute M-22 (KRAJ Protocol) from
CONSTITUTION.md exactly. Reference: PROMPT_LIBRARY/kraj.md.
Do NOT push changes to the Commander repository without explicit
approval — M-22 Step 4 (CONFIRM) requires it.

---

## PROJECT-SPECIFIC NOTES

- **Domain:** Automated daily intelligence digest for vibe-coders.
  Not a general AI news aggregator. See project CONSTITUTION.md P-0.
- **Stack:** Commander default (Next.js + Supabase + Vercel). No
  stack deviation (M-16 not invoked) — greenfield project, no
  inherited codebase.
- **AI Provider:** NOT locked to Gemini default (DL-005). Per
  Director's explicit instruction, build `lib/ai/ai-provider.ts` as
  a genuine swappable interface from day one — the choice of
  concrete provider (Gemini, Claude, other) is deferred and recorded
  as PDL-001 in this project's own DECISION_LOG.md, to be resolved
  no later than the sprint that implements the Quality Engine /
  AI Summary pipeline stage.
- **Unattended pipeline architecture:** this project has a
  cron-driven background job layer (Source Collector, Duplicate
  Engine, Quality Engine, Classifier, AI Summary, Daily Report
  generation) that is NOT part of the standard HTTP request/response
  cycle Commander's Five Layers assume. See project CONSTITUTION.md
  P-9 for the documented extension (Pipeline/Jobs layer).
- **Almost-zero-maintenance constraint (P-1):** this is a project-level
  priority that sits between "Data Integrity" and "Architecture
  Consistency" in the M-3 Decision Hierarchy for this project
  specifically. Every pipeline feature must be built to fail loudly
  (held for review) rather than degrade silently. See P-1, P-6, P-7.

---

*Commander v1.2 — IDSS123a Organisation — Davor Mulalić*

---

## AUTOMATION LAYER (hooks — deterministic)

This project has Commander Automation hooks installed in `.claude/`:

- `hooks/log-change.js` (PostToolUse) — every file edit is automatically
  logged to `corrections/ACTIVITY_LOG.md`. You do not need to do this
  manually; it happens at the system level.
- `hooks/lessons-guard.js` (Stop) — you will be blocked from finishing
  a response if files changed but lessons were not captured. When the
  guard message appears: review ACTIVITY_LOG.md, append lessons (or the
  explicit "No lessons this session" line), then finish.

Treat the guard as an ally, not an obstacle — it exists because session
memory is unreliable and the filesystem is not (M-18).
