-- Migration: Optimize schema for live transcript and enhanced feedback
-- Run this to update your existing database

-- Add new columns to training_sessions if they don't exist
ALTER TABLE training_sessions 
ADD COLUMN IF NOT EXISTS introduction_score INTEGER CHECK (introduction_score >= 0 AND introduction_score <= 100),
ADD COLUMN IF NOT EXISTS listening_score INTEGER CHECK (listening_score >= 0 AND listening_score <= 100),
ADD COLUMN IF NOT EXISTS analyzed_transcript JSONB DEFAULT '[]'::JSONB;

-- Drop unused tables (in reverse order of dependencies)
DROP TABLE IF EXISTS user_challenge_progress CASCADE;
DROP TABLE IF EXISTS daily_challenges CASCADE;
DROP TABLE IF EXISTS session_events CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

-- Remove team_id from users table since teams table is being dropped
-- First drop any policies that reference users.team_id (from old schema)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Managers can view team sessions' 
      AND tablename = 'training_sessions'
  ) THEN
    DROP POLICY "Managers can view team sessions" ON training_sessions;
  END IF;
END $$;

ALTER TABLE users DROP COLUMN IF EXISTS team_id;

-- Add more coaching tips for the enhanced sections
INSERT INTO coaching_tips (category, tip, order_index) VALUES
  ('discovery', 'Ask open-ended questions about their pest concerns', 11),
  ('discovery', 'Listen actively and take mental notes of their priorities', 12),
  ('presentation', 'Focus on benefits, not just features', 13),
  ('presentation', 'Use stories and examples from the neighborhood', 14)
ON CONFLICT DO NOTHING;

-- Create missing indexes
CREATE INDEX IF NOT EXISTS idx_coaching_tips_category ON coaching_tips(category);

-- Ensure achievements has a unique constraint for ON CONFLICT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'achievements_name_key'
  ) THEN
    BEGIN
      ALTER TABLE achievements ADD CONSTRAINT achievements_name_key UNIQUE (name);
    EXCEPTION WHEN duplicate_table THEN
      -- ignore
    END;
  END IF;
END $$;

-- Add policies for anonymous testing (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'training_sessions' 
    AND policyname = 'Allow anonymous session creation'
  ) THEN
    CREATE POLICY "Allow anonymous session creation" ON training_sessions
      FOR INSERT WITH CHECK (user_id IS NULL);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'training_sessions' 
    AND policyname = 'Allow anonymous session updates'
  ) THEN
    CREATE POLICY "Allow anonymous session updates" ON training_sessions
      FOR UPDATE USING (user_id IS NULL);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'training_sessions' 
    AND policyname = 'Allow anonymous session reads'
  ) THEN
    CREATE POLICY "Allow anonymous session reads" ON training_sessions
      FOR SELECT USING (user_id IS NULL);
  END IF;
END $$;
