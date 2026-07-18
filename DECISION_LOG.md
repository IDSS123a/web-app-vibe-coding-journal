# DECISION_LOG.md — Vibe-Coding Journal
# Project-level technology decisions
# Inherits: Commander/DECISION_LOG.md (universal decisions, DL-001 through DL-010+)

---

> This document records WHY we chose specific technologies and patterns
> for THIS project specifically, on top of (or overriding) Commander's
> universal DECISION_LOG.md. Never deleted. Superseded entries marked
> `[SUPERSEDED]`, never removed.
>
> Numbering: project-level decisions use prefix `PDL-` to avoid
> collision with Commander's own `DL-` numbering.

---

## PDL-001 — AI Provider: Deferred, Provider Interface Mandatory

**Date:** 2026-07-18
**Decision:** Do NOT default to Gemini (Commander DL-005) without
review. Build `lib/ai/ai-provider.ts` as a genuine swappable interface
from the first sprint that touches it. The concrete provider (Gemini,
Claude, or another) is an open decision, to be resolved no later than
the sprint implementing the Quality Engine / AI Summary pipeline stage.

**Rationale:** The Director explicitly deferred this choice rather
than accepting the Commander default outright. Editorial voice
requirements for this project (CONSTITUTION.md P-3 — no hype language,
consistent depth-adaptive tone, structured `why_it_matters` /
`worth_trying` fields) are unusually strict for a general-purpose
default and may favor a specific model's steerability. Locking in a
provider before that stage risks a rebuild if steerability proves
insufficient.

**Upgrade path:** When resolved, this entry gets superseded with the
chosen provider, model string(s), and rationale, following the format
of Commander's own DL-005.

---

## PDL-002 — Stack: Commander Default, No Deviation

**Date:** 2026-07-18
**Decision:** Use Commander's default stack as-is: Next.js + Supabase
+ Vercel. No M-16 stack deviation invoked.

**Rationale:** Greenfield project, no inherited codebase. No reason
identified to depart from the proven default (see Commander DL-001,
DL-003, DL-004, DL-008 for the underlying reasoning, which applies
unchanged here).

**Note:** The unattended cron-driven pipeline layer (Source Collector,
Duplicate Engine, Quality Engine, Classifier, Summary, Daily Report)
is architecturally distinct from Commander's five-layer HTTP-cycle
model and is documented as an explicit extension in project
CONSTITUTION.md P-9, not a stack deviation.

---

*Vibe-Coding Journal — Project Decision Log — updated as decisions are made.*
