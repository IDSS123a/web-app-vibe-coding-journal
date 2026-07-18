-- Migration: 001_initial_schema.sql
-- Purpose: Core data model for Vibe-Coding Journal
-- Schema: Article, DailyReport, UserProfile (P-4)
-- Never modify this migration after it has been applied.

-- UserProfile table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  -- P-2: Target audience profile
  tools_used TEXT[] NOT NULL, -- array of enum values
  depth_preference TEXT NOT NULL CHECK (depth_preference IN ('simple', 'technical_when_needed', 'deep_technical')),
  -- P-2a: Free-text field for "other" tools, never used to drive filtering logic
  other_tools_freetext TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Article table (P-4)
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  source TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  raw_summary TEXT, -- pre-editorial, internal only
  summary TEXT, -- final, editorial-voice text per P-3
  why_it_matters TEXT,
  who_it_affects TEXT,
  worth_trying TEXT CHECK (worth_trying IN ('yes', 'no', 'maybe', NULL)),
  importance_score INTEGER CHECK (importance_score >= 1 AND importance_score <= 10),
  category TEXT, -- enum per project brief §5, added via DECISION_LOG
  quality_flag TEXT CHECK (quality_flag IN ('news', 'marketing', 'rumor', 'tutorial', 'release', 'benchmark', 'research', 'clickbait', NULL)),
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 1),
  duplicate_of UUID REFERENCES public.articles(id) ON DELETE SET NULL,
  hash TEXT NOT NULL UNIQUE, -- for duplicate detection
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DailyReport table (P-4)
CREATE TABLE IF NOT EXISTS public.daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  markdown TEXT NOT NULL,
  reading_time_minutes INTEGER CHECK (reading_time_minutes >= 0),
  article_count INTEGER NOT NULL CHECK (article_count >= 0),
  sections TEXT[] NOT NULL, -- ["Najvažnije", "Trendovi", "Novi alati", ...]
  review_status TEXT NOT NULL CHECK (review_status IN ('auto_published', 'held_for_review', 'manually_approved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bookmarks join table (P-4)
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON public.articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_source ON public.articles(source);
CREATE INDEX IF NOT EXISTS idx_articles_hash ON public.articles(hash);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON public.daily_reports(date DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_article_id ON public.bookmarks(article_id);

-- Row-level security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- User can only read their own profile
CREATE POLICY "Users can read own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- User can update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Authenticated users can read all articles
CREATE POLICY "Authenticated users can read articles" ON public.articles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated users can read published daily reports
CREATE POLICY "Authenticated users can read daily reports" ON public.daily_reports
  FOR SELECT USING (auth.role() = 'authenticated');

-- Users can only read their own bookmarks
CREATE POLICY "Users can read own bookmarks" ON public.bookmarks
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own bookmarks
CREATE POLICY "Users can insert own bookmarks" ON public.bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own bookmarks
CREATE POLICY "Users can delete own bookmarks" ON public.bookmarks
  FOR DELETE USING (auth.uid() = user_id);
