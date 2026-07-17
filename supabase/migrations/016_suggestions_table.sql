-- Migration 016: Community knowledge suggestions table
-- Applied directly via the Supabase SQL Editor by Mahil (2026-07-17). This file is the RECORD of that
-- DDL. VERIFIED against the live schema in Session 16: columns, all 5 CHECK constraints
-- (type/title/description/status) and both RLS policies below match production exactly.
--
-- Players suggest books/topics/teachers/traditions for new questions. This is how the question bank
-- grows beyond 118. Writes go through /api/suggest (service_role, validated + rate-limited); anon can
-- also INSERT directly via PostgREST, bounded only by the title CHECK in the "Public can submit" policy.

CREATE TABLE IF NOT EXISTS public.am_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name TEXT DEFAULT 'Anonymous',
  type TEXT NOT NULL CHECK (type IN ('book','topic','teacher','tradition','other')),
  title TEXT NOT NULL CHECK (length(title) >= 4 AND length(title) <= 200),
  description TEXT CHECK (length(description) <= 500),
  realm_name TEXT,
  upvotes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','reviewed','implemented')),
  submitted_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.am_suggestions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.am_suggestions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.am_suggestions TO service_role;
GRANT USAGE ON SCHEMA public TO anon;

CREATE POLICY "Public can read" ON am_suggestions FOR SELECT TO anon USING (true);
CREATE POLICY "Public can submit" ON am_suggestions FOR INSERT TO anon
  WITH CHECK (length(title) >= 4 AND length(title) <= 200);
