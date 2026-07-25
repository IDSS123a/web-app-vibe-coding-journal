# OPERATIONS_ACCOUNTS.md

> **INTERNAL OPS DOCUMENT — DO NOT reference from README, marketing copy,
> or any public-facing content.** Contains real account identities; repo
> is private by design, this file is why.

---

## Accounts & Access Points

**Supabase**
- Account: `ai@idss.ba`
- Project ref: `twjqyubtpcrfdqlyvzwy`
- Project URL: `https://twjqyubtpcrfdqlyvzwy.supabase.co`

**Git repository**
- `https://github.com/IDSS123a/web-app-vibe-coding-journal` (private)

**Production deploy**
- `https://web-app-vibe-coding-journal.vercel.app/`

**Vercel** — two distinct identities, don't conflate them:
- `idsssarajevo` team — what the CLI (`vercel login`/`vercel link`) is
  authenticated as for this project;
  `https://vercel.com/idsssarajevo/web-app-vibe-coding-journal`
- `mulalicds-projects` — the Director's personal Vercel dashboard
  namespace; `https://vercel.com/mulalicds-projects`

**Cron trigger (cron-job.org)**
- Dashboard: `https://console.cron-job.org/dashboard`
- Account: `ai-hero-studio@outlook.com`

---

## Why this file exists — explicit exception, not precedent

Director decision, 2026-07-24: real account emails are recorded literally
in this file, despite the standing naming-discipline rule (no location
strings, and generally no real-identity strings, in code/comments/commits
— see DECISION_LOG.md PDL-015 and corrections/SPRINT_06_LESSONS.md). This
is acceptable specifically because:

1. The repo is private (`isPrivate: true`, reconfirmed live 2026-07-24
   immediately before writing this file) — content here is not publicly
   reachable the way a committed file in a public repo would be.
2. The risk is knowingly, explicitly accepted by the Director for this
   one file, not defaulted into.

**This is an exception scoped to this file only.** It does not relax the
naming-discipline rule anywhere else — README.md, marketing copy, UI
strings, commit messages, and every other committed file still follow the
existing rule exactly as before. It also does not extend to location
strings (the forbidden terms from DECISION_LOG.md PDL-015) — this file's
exception is for account emails/identities specifically, not for business
location.

---

## Hardware note

Project development moved to a new laptop starting **[DATE NOT YET
SPECIFIED — Director to fill in]**. If git config, SSH keys, or CLI
authentication (`gh`, `vercel`, `supabase`) are ever missing or reset
unexpectedly in a future session, this is the likely reason — check
whether the current machine has been through this transition before
assuming something broke.
