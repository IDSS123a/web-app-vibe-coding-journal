/**
 * Vibe-Coding Assistant domain logic (specs/prompt-blueprint-builder/,
 * resolves CONSTITUTION.md P-19, DECISION_LOG.md PDL-046). Pure
 * functions only -- no DB/network access here (see repository.ts for
 * that), same layering convention as features/rewards/domain.ts.
 */

import type { GeneratePromptBlueprintInput } from "@/lib/ai/ai-provider";
import type { PromptAssistantWizardInput } from "@/lib/validation/schemas";

/**
 * Daily generation caps (PLAN.md Risks/Deviations: an initial proposal,
 * not yet Director-confirmed against real Premium-subscriber volume).
 * Named here per this project's COIN_AWARDS-style precedent
 * (features/rewards/domain.ts) rather than scattered as a route-local
 * magic number. Chosen to leave headroom for the daily digest (~80/day
 * worst case) and University (~4/week) against the ~160/day
 * theoretical free-tier Gemini ceiling (P-18/PDL-021).
 */
export const ASSISTANT_DAILY_CAP_PER_USER = 5;
export const ASSISTANT_DAILY_GLOBAL_CAP = 30;

export function isUserCapExceeded(userGenerationsToday: number): boolean {
  return userGenerationsToday >= ASSISTANT_DAILY_CAP_PER_USER;
}

export function isGlobalCapExceeded(generationsToday: number): boolean {
  return generationsToday >= ASSISTANT_DAILY_GLOBAL_CAP;
}

/**
 * Prompt-injection defense (SPEC.md mandatory acceptance criterion,
 * P-19): wraps every free-text wizard answer in an explicit delimiter
 * tag before it ever reaches the AI call, exactly the "Semantic Fences"
 * technique the book itself teaches (Ch. 2.5 Delimiters, Ch. 5.2/
 * Appendix D "Adversarial Prompting") -- content inside these tags is
 * unambiguously DATA describing the user's project, never an
 * instruction the model should follow. The instruction telling the
 * model to treat these tags as data lives in
 * GeminiProvider.generatePromptBlueprint's own prompt assembly
 * (lib/ai/gemini-provider.ts), not here -- this function only shapes
 * the data.
 */
export function buildGenerateInput(wizard: PromptAssistantWizardInput): GeneratePromptBlueprintInput {
  const projectType =
    wizard.projectType === "other" && wizard.projectTypeOtherText
      ? `other: ${wizard.projectTypeOtherText}`
      : wizard.projectType;

  return {
    projectDescription: wrap("user_project_description", wizard.projectDescription),
    projectType: wrap("user_project_type", projectType),
    targetUser: wrap("user_target_audience", wizard.targetUser),
    coreGoal: wrap("user_core_goal", wizard.coreGoal),
    experienceLevel: wizard.experienceLevel,
    techPreferences: wizard.noTechPreference ? [] : wizard.techPreferences,
    inspiration: wizard.inspiration ? wrap("user_inspiration", wizard.inspiration) : null,
    constraints: wizard.constraints ? wrap("user_constraints", wizard.constraints) : null,
  };
}

function wrap(tag: string, text: string): string {
  return `<${tag}>\n${text}\n</${tag}>`;
}
