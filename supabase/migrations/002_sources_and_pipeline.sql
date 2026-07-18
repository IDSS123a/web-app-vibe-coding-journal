-- Migration: 002_sources_and_pipeline.sql
-- Purpose: Source Collector and Duplicate Engine support (Sprint 02)
-- Schema: sources table, articles.source_id FK, P-7 health monitoring
-- Never modify this migration after it has been applied.

-- Sources table (P-7: Source Health Monitoring)
CREATE TABLE IF NOT EXISTS public.sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('rss', 'api')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_polled TIMESTAMPTZ,
  last_success TIMESTAMPTZ,
  failure_count INTEGER NOT NULL DEFAULT 0 CHECK (failure_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add source_id to articles table (foreign key to sources)
ALTER TABLE public.articles
ADD COLUMN source_id UUID REFERENCES public.sources(id) ON DELETE SET NULL;

-- Index for query performance
CREATE INDEX IF NOT EXISTS idx_sources_enabled ON public.sources(enabled);
CREATE INDEX IF NOT EXISTS idx_sources_last_polled ON public.sources(last_polled);
CREATE INDEX IF NOT EXISTS idx_articles_source_id ON public.articles(source_id);

-- Row-level security
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read sources
CREATE POLICY "Authenticated users can read sources" ON public.sources
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admin-only: create/update/delete sources (placeholder, will expand when admin panel is built)
-- For now, require service_role for any modification
CREATE POLICY "Service role only for source mutations" ON public.sources
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role only for source updates" ON public.sources
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Service role only for source deletes" ON public.sources
  FOR DELETE USING (auth.role() = 'service_role');
