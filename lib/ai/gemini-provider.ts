/**
 * Gemini AI Provider (PDL-006)
 *
 * Talks to the Gemini REST API directly via fetch — no SDK dependency.
 * Deliberate: an HTTP 429 / `status: "RESOURCE_EXHAUSTED"` response is an
 * unambiguous, version-stable signal for the fallback-on-error key rotation
 * required by sprints/SPRINT_05.md §5; wrapping an SDK would mean trusting
 * its internal error-classification instead of the wire format.
 *
 * Key rotation (SPRINT_05.md §5, confirmed by Director):
 *   - Fallback-on-error, NOT round-robin. Every call starts at the first
 *     configured key.
 *   - Advances to the next key ONLY on a rate-limit/quota error (HTTP 429 or
 *     status RESOURCE_EXHAUSTED). Any other error (bad request, network
 *     failure, etc.) is NOT retried across keys — it surfaces immediately.
 *   - If every configured key is rate-limited, throws GeminiKeysExhaustedError
 *     — callers must catch this and hold the affected content for review
 *     (P-1.1: fail loudly, never a silent empty report, never an unhandled
 *     crash that takes the cron run down).
 *   - Logging prints ONLY the key's index (e.g. "key 3 rate-limited, trying
 *     key 4"). The key value itself is never logged, including inside any
 *     error text — the message is rebuilt from status/code, never the raw
 *     SDK/fetch error object that might echo the request URL.
 */

import type {
  AIProvider,
  SummarizeInput,
  SummarizeOutput,
  ClassifyInput,
  ClassifyOutput,
} from "./ai-provider";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export class GeminiKeysExhaustedError extends Error {
  constructor(keyCount: number) {
    super(`All ${keyCount} Gemini API key(s) are rate-limited/quota-exceeded`);
    this.name = "GeminiKeysExhaustedError";
  }
}

function loadApiKeys(): string[] {
  const keys: string[] = [];
  for (let i = 1; i <= 8; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key) keys.push(key);
  }
  return keys;
}

interface GeminiErrorBody {
  error?: { code?: number; status?: string; message?: string };
}

function isRateLimitError(httpStatus: number, body: GeminiErrorBody | null): boolean {
  if (httpStatus === 429) return true;
  return body?.error?.status === "RESOURCE_EXHAUSTED";
}

async function callGeminiJSON(keys: string[], prompt: string): Promise<Record<string, unknown>> {
  if (keys.length === 0) {
    throw new Error("No GEMINI_API_KEY_* configured");
  }

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]!;
    const url = `${API_BASE}/${GEMINI_MODEL}:generateContent?key=${key}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      });
    } catch {
      // Network-level failure — not a quota issue, don't rotate keys, fail this call.
      throw new Error("Gemini request failed (network error)");
    }

    if (response.ok) {
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof text !== "string") {
        throw new Error("Gemini response missing expected text content");
      }
      return JSON.parse(text) as Record<string, unknown>;
    }

    // Read the error body defensively; never forward it to logs verbatim
    // (it can contain the request context). Only status/code are used.
    let body: GeminiErrorBody | null = null;
    try {
      body = (await response.json()) as GeminiErrorBody;
    } catch {
      body = null;
    }

    if (isRateLimitError(response.status, body)) {
      const nextIndex = i + 1;
      if (nextIndex < keys.length) {
        console.warn(`[GEMINI] key ${i + 1} rate-limited, trying key ${nextIndex + 1}`);
        continue;
      }
      console.warn(`[GEMINI] key ${i + 1} rate-limited, no more keys configured`);
      throw new GeminiKeysExhaustedError(keys.length);
    }

    // Any non-quota error: surface immediately, do not rotate.
    throw new Error(`Gemini request failed: HTTP ${response.status}`);
  }

  // Unreachable in practice (loop either returns or throws), but keeps
  // TypeScript control-flow analysis satisfied.
  throw new GeminiKeysExhaustedError(keys.length);
}

const P3_SYSTEM_RULES = `You are writing content for a daily developer intelligence digest.
You MUST follow these non-negotiable editorial rules:
- Never use hype words or phrases, even to describe something genuinely notable: "revolutionary", "game changer", "groundbreaking", "unprecedented", "disrupts", "changes everything". State what changed and why it matters in plain, measured language instead.
- Every summary must end with an actionable judgment, not just a description.
- Never use unexplained jargon. If you use a technical term (e.g. MCP, RAG, tool calling, context window, agent mode), briefly gloss it in plain language the first time.
- Prefer comparative framing over isolated description when the subject has direct competitors.`;

function depthInstruction(tone?: SummarizeInput["tone"]): string {
  switch (tone) {
    case "casual":
      return "Depth: simple. Write for a reader who wants the plain-language takeaway, minimal technical detail, only what changes their recommendation.";
    case "technical":
      return "Depth: deep technical. Include implementation-relevant detail a working developer would want.";
    default:
      return "Depth: technical when needed. Default to simple language; add technical detail only where it changes the recommendation.";
  }
}

export class GeminiProvider implements AIProvider {
  private keys: string[];

  constructor() {
    this.keys = loadApiKeys();
  }

  async summarize(input: SummarizeInput): Promise<SummarizeOutput> {
    const prompt = `${P3_SYSTEM_RULES}

${depthInstruction(input.tone)}

Summarize the following article content for the digest. Return ONLY a JSON object with exactly these fields:
{
  "summary": string,               // the editorial-voice summary, following all rules above
  "why_it_matters": string,        // one to two sentences
  "who_it_affects": string,        // who should care, one sentence
  "worth_trying": "yes" | "no" | "maybe",  // fold your one-sentence justification into why_it_matters, do not add a separate field
  "confidence": number             // your confidence 0-1 that this summary is accurate and complete
}

Article content:
"""
${input.text.slice(0, input.maxLength ?? 4000)}
"""`;

    const result = await callGeminiJSON(this.keys, prompt);

    return {
      summary: typeof result.summary === "string" ? result.summary : "",
      why_it_matters: typeof result.why_it_matters === "string" ? result.why_it_matters : "",
      who_it_affects: typeof result.who_it_affects === "string" ? result.who_it_affects : "",
      worth_trying:
        result.worth_trying === "yes" || result.worth_trying === "no" || result.worth_trying === "maybe"
          ? result.worth_trying
          : "maybe",
      confidence: typeof result.confidence === "number" ? result.confidence : 0.5,
    };
  }

  async classify(input: ClassifyInput): Promise<ClassifyOutput> {
    const prompt = `Classify the following article content into EXACTLY ONE of these categories, or null if none clearly fits (do not guess):
${input.categories.map((c) => `- ${c}`).join("\n")}

Return ONLY a JSON object: { "category": string | null, "confidence": number }

Article content:
"""
${input.text.slice(0, 2000)}
"""`;

    const result = await callGeminiJSON(this.keys, prompt);

    const category =
      typeof result.category === "string" && input.categories.includes(result.category)
        ? result.category
        : "";

    return {
      category,
      confidence: typeof result.confidence === "number" ? result.confidence : 0.5,
    };
  }
}
