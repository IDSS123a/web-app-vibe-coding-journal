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
  AssessRelevanceInput,
  AssessRelevanceOutput,
  GenerateLessonInput,
  GenerateLessonOutput,
  GenerateSupplementaryLessonInput,
  GenerateSupplementaryLessonOutput,
} from "./ai-provider";

// A-5/AUDIT-003: sized to the longest expected output for this specific
// call. Originally set to 512 assuming only the visible output (a
// verdict/score + a short sentence) counted against this budget --
// WRONG, found live 2026-09-13 while calibrating assessRelevance()'s
// upgraded prompt: gemini-2.5-flash is a "thinking" model whose internal
// reasoning tokens (`thoughtsTokenCount` in the API response, observed
// 379-488 in direct testing against this exact prompt) are deducted
// from maxOutputTokens BEFORE the visible text -- with a 512 budget, a
// harder judgment call could leave as little as ~20 tokens for the
// actual JSON, truncating it mid-string ("Unterminated string in JSON",
// intermittent -- present exactly when the model happened to think
// longer, absent when it didn't, which is why earlier live verification
// of judgeHoldReason() didn't catch this on a smaller sample). Both
// constants raised well above the largest observed thoughtsTokenCount
// plus the actual response, not just the visible text's own size.
const JUDGE_HOLD_REASON_MAX_OUTPUT_TOKENS = 2048;

// Same reasoning as above.
const ASSESS_RELEVANCE_MAX_OUTPUT_TOKENS = 2048;

// Found live 2026-09-14/15, University's first two real generation
// attempts: 4096 was still not enough. Both failures showed
// finishReason: MAX_TOKENS once the diagnostic context was added (see
// callGeminiJSON's parse-failure branch) -- a full lesson body (several
// paragraphs of markdown) plus up to 5 dictionary term/definition pairs
// is a much larger structured output than a relevance judgment or a
// hold-reason verdict, and still has the same "thinking" tokens
// deducted first. Doubled rather than incremented, matching this
// project's own repeated lesson (ASSESS_RELEVANCE_MAX_OUTPUT_TOKENS
// above went 512->2048 in one jump, not a slow climb) -- raise
// generously once, re-verify live, don't guess-and-check in small steps.
const LESSON_GENERATION_MAX_OUTPUT_TOKENS = 8192;

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// "model_deprecated" added 2026-09-11: found live while verifying the P-0
// relevance-gate fix -- key #3 of 8 returned HTTP 404 NOT_FOUND, body
// "This model models/gemini-2.5-flash is no longer available to new
// users. Please update your code to use models/gemini-3.6-flash," while
// keys #1/#2 were merely rate-limited and #4-#8 still worked. This is a
// distinct, non-transient failure (a rate limit self-resolves; a
// deprecated model does not) and needs its own signal to the Director,
// not to be folded into "quota" or misread as an account suspension.
export type GeminiExhaustionReason = "quota" | "suspected_suspension" | "model_deprecated";

export class GeminiKeysExhaustedError extends Error {
  reason: GeminiExhaustionReason;

