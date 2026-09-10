/**
 * Gemini AI Provider (PDL-006)
 *
 * Talks to the Gemini REST API directly via fetch — no SDK dependency.
 * Deliberate: HTTP status codes / Google's `status` error field are
 * unambiguous, version-stable signals for the fallback-on-error key
 * rotation required by sprints/SPRINT_05.md §5; wrapping an SDK would mean
 * trusting its internal error-classification instead of the wire format.
 *
 * Key rotation (SPRINT_05.md §5, confirmed by Director):
 *   - Fallback-on-error, NOT round-robin. Every call starts at the first
 *     configured key.
 *   - Advances to the next key on EITHER of two per-key failure kinds
 *     (Sprint 06 follow-up, PDL-012): rate-limit/quota (HTTP 429 or status
 *     RESOURCE_EXHAUSTED) OR auth/permission failure (HTTP 401/403, or
 *     status PERMISSION_DENIED/UNAUTHENTICATED) — the latter added because
 *     the key rotation strategy itself carries a known, Director-accepted
 *     Google ToS risk (PDL-012: rotating across multiple Google accounts to
 *     multiply free-tier quota), so an individual key/account being
 *     suspended is a real, anticipated failure mode, not a hypothetical.
 *     Any OTHER error (bad request, network failure, 5xx) is NOT retried
 *     across keys — it surfaces immediately, unchanged from Sprint 05.
 *   - If every configured key fails, throws GeminiKeysExhaustedError with a
 *     `reason` field: `"quota"` if every failure was rate-limit-only, or
 *     `"suspected_suspension"` if ANY key showed an auth/permission failure
 *     (worse-case wins — P-1.1 fail-loud toward the more urgent
 *     interpretation, never silently downgraded to "just wait"). Callers
 *     use `reason` to produce a distinctly different P-6 hold/alert message
 *     — "wait until tomorrow" reads nothing like "act now."
 *   - Logging prints the key's index (e.g. "key 3 rate-limited, trying key
 *     4") plus a small set of structured, non-secret quota fields pulled
 *     from Google's error body when present (quotaId, quotaValue,
 *     retryDelay, the error's `status` field) — e.g. distinguishing a
 *     per-day cap from a per-minute one. The key VALUE itself, the request
 *     URL, and the raw error body/message are never logged — only the
 *     specific allowlisted fields below (2026-07-21 fix: the original
 *     "discard everything" version made post-mortem quota diagnosis
 *     impossible, discovered the hard way; see corrections/SPRINT_06_LESSONS.md).
 *   - Detection caveat: 401/403/PERMISSION_DENIED/UNAUTHENTICATED are
 *     Google's standard, documented API error model — this is NOT verified
 *     against a live suspended account (not something safe or ethical to
 *     deliberately trigger for a test). If Google's actual suspension
 *     response ever differs from this standard shape, this detection may
 *     miss it; treat any unexpected all-keys-fail pattern as worth manual
 *     investigation regardless of which GeminiKeysExhaustedError.reason
 *     it reports.
 */

import type {
  AIProvider,
  SummarizeInput,
  SummarizeOutput,
  ClassifyInput,
  ClassifyOutput,
  JudgeHoldReasonInput,
  JudgeHoldReasonOutput,
} from "./ai-provider";

// A-5/AUDIT-003: sized to the longest expected output for this specific
// call (a verdict + a short sentence of reasoning) -- far shorter than
// summarize/classify's outputs, confirmed against real judged output
// during live verification of this method, not assumed.
const JUDGE_HOLD_REASON_MAX_OUTPUT_TOKENS = 512;

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export type GeminiExhaustionReason = "quota" | "suspected_suspension";

export class GeminiKeysExhaustedError extends Error {
  reason: GeminiExhaustionReason;

  constructor(keyCount: number, reason: GeminiExhaustionReason) {
    const detail =
      reason === "suspected_suspension"
        ? "possible account suspension, not just quota exhaustion"
        : "rate-limited/quota-exceeded";
    super(`All ${keyCount} Gemini API key(s) failed: ${detail}`);
    this.name = "GeminiKeysExhaustedError";
    this.reason = reason;
  }
}

