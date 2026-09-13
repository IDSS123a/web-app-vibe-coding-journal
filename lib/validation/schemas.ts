import { z } from "zod";

// Auth & User Registration
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  tools_used: z.array(z.enum(["no_code_low_code", "ai_assisted_ide", "agent_based_coding", "other"])).min(1, "Select at least one tool"),
  depth_preference: z.enum(["simple", "technical_when_needed", "deep_technical"]),
  other_tools_freetext: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// User Profile
export const userProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(["user", "admin"]).default("user"),
  tools_used: z.array(z.enum(["no_code_low_code", "ai_assisted_ide", "agent_based_coding", "other"])),
  depth_preference: z.enum(["simple", "technical_when_needed", "deep_technical"]),
  other_tools_freetext: z.string().nullable(),
  // P-13 (Sprint 07): subscription/trial lifecycle
  subscription_status: z.enum(["trial", "active", "expired"]),
  trial_started_at: z.string().datetime().nullable(),
  trial_ends_at: z.string().datetime().nullable(),
  subscription_expires_at: z.string().datetime().nullable(),
  subscription_tier: z.enum(["basic", "premium"]),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

// Article (source document to be processed)
export const articleSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  url: z.string().url(),
  source: z.string().min(1),
  published_at: z.string().datetime(),
  raw_summary: z.string().nullable(), // pre-editorial, internal only
  summary: z.string().nullable(), // final, editorial-voice text
  why_it_matters: z.string().nullable(),
  who_it_affects: z.string().nullable(),
  worth_trying: z.enum(["yes", "no", "maybe"] as const).nullable(),
  importance_score: z.number().int().min(1).max(10).nullable(),
  category: z.string().nullable(), // enum per project brief §5
  quality_flag: z
    .enum([
      "news",
      "marketing",
      "rumor",
      "tutorial",
      "release",
      "benchmark",
      "research",
      "clickbait",
    ] as const)
    .nullable(),
  confidence_score: z.number().min(0).max(1).nullable(),
  // Phase 2 (specs/vibe-coding-intelligence-engine/ROADMAP.md): the P-0
  // relevance gate's graded judgment (migration 011) -- distinct from
  // confidence_score, which is a general content-quality heuristic
  // (scoreArticleConfidence) unrelated to topical relevance.
  relevance_score: z.number().int().min(0).max(100).nullable(),
  duplicate_of: z.string().uuid().nullable(),
  hash: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Article = z.infer<typeof articleSchema>;

// Daily Report
export const dailyReportSchema = z.object({
  id: z.string().uuid(),
  date: z.string().date(),
  markdown: z.string(),
  reading_time_minutes: z.number().int().min(0).nullable(),
  article_count: z.number().int().min(0),
  sections: z.array(z.string()),
  review_status: z.enum(["auto_published", "held_for_review", "manually_approved", "rejected"] as const),
  approved_by: z.string().nullable(),
  approved_at: z.string().datetime().nullable(),
  rejected_by: z.string().nullable(),
  rejected_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type DailyReport = z.infer<typeof dailyReportSchema>;

// User bookmarks
export const bookmarkSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  article_id: z.string().uuid(),
  created_at: z.string().datetime(),
});

export type Bookmark = z.infer<typeof bookmarkSchema>;

// Sprint 10: create-bookmark request body (E-2 boundary validation)
export const createBookmarkInputSchema = z.object({
  article_id: z.string().uuid(),
});

export type CreateBookmarkInput = z.infer<typeof createBookmarkInputSchema>;

// Sprint 10: links a daily_reports row to the articles rendered into it
// (migration 009) -- see that migration's comment for why this didn't
// exist before and what it now makes possible (per-article Archive/
// Bookmarks UI instead of only a single markdown blob per report).
export const dailyReportArticleSchema = z.object({
  id: z.string().uuid(),
  report_id: z.string().uuid(),
  article_id: z.string().uuid(),
  created_at: z.string().datetime(),
});

export type DailyReportArticle = z.infer<typeof dailyReportArticleSchema>;