  constructor(keyCount: number, reason: GeminiExhaustionReason) {
    const detail =
      reason === "suspected_suspension"
        ? "possible account suspension, not just quota exhaustion"
        : reason === "model_deprecated"
          ? "the configured model is deprecated/unavailable on at least one key's project"
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

type KeyFailureKind = "rate_limit" | "auth_or_suspended" | "model_unavailable" | null;

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
  // Found live 2026-09-11: a 404/NOT_FOUND here means THIS key's Google
  // Cloud project no longer has the configured model available (Google's
  // own message: "no longer available to new users") -- a per-key/project
  // config difference, not a malformed request (which would 404/400 the
  // same way on every key). Rotating to the next key is the right
  // response, same as a rate limit, rather than aborting the whole call.
  if (httpStatus === 404 || body?.error?.status === "NOT_FOUND") {
    return "model_unavailable";
  }
  return null; // not a per-key-rotatable failure — surfaces immediately
}

// Found live 2026-09-14, active outage (same bug class already found and
// fixed once in features/sources/actions.ts's parseFeed): this fetch() had
// NO timeout at all. A single stalled/slow Gemini response could consume
// the entire remaining 300s function budget on its own, no matter how
// small MAX_ARTICLES_PER_QUALITY_RUN was capped -- confirmed via a live
// production run that still timed out at exactly 300s while processing
// only 5 articles, its last log line a single key-rotation warning with
// nothing after it. 25s is generous versus this project's normal Gemini
// response times (seconds) while still leaving room for several key
// rotations within the 300s budget if multiple keys are genuinely rate-
// limited. Same lesson as the RSS fix: the AbortController must stay
// armed through the response body read (response.json()), not just the
// initial fetch() -- fetch() resolves once headers arrive, not once the
// body is fully read.
const GEMINI_FETCH_TIMEOUT_MS = 25000;

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
  let sawModelUnavailable = false;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]!;
    const url = `${API_BASE}/${GEMINI_MODEL}:generateContent?key=${key}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GEMINI_FETCH_TIMEOUT_MS);

    try {
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
          signal: controller.signal,
        });
      } catch (fetchErr) {
        if (controller.signal.aborted) {
          throw new Error(`Gemini request timed out after ${GEMINI_FETCH_TIMEOUT_MS}ms`);
        }
        // Network-level failure — not a per-key issue, don't rotate keys, fail this call.
        throw new Error("Gemini request failed (network error)");
      }

      if (response.ok) {
        const data = await response.json();
        const finishReason = data?.candidates?.[0]?.finishReason;
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (typeof text !== "string") {
          throw new Error("Gemini response missing expected text content");
        }
        try {
          return JSON.parse(text) as Record<string, unknown>;
        } catch (parseErr) {
          // Found live 2026-09-13: a JSON.parse failure here almost always
          // means the response was truncated by maxOutputTokens (see this
          // file's MAX_OUTPUT_TOKENS constants' comment on gemini-2.5-
          // flash's internal "thinking" tokens eating the same budget) --
          // surfacing finishReason turns a cryptic "Unterminated string in
          // JSON" into an immediately diagnosable signal instead of a
          // repeat investigation.
          const parseMsg = parseErr instanceof Error ? parseErr.message : String(parseErr);
          const hint = finishReason === "MAX_TOKENS" ? " (finishReason: MAX_TOKENS -- response was truncated, raise the caller's maxOutputTokens)" : "";
          // Found live 2026-09-14/15 (Vibe-Coding University's first real
          // generation run): a parse failure is NOT always truncation --
          // this one had a normal finishReason but broke mid-string at a
          // specific character position, almost certainly Gemini emitting
          // an unescaped quote/control character inside a long free-text
          // field despite structured-output mode. `position N` in
          // JSON.parse's own message is the only lead a bare error message
          // gives; without the surrounding text, every such failure is a
          // fresh unstarted investigation. Slicing the raw text around
          // that position turns it into an immediately actionable one --
          // safe to include (this is article/lesson content the pipeline
          // already processes, never a credential).
          const posMatch = parseMsg.match(/position (\d+)/);
          const contextHint = posMatch
            ? (() => {
                const pos = Number(posMatch[1]);
                const start = Math.max(0, pos - 80);
                const snippet = text.slice(start, pos + 80);
                return ` | context around position ${pos}: ...${snippet}...`;
              })()
            : "";
          throw new Error(`Gemini response was not valid JSON: ${parseMsg}${hint}${contextHint}`);
        }
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

      if (failureKind === "rate_limit" || failureKind === "auth_or_suspended" || failureKind === "model_unavailable") {
        if (failureKind === "auth_or_suspended") {
          sawAuthOrSuspended = true;
        } else if (failureKind === "model_unavailable") {
          sawModelUnavailable = true;
        }
        const label =
          failureKind === "auth_or_suspended"
            ? "auth/permission failure"
            : failureKind === "model_unavailable"
              ? `model unavailable on this key's project (${GEMINI_MODEL})`
              : "rate-limited";
        const nextIndex = i + 1;
        if (nextIndex < keys.length) {
          console.warn(`[GEMINI] key ${i + 1} ${label}, trying key ${nextIndex + 1}${quotaInfo}`);
          continue;
        }
        console.warn(`[GEMINI] key ${i + 1} ${label}, no more keys configured${quotaInfo}`);
        throw new GeminiKeysExhaustedError(
          keys.length,
          sawAuthOrSuspended ? "suspected_suspension" : sawModelUnavailable ? "model_deprecated" : "quota",
        );
      }

      // Any other error (bad request, 5xx, etc.): surface immediately, do not rotate.
      throw new Error(`Gemini request failed: HTTP ${response.status}`);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Unreachable in practice (loop either returns or throws), but keeps
  // TypeScript control-flow analysis satisfied.
  throw new GeminiKeysExhaustedError(
    keys.length,
    sawAuthOrSuspended ? "suspected_suspension" : sawModelUnavailable ? "model_deprecated" : "quota",
  );
}

