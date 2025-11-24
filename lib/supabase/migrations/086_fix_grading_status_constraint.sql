-- Fix grading_status constraint to use 'complete' instead of 'completed'
-- This migration fixes the constraint violation error

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
  
  -- Add corrected constraint with 'complete' instead of 'completed'
  ALTER TABLE live_sessions
  ADD CONSTRAINT live_sessions_grading_status_check 
  CHECK (grading_status IN ('pending', 'processing', 'instant_complete', 'moments_complete', 'complete', 'failed'));
END $$;

