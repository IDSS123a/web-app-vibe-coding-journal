# SPEC — Hold-Gate Calibration Learning

> **Status 2026-09-22: shipped.** The acceptance boxes below were not ticked at the time; see DECISION_LOG.md for what was verified.

**Phase 1 of a larger idea** (Director, 2026-09-11): the system should
learn from the accumulated history of past Daily Reports and continuously
improve itself over time, across the full pipeline. Given P-1 (Almost-Zero-
Maintenance Principle, 🔴 CRITICAL) and the real size of "the whole
pipeline," this phase is deliberately scoped to one concrete, high-value
starting point — the exact mechanism that caused the real 51-day
production incident (`HANDOFF_CONTENT_PIPELINE_FIX.md`) — rather than all
pipeline layers at once. Later phases (source selection, duplicate
detection, quality/confidence scoring, classification) are explicitly
deferred, not assumed, per the Director's own choice of a phased start.

## Purpose

The P-3/P-6 hold gate (hype-word detection blocking auto-publish) has no
mechanism to learn from its own history. This already caused real harm:
once report generation started accumulating unbounded article history,
*some* hype word was essentially always present somewhere in the ever-
growing pile, and the gate held every single report for 51 consecutive
days with no signal to anyone that the gate itself — not just the
underlying data bug — might need recalibrating. Even now that the data
bug is fixed, there's still no feedback loop: the hype-word list and hold
thresholds are static, hand-set once, with no way to learn from
accumulated evidence (the 51 historical held reports, and all future
ones) about which triggers are genuinely catching bad content versus
which are noise that just adds admin review burden.

This solves that: give the Director periodic, concrete, evidence-backed
insight into how the hold gate is actually performing against real
history, so hype-word list and threshold decisions are made from data
instead of guesswork — without the system ever changing its own
publishing behavior unilaterally.

## User Stories

- As the **Director** (sole admin, per P-14's two-role model — no
  superadmin tier), I can review a summary of which hype words / hold
  reasons have actually fired across the report history, how often, and
  on what kind of content, so I can decide whether to adjust the P-3
  hype-word list or hold thresholds with real evidence instead of
  guessing.
- As the **Director**, I can see this analysis re-run periodically (not
  a one-time report) as new reports accumulate, so the recommendation
  stays current as real publishing history grows — without me having to
  manually re-derive it each time. **RESOLVED 2026-09-11:** re-runs both
  on demand (I trigger it whenever I want) and on a schedule tied to
  P-11's existing Monthly Self-Audit cadence — not one or the other.
- As the **Director**, I can view this summary on an admin-only page
  (the existing admin surface, not a new public-facing one) — **RESOLVED
  2026-09-11**, not an email digest.
- As the **Director**, nothing about the hype-word list, hold thresholds,
  or publish behavior changes unless I explicitly apply a suggested
  change — the system never modifies its own gating rules on its own
  authority.

## Acceptance Criteria

- [ ] A concrete, testable process exists (however it's implemented —
      left to `/plan-feature`) that reads the historical `daily_reports`
      table (all `held_for_review` and `auto_published` rows, including
      the 51 kept from the 2026-09-10 incident) and produces a
      human-readable summary: which specific hype words/hold reasons
      fired, how often, and on what kind of content.
- [ ] **RESOLVED 2026-09-11 (Director):** false-positive judgment (did a
      hype word fire on content that wasn't actually hype?) is
      **automated** — the process itself renders a verdict per
      occurrence, not just raw statistics for the Director to manually
      assess. `/plan-feature` decides the mechanism (e.g. a second
      AI-assisted pass judging held content against P-3's editorial
      rules), but the verdict must actually appear in the summary, not
      be left as a manual step.
- [ ] The summary is something the Director can actually act on: it
      names specific candidate changes (e.g. "remove word X from the
      hype list," "loosen/tighten threshold Y") with the evidence behind
      each, not just raw statistics.
- [ ] Re-running this analysis after new reports have been generated
      produces an updated summary reflecting the new data — this is not
      a single one-off report.
- [ ] **RESOLVED 2026-09-11 (Director):** the analysis can be re-run
      **both** on demand (Director-triggered) and on a schedule tied to
      P-11's existing Monthly Self-Audit cadence — not just one of the
      two.
- [ ] **RESOLVED 2026-09-11 (Director):** the summary is visible on an
      **admin-only page** (existing admin surface) — not an email
      digest, not a new public-facing page.
- [ ] Applying any suggested change requires an explicit Director action;
      no code path exists where this analysis writes to the hype-word
      list, thresholds, or any other pipeline configuration on its own.
- [ ] Live-verified against the real, existing historical data (the 51
      held reports + whatever has auto-published since the fix) — not
      demonstrated only against synthetic/test data.

## Explicitly Out of Scope (this phase)

- **Any other pipeline layer** — source selection, duplicate detection,
  confidence scoring, classification/categorization, summarization
  prompts. This phase is the hold gate only. Later phases, if pursued,
  are separate SPECs, not assumed here.
- **Autonomous self-modification** — the system never changes its own
  hype-word list, thresholds, or gating logic without the Director
  explicitly applying a change. No "the system quietly got better
  overnight" behavior, ever, in this phase.
- **Any claim of working "in all situations" or improving "with
  certainty"** — this phase produces evidence-backed suggestions for a
  human to evaluate; it does not (and no real system can) guarantee
  universal correctness or improvement.
- **A general-purpose "learning platform"** — this is a specific,
  bounded analysis of one gate's historical performance, not new
  infrastructure for arbitrary future learning use cases. If a broader
  platform is wanted later, that's its own SPEC.
- **Changing what "hype word" or "hold reason" means today** — P-3's
  existing editorial-voice rules are the ground truth this phase
  evaluates *against*; redefining those rules is a separate Constitution-
  level decision (per M-4/M-13), not something this feature does.

## Open Questions

- ~~How often should the analysis re-run?~~ **RESOLVED 2026-09-11
  (Director):** both on demand and on a schedule tied to P-11's Monthly
  Self-Audit cadence.
- ~~Where does the Director see this summary?~~ **RESOLVED 2026-09-11
  (Director):** an admin-only page.
- ~~Can "false positive" be judged automatically?~~ **RESOLVED 2026-09-11
  (Director):** yes, automated judgment is required, not merely
  optional. `/plan-feature` still owns *how* (this SPEC deliberately
  excludes mechanism), but the acceptance criterion above now requires
  an actual automated verdict per occurrence, not raw statistics alone.
- ~~Should Phase 2+ be scoped now as a roadmap item?~~ **RESOLVED
  2026-09-11 (Director):** left fully open — no Phase 2+ scoping, roadmap
  note, or planning of any kind until Phase 1 actually ships and proves
  useful in practice. Revisit then.
