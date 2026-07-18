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

export interface SummarizeOutput {
  summary: string;
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
