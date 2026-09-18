import { supabaseAdmin } from "@/lib/db/client";
import type { GeneratePromptBlueprintOutput } from "@/lib/ai/ai-provider";
import type { PromptAssistantWizardInput } from "@/lib/validation/schemas";

export interface PromptBlueprintGeneration {
  id: string;
  userId: string;
  wizardAnswers: PromptAssistantWizardInput;
  domain: string;
  scenario: string;
  goal: string;
  explanation: string;
  promptBlueprint: string;
  mermaidDiagram: string;
  nextSteps: string;
  createdAt: string;
}

export interface PromptBlueprintGenerationSummary {
  id: string;
  domain: string;
  goal: string;
  createdAt: string;
}

/**
 * Start of "today" for the daily generation caps
 * (features/prompt-assistant/domain.ts) -- a plain UTC calendar-day
 * boundary. Deliberately simpler than the operations-timezone day
 * boundary streaks use (lib/time/operations-date.ts): this is a coarse
 * anti-abuse/quota-protection safety cap, not a user-facing engagement
 * mechanic, so a UTC boundary is an acceptable, honestly-simpler choice
 * here rather than importing timezone-midnight arithmetic for it.
 */
function startOfTodayUTCIso(): string {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  return start.toISOString();
}

export async function countUserGenerationsToday(userId: string): Promise<number> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { count, error } = await supabaseAdmin
    .from("prompt_blueprint_generations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfTodayUTCIso());

  if (error) {
    throw new Error(`Failed to count user's generations today: ${error.message}`);
  }
  return count ?? 0;
}

export async function countGenerationsToday(): Promise<number> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { count, error } = await supabaseAdmin
    .from("prompt_blueprint_generations")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startOfTodayUTCIso());

  if (error) {
    throw new Error(`Failed to count today's generations: ${error.message}`);
  }
  return count ?? 0;
}

/** Admin usage visibility (P-19's mandatory requirement, app/api/admin/assistant-usage). */
export async function countGenerationsTodayByUser(): Promise<Array<{ userId: string; count: number }>> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { data, error } = await supabaseAdmin
    .from("prompt_blueprint_generations")
    .select("user_id")
    .gte("created_at", startOfTodayUTCIso());

  if (error) {
    throw new Error(`Failed to load today's generations for usage breakdown: ${error.message}`);
  }

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const userId = row.user_id as string;
    counts.set(userId, (counts.get(userId) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([userId, count]) => ({ userId, count }));
}

export async function insertGeneration(
  userId: string,
  wizardAnswers: PromptAssistantWizardInput,
  output: GeneratePromptBlueprintOutput,
): Promise<PromptBlueprintGeneration> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { data, error } = await supabaseAdmin
    .from("prompt_blueprint_generations")
    .insert({
      user_id: userId,
      wizard_answers: wizardAnswers,
      domain: output.domain,
      scenario: output.scenario,
      goal: output.goal,
      explanation: output.explanation,
      prompt_blueprint: output.promptBlueprint,
      mermaid_diagram: output.mermaidDiagram,
      next_steps: output.nextSteps,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save prompt blueprint generation: ${error.message}`);
  }

  return mapRow(data);
}

export async function listUserGenerations(userId: string): Promise<PromptBlueprintGenerationSummary[]> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { data, error } = await supabaseAdmin
    .from("prompt_blueprint_generations")
    .select("id, domain, goal, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list generations: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    domain: row.domain as string,
    goal: row.goal as string,
    createdAt: row.created_at as string,
  }));
}

/**
 * Returns the row only if `userId` owns it -- callers (the API route)
 * treat a null return as a 404 regardless of whether the id doesn't
 * exist or belongs to someone else (never confirms another user's row
 * exists, matching E-5's precise-but-not-leaky error discipline).
 */
export async function getOwnedGeneration(id: string, userId: string): Promise<PromptBlueprintGeneration | null> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { data, error } = await supabaseAdmin
    .from("prompt_blueprint_generations")
    .select()
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load generation: ${error.message}`);
  }
  if (!data) return null;

  return mapRow(data);
}

interface GenerationRow {
  id: string;
  user_id: string;
  wizard_answers: PromptAssistantWizardInput;
  domain: string;
  scenario: string;
  goal: string;
  explanation: string;
  prompt_blueprint: string;
  mermaid_diagram: string;
  next_steps: string;
  created_at: string;
}

function mapRow(row: GenerationRow): PromptBlueprintGeneration {
  return {
    id: row.id,
    userId: row.user_id,
    wizardAnswers: row.wizard_answers,
    domain: row.domain,
    scenario: row.scenario,
    goal: row.goal,
    explanation: row.explanation,
    promptBlueprint: row.prompt_blueprint,
    mermaidDiagram: row.mermaid_diagram,
    nextSteps: row.next_steps,
    createdAt: row.created_at,
  };
}
