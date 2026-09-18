# SPEC — Vibe-Coding Assistant (Prompt Blueprint Builder)

**Resolves `CONSTITUTION.md` P-19** ("Vibe-Coding Assistant Chatbot —
Future Scope, Not MVP"). Discovered during spec work (2026-09-16): this
feature already has a name and a promise live on the pricing page
(`components/SubscriptionGuard.tsx`: "Everything in Basic, plus the
Vibe-Coding Assistant chatbot") and a dedicated CONSTITUTION.md entry —
it is not a new, separate idea. `prompt-blueprint-builder` stays the
internal spec/folder slug; **"Vibe-Coding Assistant" is the product-facing
name** and should be used in UI copy, since users already saw that name
on the pricing page before ever using the feature.

Two things P-19 already decided are explicitly superseded here, per the
Director (2026-09-16):
- P-19 said the chatbot's guidance engine should be the Commander system
  itself. **This is superseded**: the Director's book ("Mastering Prompt
  Engineering — A Practical Manual for Advanced Non-Coders") is now the
  sole canon for the techniques and output format this feature produces.
  Commander continues to govern how this *application itself* is built
  (as for every feature), but the shipped chatbot no longer references
  Commander internally.
- P-19's AI-cost-budget question is resolved: stays on PDL-021 (free-tier
  Gemini), the same model the rest of the pipeline uses.

## Purpose

Vibe-Coding Journal uči non-coder korisnike (vibe-codere) da grade softverske
projekte uz AI asistente poput Claude Code. Najveća prepreka kvalitetnom
rezultatu obično nije alat nego ulazni prompt — loše sastavljen inicijalni
prompt vodi lošoj arhitekturi, nejasnim zahtjevima i frustrirajućim
iteracijama. Ovaj feature pretvara Direktoričinu knjigu "Mastering Prompt
Engineering — A Practical Manual for Advanced Non-Coders" (KANON za sve
tehnike i format izlaza) u interaktivni alat: svaki $50/godina pretplatnik
dobija profesionalno sastavljen inicijalni prompt bez da mora sam savladati
tehnike iz knjige. Ovo je opipljiva, odmah korisna vrijednost knjige
pretvorena u proizvod, i diferencijacijski razlog za viši ($50) tier.

VCJ ima dva plaćena godišnja tier-a (vidi memory
`vibe_coding_journal_pricing_tiers.md`, i kod: `lib/permissions.ts`
`canAccessUniversity`, `subscription_tier` kolona 'basic'|'premium'):
$10/god (samo Daily Report) i $50/god ('premium' tier — sve iz $10
tier-a PLUS chatbot i University). Ovaj feature je gated specifično na
'premium' tier, istim mehanizmom koji već postoji za University — NE
na "bilo koju aktivnu pretplatu".

## User Stories

- As a $50-tier VCJ subscriber (vibe-coder), I can answer a short
  structured set of questions about the project I want to build, so that
  I receive a ready-to-paste, expertly-constructed initial prompt without
  having to learn prompt engineering myself.
- As a $50-tier VCJ subscriber, I can see a brief explanation of why the
  generated prompt is structured the way it is (which pillars/techniques
  were applied), so that I build intuition over time and trust the output
  isn't a black box.
- As a $50-tier VCJ subscriber, I can copy the generated prompt in one
  action, so that I can paste it directly into Claude Code or a similar
  AI coding assistant.
- As a $50-tier VCJ subscriber, I can see a list of prompts I've
  previously generated, so that I can re-copy or reference one without
  redoing the wizard.
- As a $10-tier subscriber or a non-subscriber, I can see that this
  feature exists and requires the $50 tier, so that I understand the
  value of upgrading.

## Acceptance Criteria

- [ ] Only authenticated users on the $50/year tier can start or
      complete the wizard; $10-tier subscribers and non-subscribers see
      an upgrade prompt instead of the tool itself (not a generic "any
      active subscription" check).
- [ ] The wizard collects enough structured information about the user's
      intended project — without requiring free-form back-and-forth — to
      generate a complete, non-generic prompt.
- [ ] The final output includes, at minimum: a copy-pasteable prompt using
      clearly delimited sections, and a short explanation of why it's
      structured that way, matching the Blueprint format the Director's
      book establishes (Domain/Scenario/Goal → explanation →
      delimited prompt → flow diagram → suggested next steps).
- [ ] All wizard questions, AI-generated explanations, and the final
      prompt itself are in English — matching the rest of the
      application, which is English-only end to end.
- [ ] A user can complete the entire flow from start to receiving their
      prompt using structured inputs only (selections / short text
      fields) — no requirement to type free-form paragraphs.
- [ ] The feature uses a bounded, predictable amount of AI usage per
      completion — no open-ended conversation that could run up
      unbounded token cost.
- [ ] A user can start over or regenerate if their answers change,
      without contacting support.
- [ ] A user can see and reopen (view/re-copy) prompts they've
      previously generated.
- [ ] The user's structured wizard answers are never concatenated into
      the AI system prompt in a way that lets their input be
      interpreted as an instruction to the system (prompt injection
      defense — P-19's flagged new attack surface: this is the first
      feature where repeated, direct user input reaches an AI prompt,
      unlike the one-way content pipeline).
- [ ] Each user's generation volume is bounded by an explicit, enforced
      cap (e.g. a fixed number of generations per day/month) — not just
      "bounded by the wizard's shape" — so real usage can't silently
      run past what the free-tier Gemini quota (P-18, 🔴 CRITICAL) can
      sustain across all Premium subscribers combined.
- [ ] Actual AI usage for this feature (call volume, failures, quota
      proximity) is visible somewhere an admin can check it — this is a
      new per-user, repeated-use cost pattern, distinct from the fixed
      daily-cron cost model the rest of the project assumes, and P-19
      requires this be designed before launch, not discovered after
      Premium subscribers start using it heavily.

## Explicitly Out of Scope

- Free-form, open-ended chat with no turn limit (rejected in favor of
  the structured wizard).
- Debugging, reviewing, or improving prompts for an EXISTING
  project/codebase — this is for a NEW project's initial prompt only.
- Generating actual code, or executing/testing the resulting prompt on
  the user's behalf.
- Replacing or duplicating Claude Code / other AI coding assistants —
  output is meant to be pasted elsewhere, not run inside this tool.
- Live retrieval (RAG) against the book's full text — the book is
  compressed into a static reference document ahead of time, not
  queried live per question.
- Multi-language output or a language-choice step in the wizard — the
  entire application, including this feature's questions and output,
  is English-only.

## Open Questions

(None blocking product scope — all resolved with the Director as of
2026-09-16, including the P-19 relationship above.)

- Exact wizard question set — what specific information must be
  collected about the user's project to produce a genuinely good
  prompt — is deferred to `/plan-feature`, since it borders on
  implementation detail rather than product scope.
- Concrete per-user generation cap and quota-monitoring design (P-18 /
  P-19 risk, now mandatory per the Director) is deferred to
  `/plan-feature` — this SPEC only requires that *some* enforced cap
  and *some* visible usage monitoring exist, not the specific numbers
  or mechanism.
- `lib/permissions.ts`'s `canAccessUniversity` already implements
  exactly the "premium tier or admin-exempt" check this feature needs,
  currently named for University specifically. `/plan-feature` should
  decide whether to reuse it as-is, generalize/rename it (e.g. a
  tier-neutral `canAccessPremiumFeature`), or add a parallel function —
  per M-7 (single source of truth for authorization), duplicating the
  same boolean logic under a new name should be avoided without a
  reason.
