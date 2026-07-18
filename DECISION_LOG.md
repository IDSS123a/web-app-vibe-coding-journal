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

## PDL-003 — Duplicate Detection: Cosine Similarity Threshold

**Date:** 2026-07-18 (Sprint 02)  
**Decision:** Set initial similarity threshold at 0.85 for fuzzy duplicate detection (Duplicate Engine, feature/pipeline/domain.ts).

**Rationale:** 
- 0.85 provides high confidence in similarity while allowing minor variations (title rewordings, summary edits)
- Below 0.85: too many false negatives (real duplicates slip through)
- Above 0.90: too many false positives (legitimate related articles marked as duplicates)
- Starting point based on industry practice; tunable via constant `SIMILARITY_THRESHOLD`

**Tuning guidance (future sprints):**
- If duplicate duplicates are not caught: increase to 0.90 (stricter)
- If legitimate related articles are over-deduplicated: decrease to 0.80 (looser)
- Threshold is a constant in `features/pipeline/domain.ts`, not hardcoded in algorithm

**Current implementation:**
- Hash-based exact match: O(1) lookup, 100% confidence
- Similarity-based fuzzy match: Jaccard similarity on word-level tokenization (MVP; production would use embeddings)
- Applied during `/api/cron/daily-digest` phase 2 (Duplicate Engine)

---

## PDL-004 — Confidence Threshold: 0.6 for Review Gate

**Date:** 2026-07-18 (Sprint 03)  
**Decision:** Set minimum confidence threshold at 0.6 (60%) for auto-publish. Articles below 0.6 are held for review.

**Rationale:**
- 0.6 is conservative for MVP: catches ~50% of new articles for human review
- Too low (<0.5): risky, more hype/low-quality content auto-published
- Too high (>0.7): excessive review queue burden, slows publication
- Baseline scoring starts at 0.5, individual factors add/subtract 0.1
- Starting point based on editor preference; tunable via constant `CONFIDENCE_THRESHOLD` in features/pipeline/quality-engine.ts

**Tuning guidance (post-launch):**
- Collect 2 weeks of production data
- Analyze approval/rejection patterns
- If >80% of reviews result in approval: lower to 0.55 (more auto-publish)
- If >30% of reviews result in rejection: raise to 0.65 (more manual review)
- Threshold is a constant, not hardcoded in algorithm

**Current implementation:**
- Applied during `/api/cron/daily-digest` phase 3 (Quality Engine)
- Hype-word filter is a separate gate (also holds articles regardless of confidence)
- Both gates feed into review_status = "held_for_review" if either triggers

---

## PDL-005 — Scheduler: Vercel Cron (Decision Pending Implementation)

**Date:** 2026-07-18 (Sprint 04)  
**Decision:** Use **Vercel Cron** for automated `/api/cron/daily-digest` execution.

**Rationale:**
- **Platform-native** (E-5: Vercel deployment = Vercel scheduler)
- **Zero external dependencies** (no third-party cron service)
- **Declarative** (cron config in vercel.ts, version-controlled)
- **Reliable** (Vercel infrastructure, AWS-backed)
- **Observable** (Vercel dashboard shows cron invocations + logs)
- **No cost** (included with Vercel platform)
- **Limitation:** Vercel projects only (acceptable given PDL-002 stack commitment)

**Alternative considered:**
- GitHub Actions: Works, but adds CI/CD coupling
- External service (EasyCron, etc.): Adds external dependency, cost

**Implementation:** 
- Create `vercel.ts` at project root with cron config
- Schedule: 9 AM UTC daily (adjustable per timezone needs)
- Cron calls `/api/cron/daily-digest` with Bearer token auth (CRON_SECRET)

**Current status:** Pending implementation in Sprint 04

---

*Vibe-Coding Journal — Project Decision Log — updated as decisions are made.*