/**
 * PDL-012 simplification (Sprint 06, 2026-07-18): there is exactly one
 * Gemini key set (GEMINI_API_KEY_1..8), used for both local/preview work
 * and production, by explicit Director decision — PDL-012 states plainly
 * "one set for now, pending a separate non-ToS-risk production AI
 * strategy." A VERCEL_ENV-based dev/prod branch (with a `_DEV_` name and
 * symmetric fallback) briefly existed here and was deliberately removed:
 * with only one real set, the branch was complexity with no corresponding
 * need, and a `_DEV_`-named secret sitting in the Vercel Production
 * dashboard reads as a mistake to anyone who looks (Director, future ACA,
 * future collaborator) even though it wasn't one. No functional behavior
 * changes: the previous fallback logic always resolved to this same 8-key
 * set anyway, since only one set was ever actually populated.
 */
function loadApiKeys(): string[] {
  const keys: string[] = [];
  for (let i = 1; i <= 8; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key) keys.push(key);
  }
  return keys;
}

interface GeminiErrorBody {
  error?: {
    code?: number;
    status?: string;
    message?: string;
    details?: Array<{
      reason?: string;
      "@type"?: string;
      retryDelay?: string;
      violations?: Array<{ quotaId?: string; quotaValue?: string }>;
    }>;
  };
}

type KeyFailureKind = "rate_limit" | "auth_or_suspended" | null;

/**
 * Pulls ONLY a small allowlist of non-secret diagnostic fields out of a
 * Gemini error body — quotaId (e.g. "GenerateRequestsPerDayPerProjectPerModel-
 * FreeTier", which distinguishes a per-day cap from a per-minute one),
 * quotaValue, retryDelay, and the API's own `status` string. Never the key,
 * never the request URL, never the free-text `message` field (which itself
 * doesn't contain the key, but isn't on the allowlist and isn't needed —
 * the structured fields say the same thing more precisely). Returns "" when
 * there's nothing safe to report.
 */
function extractSafeQuotaInfo(body: GeminiErrorBody | null): string {
  if (!body?.error) return "";
  const parts: string[] = [];
  if (body.error.status) parts.push(`apiStatus=${body.error.status}`);
  for (const detail of body.error.details ?? []) {
    if (detail.retryDelay) parts.push(`retryDelay=${detail.retryDelay}`);
    for (const violation of detail.violations ?? []) {
      if (violation.quotaId) parts.push(`quotaId=${violation.quotaId}`);
      if (violation.quotaValue) parts.push(`quotaValue=${violation.quotaValue}`);
    }
  }
  return parts.length > 0 ? ` (${parts.join(", ")})` : "";
}

/**
 * PDL-012 evidence note: a genuinely invalid/revoked key was verified live
 * against the real API and returns HTTP 400, status "INVALID_ARGUMENT",
 * with error.details[].reason === "API_KEY_INVALID" — NOT 401/403 as the
 * general Google API error model would suggest. That reason code is the
 * precise signal used here (a 400 with a different reason, e.g. a
 * malformed prompt/request, is NOT this — rotating keys would not fix a
 * bad request, so only the specific key-invalid reason counts).
 * 401/403/PERMISSION_DENIED/UNAUTHENTICATED are kept as defensive coverage
 * for a suspended-account response, which was not possible to verify live
 * (not safe/ethical to deliberately trigger a real suspension to test).
 */
function classifyFailure(httpStatus: number, body: GeminiErrorBody | null): KeyFailureKind {
  if (httpStatus === 429 || body?.error?.status === "RESOURCE_EXHAUSTED") {
    return "rate_limit";
  }
  const invalidKeyReason = body?.error?.details?.some((d) => d.reason === "API_KEY_INVALID");
  if (
    httpStatus === 401 ||
    httpStatus === 403 ||
    body?.error?.status === "PERMISSION_DENIED" ||
    body?.error?.status === "UNAUTHENTICATED" ||
    invalidKeyReason
  ) {
    return "auth_or_suspended";
  }
  return null; // not a per-key-rotatable failure — surfaces immediately
}

