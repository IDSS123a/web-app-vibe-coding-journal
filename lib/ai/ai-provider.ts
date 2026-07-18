/**
 * PDL-001: AI Provider Interface
 *
 * Swappable abstraction for LLM calls. This allows switching between
 * Gemini, Claude, or other providers without changing pipeline code.
 *
 * Status: Scaffold. No pipeline stage calls this yet (Sprint 2+).
 * Implemented as per Commander M-16 — stack deviation justified by
 * need for vendor independence documented in DECISION_LOG.md PDL-001.
 */

export interface AIProviderConfig {
  provider: "gemini" | "claude" | "other";
  apiKey: string;
  model?: string;
}

export interface SummarizeInput {
  text: string;
  maxLength?: number;
  tone?: "neutral" | "casual" | "technical";
}

/**
 * Sprint 05: extended with the P-3 required judgment fields
 * (why_it_matters, who_it_affects, worth_trying) — SummarizeOutput
 * originally only carried {summary, confidence}, which cannot satisfy
 * CONSTITUTION.md P-3's "every item ends with an actionable judgment"
 * requirement. Proposed and confirmed with the Director before merging
 * (see sprints/SPRINT_05.md).
 */
export interface SummarizeOutput {
  summary: string;
  why_it_matters: string;
  who_it_affects: string;
  worth_trying: "yes" | "no" | "maybe";
  confidence: number; // 0-1
}

export interface ClassifyInput {
  text: string;
  categories: string[];
}

export interface ClassifyOutput {
  category: string;
  confidence: number;
}

export interface AIProvider {
  summarize(input: SummarizeInput): Promise<SummarizeOutput>;
  classify(input: ClassifyInput): Promise<ClassifyOutput>;
  // Additional methods will be added as pipeline stages are implemented
}

let _provider: AIProvider | null = null;

export function setAIProvider(provider: AIProvider): void {
  _provider = provider;
}

export function getAIProvider(): AIProvider {
  if (!_provider) {
    throw new Error(
      "AI provider not initialized. Call setAIProvider() during app startup.",
    );
  }
  return _provider;
}

// Placeholder implementation (no-op, used until a real provider is configured)
class NoOpProvider implements AIProvider {
  async summarize(): Promise<SummarizeOutput> {
    return {
      summary: "[AI provider not configured]",
      why_it_matters: "",
      who_it_affects: "",
      worth_trying: "maybe",
      confidence: 0,
    };
  }

  async classify(): Promise<ClassifyOutput> {
    return {
      category: "uncategorized",
      confidence: 0,
    };
  }
}

// Initialize with no-op to prevent startup errors
setAIProvider(new NoOpProvider());
