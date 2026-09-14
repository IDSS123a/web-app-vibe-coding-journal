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
  // Phase 5 (specs/vibe-coding-intelligence-engine/ROADMAP.md, Daily/
  // Weekly Intelligence Format, migration 012): a forward-looking note
  // -- what to look for next on this story (a follow-up release, a
  // stability signal, a metric to watch) -- folded into this same call,
  // not a new one, same principle as Phase 3's Evidence Framing.
  what_to_watch: string;
}

export interface ClassifyInput {
  text: string;
  categories: string[];
}

export interface ClassifyOutput {
  category: string;
  confidence: number;
}

/**
 * specs/hold-gate-calibration-learning/ — judges whether a specific
 * hype-word occurrence (already found by the domain layer's
 * detectHypeWordsInReport, features/hold-gate-calibration/domain.ts) was
 * genuine hype/marketing language or a false positive (e.g. a proper
 * noun coincidentally containing the word), given the surrounding
 * excerpt for context.
 */
export interface JudgeHoldReasonInput {
  reportExcerpt: string;
  holdReason: string;
}

export interface JudgeHoldReasonOutput {
  verdict: "genuine_hype" | "false_positive" | "uncertain";
  reasoning: string;
}

/**
 * P-0 (🔴 CRITICAL): "It is not a general AI news aggregator... every
 * piece of content must pass one test: does this help someone who
 * builds apps with AI tools make a better decision today?" Found live
 * 2026-09-11: neither scoreArticleConfidence (generic source/freshness/
 * length heuristics) nor classifyArticle (genre keyword matching) ever
 * checked this -- an NTSB aviation report, a Navier-Stokes math post,
 * music theory, NASA/Mars imaging, and an essay about keeping old
 * cables all published, none relevant to vibe-coding at all. This gate
 * is what P-0 actually requires and nothing upstream provided.
 *
 * Phase 2 (specs/vibe-coding-intelligence-engine/ROADMAP.md,
 * 2026-09-13): relevanceScore replaces the original boolean isRelevant
 * with a graded 0-100 judgment (RELEVANCE_THRESHOLD in
 * features/pipeline/quality-engine.ts decides the exclude/include
 * cutoff) -- the score itself is now persisted (migration 011,
 * articles.relevance_score) instead of being discarded after the call.
 */
export interface AssessRelevanceInput {
  title: string;
  summary: string;
}

export interface AssessRelevanceOutput {
  relevanceScore: number;
  reasoning: string;
}

export interface AIProvider {
  summarize(input: SummarizeInput): Promise<SummarizeOutput>;
  classify(input: ClassifyInput): Promise<ClassifyOutput>;
  judgeHoldReason(input: JudgeHoldReasonInput): Promise<JudgeHoldReasonOutput>;
  assessRelevance(input: AssessRelevanceInput): Promise<AssessRelevanceOutput>;
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
      what_to_watch: "",
    };
  }

  async classify(): Promise<ClassifyOutput> {
    return {
      category: "uncategorized",
      confidence: 0,
    };
  }

  async judgeHoldReason(): Promise<JudgeHoldReasonOutput> {
    return {
      verdict: "uncertain",
      reasoning: "[AI provider not configured]",
    };
  }

  // Fail open (maximally relevant) when no provider is configured --
  // matches this stub's existing behavior for every other method (never
  // itself the reason real content gets excluded); a real provider
  // outage is handled the same way at the call site (features/pipeline
  // calling code), not here.
  async assessRelevance(): Promise<AssessRelevanceOutput> {
    return {
      relevanceScore: 100,
      reasoning: "[AI provider not configured]",
    };
  }
}

// Initialize with no-op to prevent startup errors
setAIProvider(new NoOpProvider());
