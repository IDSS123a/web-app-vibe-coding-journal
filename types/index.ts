/**
 * Shared TypeScript types — single source of truth (Commander M-7).
 *
 * Authoritative schema source: project CONSTITUTION.md P-4.
 * Do not add fields here that are not listed in P-4 without first
 * updating CONSTITUTION.md and logging the change (P-12 Definition
 * of Done requirement).
 */

export type WorthTrying = "yes" | "no" | "maybe";

export type QualityFlag =
  | "news"
  | "marketing"
  | "rumor"
  | "tutorial"
  | "release"
  | "benchmark"
  | "research"
  | "clickbait";

export type ReviewStatus = "auto_published" | "held_for_review" | "manually_approved";

export type DepthPreference = "simple" | "technical_when_needed" | "deep_technical";

export type ToolUsed =
  | "no_code_low_code"
  | "ai_assisted_ide"
  | "agent_based_coding"
  | "other";

// Re-export schemas for use in components and actions
export type {
  Article,
  DailyReport,
  UserProfile,
  Bookmark,
  RegisterInput,
} from "@/lib/validation/schemas";
