/**
 * Free relevance triage (2026-09-19, knowledge-growth work). NO AI CALL.
 *
 * Why it exists: every article used to cost at least one Gemini call just to be told
 * it was off topic, and the free tier allows only a few calls per minute per key.
 * Real data: of 4,000 stored articles about 94 percent never got scored because the
 * quota could not keep up, and most of the queue was general tech news (aviation,
 * math, hardware) from Hacker News. This checks whether the title or summary mentions
 * anything from the AI and software vocabulary at all. If it mentions nothing, the P-0
 * gate would score it near zero anyway, so it is dropped here for free. Everything
 * else goes on to the AI gate, which makes the real judgment.
 *
 * It deliberately errs toward passing things on (a word like "code" or "model" is
 * enough): the cost of a false pass is one batched AI judgment, the cost of a false
 * skip is a missed story. Skips are recorded (articles.relevance_source = 'triage')
 * so the lexicon can be widened and the skipped set re-scored later.
 */

/** Vocabulary specific to AI-assisted software building. A hit here is a strong signal. */
const STRONG_TERMS = [
  "vibe cod", "vibe-cod", "vibecod", "ai cod", "coding agent", "coding assistant", "code generation", "agentic",
  "claude code", "cursor", "windsurf", "copilot", "codex", "devin", "lovable", "bolt.new", "replit", "v0.dev",
  "mcp", "model context protocol", "prompt engineering", "context engineering", "ai ide", "ai-native",
  "pair program", "ai pair", "code review", "llm", "large language model", "gemini", "claude", "anthropic",
  "openai", "gpt", "chatgpt", "deepseek", "mistral", "llama", "hugging face", "copilot", "agent sdk", "ai sdk",
  "ai agent", "ai gateway", "tool calling", "function calling", "rag", "embedding", "fine-tun", "inference",
  "ai model", "ai-generated", "generated code", "ai tool", "ai assistant", "swe-bench", "benchmark",
];

/** Broad software vocabulary. Alone it is weaker evidence, but enough to ask the AI gate. */
const BROAD_TERMS = [
  " ai ", "ai-", "-ai", "artificial intelligence", "machine learning", "neural", "prompt", "model", "agent",
  "coding", "programming", "developer", "software", "codebase", "repository", "github", "gitlab",
  "vercel", "supabase", "next.js", "nextjs", "react", "typescript", "javascript", "python", "rust", "golang",
  "api", "sdk", "cli", "deploy", "framework", "open source", "open-source", "devops", "database", "postgres",
  "sql", "backend", "frontend", "full-stack", "serverless", "docker", "kubernetes", "compiler",
  "testing", "debug", "refactor", "automation", "workflow", "no-code", "low-code", "app builder",
  "saas", "vulnerab", "supply chain", "npm",
  "vscode", "jetbrains",
];

export type TriageDecision = "ai" | "skip";

export interface TriageResult {
  decision: TriageDecision;
  reason: "strong_term" | "broad_term" | "trusted_source" | "no_vocabulary";
}

export interface TriageInput {
  title: string;
  summary?: string | null;
  /** From the sources table: A (official vendor) is trusted enough to always reach the AI gate. */
  sourceClass?: string | null;
}

function normalise(text: string): string {
  return ` ${text.toLowerCase().replace(/\s+/g, " ")} `;
}

export function triageArticle(input: TriageInput): TriageResult {
  const haystack = normalise(`${input.title} ${(input.summary ?? "").slice(0, 600)}`);

  if (STRONG_TERMS.some((t) => haystack.includes(t))) return { decision: "ai", reason: "strong_term" };
  if (BROAD_TERMS.some((t) => haystack.includes(t))) return { decision: "ai", reason: "broad_term" };
  // Official vendor blogs are few and mostly on topic; let the AI gate judge them even
  // when a title is terse ("Introducing Sora 3").
  if (input.sourceClass === "A") return { decision: "ai", reason: "trusted_source" };
  return { decision: "skip", reason: "no_vocabulary" };
}
