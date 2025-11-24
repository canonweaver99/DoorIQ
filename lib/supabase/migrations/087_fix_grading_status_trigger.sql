-- Fix grading_status trigger to respect explicit 'complete' status
-- The trigger was overriding explicit status updates

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
  -- Only apply if status is not already 'complete'
  IF NEW.grading_status != 'complete' THEN
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
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