const P3_SYSTEM_RULES = `You are writing content for a daily developer intelligence digest.
You MUST follow these non-negotiable editorial rules:
- Never use hype words or phrases, even to describe something genuinely notable: "revolutionary", "game changer", "groundbreaking", "unprecedented", "disrupts", "changes everything". State what changed and why it matters in plain, measured language instead.
- Every summary must end with an actionable judgment, not just a description.
- Never use unexplained jargon. If you use a technical term (e.g. MCP, RAG, tool calling, context window, agent mode), briefly gloss it in plain language the first time.
- Prefer comparative framing over isolated description when the subject has direct competitors.
- Evidence framing (Phase 3, specs/vibe-coding-intelligence-engine/ROADMAP.md): if a claim originates from a vendor/company about their own product -- a performance, productivity, capability, or benchmark claim that the article itself does not independently verify -- attribute it explicitly as their claim ("The company reports...", "X claims...", "According to Y's announcement...") rather than restating it as established fact. Example: a vendor says "our new agent makes developers 5x faster" -- write "The company reports a 5x productivity improvement," never "Developers are 5x faster." This applies to claims about the vendor's OWN product; reporting that an event happened (a release shipped, a feature launched) is a fact and does not need this hedge -- only the vendor's unverified evaluative claims about that event's impact do.`;

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
  "confidence": number,            // your confidence 0-1 that this summary is accurate and complete
  "what_to_watch": string          // one sentence, forward-looking: what to look for NEXT on this story (a promised follow-up, a stability/adoption signal, a metric that would confirm or undercut the vendor's claim) -- not a restatement of why_it_matters
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
      what_to_watch: typeof result.what_to_watch === "string" ? result.what_to_watch : "",
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

  async assessRelevance(input: AssessRelevanceInput): Promise<AssessRelevanceOutput> {
    // Phase 2 (specs/vibe-coding-intelligence-engine/ROADMAP.md,
    // 2026-09-13): 0-100 graded score, not a boolean -- and the
    // relevance definition itself expanded to the Director's explicit,
    // strict list (vibe coding, AI coding agents, agentic software
    // engineering, AI-native IDEs, MCP, context engineering, AI
    // testing/debugging/code review/security, and similar), reinforcing
    // the original P-0 framing rather than replacing it.
    const prompt = `You are the topic gate for "Vibe-Coding Journal," a daily digest STRICTLY for vibe-coders -- people building software with AI coding tools. This is NOT a general tech/AI/science news aggregator.

Score how directly relevant this article is, 0-100, to ANY of: vibe coding, AI-assisted coding, AI coding agents, agentic software engineering, AI-native IDEs, AI app builders (Bolt, Lovable, Replit, v0, Cursor, Windsurf, Claude Code, GitHub Copilot and similar), AI-generated code/UI/applications, prompt-driven development, AI code testing/debugging/review/quality/security, MCP, tool use, context engineering, AI coding benchmarks and productivity/reliability, or the future of software engineering under AI.

Calibration:
- 81-100: directly and specifically about one of the above
- 61-80: clearly relevant, meaningful practical connection
- 41-60: tangentially related, a stretch to call directly useful
- 21-40: peripheral, only loosely tech-adjacent
- 0-20: unrelated (general tech/AI/science news, aviation/aerospace, pure math/physics, hardware nostalgia, music/education, business/industry not about AI coding, etc.), even if it appeared on a tech-adjacent site like Hacker News

Title: ${input.title}
Summary: ${input.summary}

Return ONLY a JSON object: { "relevanceScore": integer 0-100, "reasoning": string (one sentence) }`;

    const result = await callGeminiJSON(this.keys, prompt, ASSESS_RELEVANCE_MAX_OUTPUT_TOKENS);

    const rawScore = result.relevanceScore;
    const relevanceScore =
      typeof rawScore === "number" && Number.isFinite(rawScore)
        ? Math.max(0, Math.min(100, Math.round(rawScore)))
        : 100; // fail open -- an unparseable score must never itself exclude real content

    return {
      relevanceScore,
      reasoning: typeof result.reasoning === "string" ? result.reasoning : "",
    };
  }

  /**
   * Vibe-Coding University weekly lesson generation (specs/vibe-coding-
   * university/PLAN.md). A lesson body is longer than a relevance
   * judgment or article summary, so this gets its own, larger token
   * budget -- same "thinking tokens eat the budget first" lesson as
   * ASSESS_RELEVANCE_MAX_OUTPUT_TOKENS's own comment, sized generously
   * rather than risking the same truncation bug in a new call site.
   */
  async generateLesson(input: GenerateLessonInput): Promise<GenerateLessonOutput> {
    const sourceText = input.sourceArticles
      .map((a, i) => `[Source ${i + 1}] ${a.title}\n${a.summary}`)
      .join("\n\n");

    const prompt = `${P3_SYSTEM_RULES}

You are writing one lesson for the Vibe-Coding University, a structured curriculum teaching vibe-coding (building software with AI coding tools) from beginner to expert.

Lesson title: "${input.lessonTitle}"
Curriculum level: ${input.courseLevel}

Write the lesson body as markdown (use ## for section headings within the lesson, not a top-level # title -- the title is already shown separately). Ground it in the source material below where genuinely relevant, but the lesson must stand on its own as a real teaching piece for the stated title and level -- do not simply summarize the sources. End with a concrete, actionable takeaway, matching this project's existing editorial voice.

Source material (recent, real articles -- use for grounding and current examples, not as the lesson's only content):
${sourceText || "(no directly relevant recent articles this run -- write from general, accurate knowledge of the topic instead)"}

Return ONLY a JSON object with exactly these fields:
{
  "body": string,   // the full lesson markdown body, following all rules above
  "terms": [ { "term": string, "definition": string }, ... ]  // 0 to 5 NEW vibe-coding terms this specific lesson introduces that a beginner might not know; omit terms already extremely common knowledge
}`;

    const result = await callGeminiJSON(this.keys, prompt, LESSON_GENERATION_MAX_OUTPUT_TOKENS);

    const rawTerms = Array.isArray(result.terms) ? result.terms : [];
    const terms = rawTerms
      .filter(
        (t): t is { term: unknown; definition: unknown } => typeof t === "object" && t !== null,
      )
      .map((t) => ({
        term: typeof t.term === "string" ? t.term : "",
        definition: typeof t.definition === "string" ? t.definition : "",
      }))
      .filter((t) => t.term.length > 0 && t.definition.length > 0)
      .slice(0, 5);

    return {
      body: typeof result.body === "string" ? result.body : "",
      terms,
    };
  }

  /**
   * Autonomous supplementary-lesson growth (specs/vibe-coding-university/
   * SPEC.md Amendment, PDL-042). Unlike generateLesson above, this DOES
   * invent the topic and level -- deliberately, and safely, because the
   * result always lands in pending_review (app/api/cron/university-
   * generate/route.ts), never publishes unreviewed. Same token budget as
   * generateLesson -- same shape of output (a full lesson body), just
   * with two more small fields (title, level) added to the same call
   * rather than a second one, so this costs nothing extra against the
   * free-tier weekly budget.
   */
  async generateSupplementaryLesson(
    input: GenerateSupplementaryLessonInput,
  ): Promise<GenerateSupplementaryLessonOutput> {
    const sourceText = input.sourceArticles
      .map((a, i) => `[Source ${i + 1}] ${a.title}\n${a.summary}`)
      .join("\n\n");

    const existingTitlesText =
      input.existingLessonTitles.length > 0
        ? input.existingLessonTitles.map((t) => `- ${t}`).join("\n")
        : "(none yet)";

    const prompt = `${P3_SYSTEM_RULES}

You are proposing and writing ONE new SUPPLEMENTARY lesson for the Vibe-Coding University, a structured curriculum teaching vibe-coding (building software with AI coding tools). The core curriculum (75 lessons across beginner/intermediate/expert) is fixed and complete -- this lesson is an ADD-ON layered on top of it, growing the curriculum's breadth as new material becomes available, not part of the required core path.

Topics already covered anywhere in the curriculum (core or supplementary) -- do NOT propose a topic that duplicates or closely overlaps any of these:
${existingTitlesText}

Source material (recent, real articles -- ground the lesson in genuinely new, current material from here):
${sourceText || "(no directly relevant recent articles this run -- do not generate a lesson; source material is required for a new supplementary topic)"}

Based on the source material, propose ONE specific, well-scoped lesson topic that is NOT already covered, genuinely useful to a vibe-coder, and grounded in what's actually in the source material above (not a generic topic the sources don't really support).

Classify which curriculum level this topic genuinely fits -- beginner, intermediate, or expert -- based on the actual complexity of the underlying concept for someone learning it, not which level the source article itself was written for. A topic explaining a basic concept in an advanced context is still a beginner topic; a nuanced operational or architectural topic is expert-level even if the source article is written simply.

Write the lesson body as markdown (use ## for section headings within the lesson, not a top-level # title -- the title is shown separately), matching this curriculum's existing editorial voice and P-3 rules above. The lesson must stand on its own as a real teaching piece, not simply summarize the sources. End with a concrete, actionable takeaway.

Return ONLY a JSON object with exactly these fields:
{
  "title": string,   // the proposed lesson title, matching this curriculum's existing title style
  "level": "beginner" | "intermediate" | "expert",
  "body": string,     // the full lesson markdown body, following all rules above
  "terms": [ { "term": string, "definition": string }, ... ]  // 0 to 5 NEW vibe-coding terms this specific lesson introduces that a beginner might not know; omit terms already extremely common knowledge
}`;

    const result = await callGeminiJSON(this.keys, prompt, LESSON_GENERATION_MAX_OUTPUT_TOKENS);

    const rawTerms = Array.isArray(result.terms) ? result.terms : [];
    const terms = rawTerms
      .filter(
        (t): t is { term: unknown; definition: unknown } => typeof t === "object" && t !== null,
      )
      .map((t) => ({
        term: typeof t.term === "string" ? t.term : "",
        definition: typeof t.definition === "string" ? t.definition : "",
      }))
      .filter((t) => t.term.length > 0 && t.definition.length > 0)
      .slice(0, 5);

    const rawLevel = typeof result.level === "string" ? result.level : "";
    // Fall back to "intermediate" for an invalid/missing classification
    // rather than rejecting the whole generation -- the admin review
    // gate is the real safety net; a slightly-off level classification
    // is a minor, correctable review note, not a failure worth discarding
    // real generated content over.
    const level: "beginner" | "intermediate" | "expert" =
      rawLevel === "beginner" || rawLevel === "intermediate" || rawLevel === "expert" ? rawLevel : "intermediate";

    return {
      title: typeof result.title === "string" ? result.title : "",
      level,
      body: typeof result.body === "string" ? result.body : "",
      terms,
    };
  }
}
