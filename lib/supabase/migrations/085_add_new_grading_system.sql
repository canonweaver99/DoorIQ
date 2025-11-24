-- Add new grading system columns and tables
-- This migration adds support for phased grading: instant metrics, key moments, and deep analysis

-- Add new columns to live_sessions table
ALTER TABLE live_sessions
ADD COLUMN IF NOT EXISTS instant_metrics JSONB,
ADD COLUMN IF NOT EXISTS key_moments JSONB,
ADD COLUMN IF NOT EXISTS moment_analysis JSONB,
ADD COLUMN IF NOT EXISTS elevenlabs_conversation_id TEXT,
ADD COLUMN IF NOT EXISTS elevenlabs_metrics JSONB,
ADD COLUMN IF NOT EXISTS grading_version TEXT DEFAULT '1.0';

-- Update grading_status CHECK constraint to include new statuses
-- First, drop the existing constraint if it exists
DO $$
BEGIN
  -- Drop the existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'live_sessions' 
    AND constraint_name LIKE '%grading_status%check%'
  ) THEN
    ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_grading_status_check;
  END IF;
  
  -- Add new constraint with expanded statuses
  ALTER TABLE live_sessions
  ADD CONSTRAINT live_sessions_grading_status_check 
  CHECK (grading_status IN ('pending', 'processing', 'instant_complete', 'moments_complete', 'complete', 'failed'));
END $$;

-- Create moment_patterns table for caching pattern matching results
CREATE TABLE IF NOT EXISTS moment_patterns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('objection', 'close_attempt', 'safety', 'discovery', 'rapport')),
  pattern_text TEXT NOT NULL,
  success_rate FLOAT,
  usage_count INTEGER DEFAULT 0,
  recommended_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_live_sessions_elevenlabs_conversation_id 
ON live_sessions(elevenlabs_conversation_id) 
WHERE elevenlabs_conversation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_live_sessions_grading_version 
ON live_sessions(grading_version) 
WHERE grading_version IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_moment_patterns_type 
ON moment_patterns(pattern_type);

CREATE INDEX IF NOT EXISTS idx_moment_patterns_usage_count 
ON moment_patterns(usage_count DESC);

-- Add comments for documentation
COMMENT ON COLUMN live_sessions.instant_metrics IS 'Pre-computed metrics available immediately (0-2s): wordsPerMinute, fillerWords, pauseFrequency, conversationBalance, objectionCount, closeAttempts, safetyMentions, estimatedScore';
COMMENT ON COLUMN live_sessions.key_moments IS 'Array of identified key moments from conversation: [{id, type, startIndex, endIndex, transcript, timestamp, importance, outcome, analysis}]';
COMMENT ON COLUMN live_sessions.moment_analysis IS 'AI analysis of key moments: quick feedback and moment-based insights';
COMMENT ON COLUMN live_sessions.elevenlabs_conversation_id IS 'ElevenLabs conversation ID for correlation';
COMMENT ON COLUMN live_sessions.elevenlabs_metrics IS 'Metrics from ElevenLabs: sentimentProgression, interruptionCount, audioQuality, etc.';
COMMENT ON COLUMN live_sessions.grading_version IS 'Version of grading system used (e.g., "1.0", "2.0")';

COMMENT ON TABLE moment_patterns IS 'Cached pattern matching results for faster instant analysis';

-- Update the grading_status trigger function to handle new statuses
CREATE OR REPLACE FUNCTION update_grading_status()
RETURNS TRIGGER AS $$
DECLARE
  line_ratings_count INTEGER;
  total_batches INTEGER;
  completed_batches INTEGER;
BEGIN
  -- Extract line_ratings from analytics JSONB
  line_ratings_count := jsonb_array_length(COALESCE(NEW.analytics->'line_ratings', '[]'::jsonb));
  total_batches := (NEW.analytics->>'line_ratings_total_batches')::INTEGER;
  completed_batches := (NEW.analytics->>'line_ratings_completed_batches')::INTEGER;
  
  -- Update grading_status based on new phased system
  -- Only auto-update if status hasn't been explicitly set to 'complete'
  -- If status is already 'complete', don't override it
  IF NEW.grading_status != 'complete' THEN
    -- If instant_metrics exists, mark as instant_complete
    IF NEW.instant_metrics IS NOT NULL AND NEW.grading_status = 'pending' THEN
      NEW.grading_status := 'instant_complete';
    END IF;
    
    -- If key_moments exists, mark as moments_complete
    IF NEW.key_moments IS NOT NULL AND NEW.grading_status IN ('pending', 'instant_complete') THEN
      NEW.grading_status := 'moments_complete';
    END IF;
  END IF;
  
  -- Check if deep analysis is complete (has deep_analysis in analytics)
  IF NEW.analytics->'deep_analysis' IS NOT NULL AND NEW.grading_status != 'complete' THEN
    NEW.grading_status := 'complete';
  END IF;
  
  -- Legacy line_ratings status handling (for backward compatibility)
  IF NEW.analytics->>'line_ratings_status' = 'queued' THEN
    NEW.grading_status := 'processing';
  ELSIF NEW.analytics->>'line_ratings_status' = 'completed' THEN
    NEW.grading_status := 'completed';
  ELSIF NEW.analytics->>'line_ratings_status' = 'failed' THEN
    NEW.grading_status := 'failed';
  ELSIF total_batches > 0 AND completed_batches >= total_batches THEN
    -- Auto-complete if all batches are done
    NEW.analytics := jsonb_set(
      NEW.analytics,
      '{line_ratings_status}',
      '"completed"'
    );
    NEW.grading_status := 'completed';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- RLS policies for moment_patterns table
ALTER TABLE moment_patterns ENABLE ROW LEVEL SECURITY;

-- Service role has full access (for backend operations)
CREATE POLICY "Service role full access moment_patterns" ON moment_patterns
  FOR ALL USING (auth.role() = 'service_role');

-- All authenticated users can read patterns (they're shared knowledge)
CREATE POLICY "Users can read moment_patterns" ON moment_patterns
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

