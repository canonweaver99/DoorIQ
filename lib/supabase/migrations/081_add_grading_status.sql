-- Add grading_status field to live_sessions table
-- This tracks the status of line-by-line grading

-- Add grading_status column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'live_sessions' 
    AND column_name = 'grading_status'
  ) THEN
    ALTER TABLE live_sessions
    ADD COLUMN grading_status TEXT DEFAULT 'pending'
    CHECK (grading_status IN ('pending', 'processing', 'completed', 'failed'));
    
    COMMENT ON COLUMN live_sessions.grading_status IS 'Status of line-by-line grading: pending, processing, completed, failed';
  END IF;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_live_sessions_grading_status 
ON live_sessions(grading_status) 
WHERE grading_status IN ('pending', 'processing');

-- Function to update grading status when line_ratings are updated
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
  
  -- Update grading_status based on line_ratings
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

-- Create trigger to auto-update grading_status
DROP TRIGGER IF EXISTS trigger_update_grading_status ON live_sessions;
CREATE TRIGGER trigger_update_grading_status
  BEFORE UPDATE ON live_sessions
  FOR EACH ROW
  WHEN (
    OLD.analytics IS DISTINCT FROM NEW.analytics
    OR OLD.grading_status IS DISTINCT FROM NEW.grading_status
  )
  EXECUTE FUNCTION update_grading_status();

-- Update existing sessions to have default status
-- Check if session has been graded by looking at overall_score
-- (graded_at is stored in analytics JSONB, not as a column)
UPDATE live_sessions
SET grading_status = CASE
  WHEN overall_score IS NOT NULL THEN 'completed'
  ELSE 'pending'
END
WHERE grading_status IS NULL;

