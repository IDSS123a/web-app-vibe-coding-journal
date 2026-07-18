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
  tools_used: z.array(z.enum(["no_code_low_code", "ai_assisted_ide", "agent_based_coding", "other"])),
  depth_preference: z.enum(["simple", "technical_when_needed", "deep_technical"]),
  other_tools_freetext: z.string().nullable(),
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
  sections: z.array(z.string()), // ["Najvažnije", "Trendovi", ...]
  review_status: z.enum(["auto_published", "held_for_review", "manually_approved"] as const),
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