// Payment events (Sprint 08, P-16) — idempotency + audit log for PayPal
// webhook deliveries. `status` distinguishes a successfully-activated
// subscription from an ambiguous state needing manual review (P-1) from
// a real-but-unacted-on event type.
export const paymentEventSchema = z.object({
  id: z.string().uuid(),
  paypal_event_id: z.string().min(1),
  event_type: z.string().min(1),
  user_id: z.string().uuid().nullable(),
  tier: z.enum(["basic", "premium"]).nullable(),
  amount_usd: z.number().nonnegative().nullable(),
  status: z.enum(["processed", "ambiguous", "ignored"]),
  raw_payload: z.record(z.string(), z.unknown()),
  created_at: z.string().datetime(),
});

export type PaymentEvent = z.infer<typeof paymentEventSchema>;

// Hold-gate calibration learning (specs/hold-gate-calibration-learning/) —
// Phase 1 of the Director's continuous-learning idea, scoped to the P-3/P-6
// hold gate. One row per analysis run.
export const holdGateCalibrationRunSchema = z.object({
  id: z.string().uuid(),
  triggered_by: z.enum(["manual", "scheduled"]),
  status: z.enum(["running", "completed", "failed"]),
  reports_analyzed_count: z.number().int().nonnegative().nullable(),
  summary_markdown: z.string().nullable(),
  error_message: z.string().nullable(),
  created_at: z.string().datetime(),
  completed_at: z.string().datetime().nullable(),
});

export type HoldGateCalibrationRun = z.infer<typeof holdGateCalibrationRunSchema>;

// One row per hype-word/hold-reason occurrence actually judged. A
// report_id already covered here is never re-judged by a later run (the
// Director's explicit free-only constraint) — this table doubles as the
// "have we already judged this" record.
export const holdGateCalibrationFindingSchema = z.object({
  id: z.string().uuid(),
  run_id: z.string().uuid(),
  report_id: z.string().uuid().nullable(),
  report_date: z.string().date(),
  hold_reason: z.string().min(1),
  verdict: z.enum(["genuine_hype", "false_positive", "uncertain"]),
  ai_reasoning: z.string().min(1),
  created_at: z.string().datetime(),
});

export type HoldGateCalibrationFinding = z.infer<typeof holdGateCalibrationFindingSchema>;

// Candidate changes derived from findings. The system never applies one
// itself — `status` only ever changes via an explicit Director action.
export const holdGateCalibrationSuggestionSchema = z.object({
  id: z.string().uuid(),
  run_id: z.string().uuid(),
  suggestion_text: z.string().min(1),
  rationale: z.string().min(1),
  status: z.enum(["pending", "applied", "dismissed"]),
  applied_by: z.string().uuid().nullable(),
  applied_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
});

export type HoldGateCalibrationSuggestion = z.infer<typeof holdGateCalibrationSuggestionSchema>;

// Validates the AI provider's judgeHoldReason response before it's
// trusted for anything (E-2: an external API response is a claim, not a
// fact, until parsed) — an unparseable response is a finding-level
// failure to log and count, never silently dropped (E-5/AUDIT-003).
export const judgeHoldReasonOutputSchema = z.object({
  verdict: z.enum(["genuine_hype", "false_positive", "uncertain"]),
  reasoning: z.string().min(1),
});

export type JudgeHoldReasonOutput = z.infer<typeof judgeHoldReasonOutputSchema>;

// P-0 (🔴 CRITICAL) relevance gate — validates the AI provider's
// assessRelevance response before it's trusted (E-2). Found live
// 2026-09-11: nothing in the pipeline previously checked topical
// relevance at all, letting off-topic content (aviation, math, music
// theory, NASA imaging, etc.) publish alongside real vibe-coding content.
//
// Phase 2 (specs/vibe-coding-intelligence-engine/ROADMAP.md, 2026-09-13):
// upgraded from a boolean isRelevant to a graded 0-100 relevanceScore --
// still the same underlying judgment call, but a graded score is kept
// (migration 011, articles.relevance_score) rather than discarded after
// the request, supporting future calibration the way Hold-Gate
// Calibration already does for the hype-word gate.
export const assessRelevanceOutputSchema = z.object({
  relevanceScore: z.number().int().min(0).max(100),
  reasoning: z.string().min(1),
});

export type AssessRelevanceOutput = z.infer<typeof assessRelevanceOutputSchema>;
