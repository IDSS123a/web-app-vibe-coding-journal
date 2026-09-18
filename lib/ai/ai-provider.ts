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

/**
 * Vibe-Coding University's weekly lesson-generation job (specs/
 * vibe-coding-university/PLAN.md, confirmed 2026-09-14). Writes the
 * body for ONE already-titled stub lesson using recent high-relevance
 * articles as source material -- deliberately not "invent a lesson
 * topic," which would be much harder to keep on-topic and impossible
 * to pre-review (the topic itself is confirmed by the Director already,
 * via specs/vibe-coding-university/CURRICULUM_DRAFT.md).
 */
export interface GenerateLessonInput {
  lessonTitle: string;
  courseLevel: "beginner" | "intermediate" | "expert";
  sourceArticles: Array<{ title: string; summary: string }>;
}

export interface GenerateLessonOutput {
  body: string; // markdown, follows the same P-3 editorial rules as Daily Report summaries
  terms: Array<{ term: string; definition: string }>; // 0-5 new Dictionary terms this lesson introduces
}

/**
 * Autonomous supplementary-lesson growth (specs/vibe-coding-university/
 * SPEC.md Amendment, PDL-042, picked up 2026-09-15). Unlike
 * GenerateLessonInput above, this one DOES invent the topic and level
 * itself -- safe specifically because the result always lands in
 * `pending_review`, never publishes unreviewed, and only ever produces
 * supplementary (is_core=false, unchaptered) content. The fixed
 * 75-lesson core this input type was designed to protect is untouched
 * either way.
 */
export interface GenerateSupplementaryLessonInput {
  sourceArticles: Array<{ title: string; summary: string }>;
  existingLessonTitles: string[]; // dedup context -- avoid re-covering a topic already taught anywhere in the curriculum
}

export interface GenerateSupplementaryLessonOutput {
  title: string;
  level: "beginner" | "intermediate" | "expert";
  body: string;
  terms: Array<{ term: string; definition: string }>;
}

/**
 * Vibe-Coding Assistant (specs/prompt-blueprint-builder/, resolves
 * CONSTITUTION.md P-19, DECISION_LOG.md PDL-046). `projectDescription`
 * through `constraints` arrive here ALREADY wrapped in delimiter tags by
 * features/prompt-assistant/domain.ts (e.g.
 * `<user_project_description>...</user_project_description>`) — the
 * prompt-injection defense the book's own Chapter 2.5/Appendix D
 * "Adversarial Prompting" entry describes, applied to the call that
 * teaches it. The provider implementation must not strip these tags.
 */
export interface GeneratePromptBlueprintInput {
  projectDescription: string;
  projectType: string;
  targetUser: string;
  coreGoal: string;
  experienceLevel: "beginner" | "some_experience" | "comfortable_with_ai_tools";
  techPreferences: string[];
  inspiration: string | null;
  constraints: string | null;
}

export interface GeneratePromptBlueprintOutput {
  domain: string;
  scenario: string;
  goal: string;
  explanation: string; // markdown, per-pillar justification
  promptBlueprint: string; // the copy-pasteable, ### SECTION ### delimited prompt
  mermaidDiagram: string; // raw mermaid syntax, no code-fence wrapper
  nextSteps: string; // markdown
}

export interface AIProvider {
  summarize(input: SummarizeInput): Promise<SummarizeOutput>;
  classify(input: ClassifyInput): Promise<ClassifyOutput>;
  judgeHoldReason(input: JudgeHoldReasonInput): Promise<JudgeHoldReasonOutput>;
  assessRelevance(input: AssessRelevanceInput): Promise<AssessRelevanceOutput>;
  generateLesson(input: GenerateLessonInput): Promise<GenerateLessonOutput>;
  generateSupplementaryLesson(input: GenerateSupplementaryLessonInput): Promise<GenerateSupplementaryLessonOutput>;
  generatePromptBlueprint(input: GeneratePromptBlueprintInput): Promise<GeneratePromptBlueprintOutput>;
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

  // Deliberately NOT fail-open like assessRelevance above -- an empty
  // lesson body must never be mistaken for real generated content. The
  // caller (app/api/cron/university-generate/route.ts) treats an empty
  // body as a failed generation attempt, not a lesson ready for review.
  async generateLesson(): Promise<GenerateLessonOutput> {
    return { body: "", terms: [] };
  }

  // Same discipline as generateLesson above: empty title/body must
  // never be mistaken for a real proposed lesson. The cron route
  // treats an empty title as a failed generation attempt.
  async generateSupplementaryLesson(): Promise<GenerateSupplementaryLessonOutput> {
    return { title: "", level: "intermediate", body: "", terms: [] };
  }

  // Fail-closed like generateLesson, not fail-open like assessRelevance:
  // an empty Blueprint must never be mistaken for a real generation the
  // caller can persist and bill against the user's daily cap.
  async generatePromptBlueprint(): Promise<GeneratePromptBlueprintOutput> {
    return { domain: "", scenario: "", goal: "", explanation: "", promptBlueprint: "", mermaidDiagram: "", nextSteps: "" };
  }
}

// Initialize with no-op to prevent startup errors
setAIProvider(new NoOpProvider());