async function callGeminiJSON(
  keys: string[],
  prompt: string,
  maxOutputTokens?: number,
): Promise<Record<string, unknown>> {
  if (keys.length === 0) {
    throw new Error("No GEMINI_API_KEY_* configured");
  }

  // PDL-012: the rotation strategy itself carries a known ToS risk (multiple
  // Google accounts to multiply free-tier quota), so an auth/suspension
  // failure on one key must not be silently mistaken for ordinary quota
  // exhaustion — track every failure kind seen across the rotation and let
  // the worse interpretation win.
  let sawAuthOrSuspended = false;

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
          generationConfig: {
            responseMimeType: "application/json",
            // A-5/AUDIT-003: size to the LONGEST expected structured output
            // for the specific call, not the average -- omitted (Gemini's
            // own default) for summarize/classify, unchanged from before
            // this parameter existed, and explicitly set by
            // judgeHoldReason below.
            ...(maxOutputTokens !== undefined && { maxOutputTokens }),
          },
        }),
      });
    } catch {
      // Network-level failure — not a per-key issue, don't rotate keys, fail this call.
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

    // Parse the error body to classify the failure and pull safe diagnostic
    // fields (see extractSafeQuotaInfo) — never forwarded to logs verbatim,
    // only the specific allowlisted fields.
    let body: GeminiErrorBody | null = null;
    try {
      body = (await response.json()) as GeminiErrorBody;
    } catch {
      body = null;
    }

    const failureKind = classifyFailure(response.status, body);
    const quotaInfo = extractSafeQuotaInfo(body);

    if (failureKind === "rate_limit" || failureKind === "auth_or_suspended") {
      if (failureKind === "auth_or_suspended") {
        sawAuthOrSuspended = true;
      }
      const label = failureKind === "auth_or_suspended" ? "auth/permission failure" : "rate-limited";
      const nextIndex = i + 1;
      if (nextIndex < keys.length) {
        console.warn(`[GEMINI] key ${i + 1} ${label}, trying key ${nextIndex + 1}${quotaInfo}`);
        continue;
      }
      console.warn(`[GEMINI] key ${i + 1} ${label}, no more keys configured${quotaInfo}`);
      throw new GeminiKeysExhaustedError(
        keys.length,
        sawAuthOrSuspended ? "suspected_suspension" : "quota",
      );
    }

    // Any other error (bad request, 5xx, etc.): surface immediately, do not rotate.
    throw new Error(`Gemini request failed: HTTP ${response.status}`);
  }

  // Unreachable in practice (loop either returns or throws), but keeps
  // TypeScript control-flow analysis satisfied.
  throw new GeminiKeysExhaustedError(keys.length, sawAuthOrSuspended ? "suspected_suspension" : "quota");
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

  async judgeHoldReason(input: JudgeHoldReasonInput): Promise<JudgeHoldReasonOutput> {
    const prompt = `You are auditing a content-quality filter for a developer news digest. The filter blocked publication because the word/phrase "${input.holdReason}" appeared in an article. Judge whether this specific occurrence is genuine hype/marketing language (the kind the filter is meant to catch) or a false positive (e.g. a proper noun, a quote, or plain factual usage that happens to contain the word but isn't hype).

Excerpt containing the occurrence:
"""
${input.reportExcerpt}
"""

Return ONLY a JSON object: { "verdict": "genuine_hype" | "false_positive" | "uncertain", "reasoning": string (one sentence) }
Use "uncertain" only if the excerpt genuinely doesn't give enough context to decide either way.`;

    const result = await callGeminiJSON(this.keys, prompt, JUDGE_HOLD_REASON_MAX_OUTPUT_TOKENS);

    const verdict =
      result.verdict === "genuine_hype" || result.verdict === "false_positive" || result.verdict === "uncertain"
        ? result.verdict
        : "uncertain";

    return {
      verdict,
      reasoning: typeof result.reasoning === "string" ? result.reasoning : "",
    };
  }
}
