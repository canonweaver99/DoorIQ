-- Fix the overall score trigger to respect provided values
-- This allows the grading API to set the overall score from OpenAI
-- instead of having it auto-calculated from individual metrics

-- Drop the old trigger
DROP TRIGGER IF EXISTS calculate_overall_score_trigger ON live_sessions;

-- Update the function to only calculate if overall_score is NULL
-- This allows the API to provide OpenAI's overall score while still
-- having auto-calculation for backward compatibility
CREATE OR REPLACE FUNCTION calculate_overall_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Only calculate if overall_score is not explicitly provided (NULL)
  IF NEW.overall_score IS NULL THEN
    DECLARE
      score_count INTEGER := 0;
      score_sum INTEGER := 0;
    BEGIN
      -- Core 4 metrics (highest priority)
      IF NEW.rapport_score IS NOT NULL THEN
        score_sum := score_sum + NEW.rapport_score;
        score_count := score_count + 1;
      END IF;
      
      IF NEW.discovery_score IS NOT NULL THEN
        score_sum := score_sum + NEW.discovery_score;
        score_count := score_count + 1;
      END IF;
      
      IF NEW.objection_handling_score IS NOT NULL THEN
        score_sum := score_sum + NEW.objection_handling_score;
        score_count := score_count + 1;
      END IF;
      
      IF NEW.close_score IS NOT NULL THEN
        score_sum := score_sum + NEW.close_score;
        score_count := score_count + 1;
      END IF;
      
      -- Additional metrics (lower priority, excluding filler_words and question_ratio)
      IF NEW.safety_score IS NOT NULL THEN
        score_sum := score_sum + NEW.safety_score;
        score_count := score_count + 1;
      END IF;
      
      IF NEW.introduction_score IS NOT NULL THEN
        score_sum := score_sum + NEW.introduction_score;
        score_count := score_count + 1;
      END IF;
      
      IF NEW.listening_score IS NOT NULL THEN
        score_sum := score_sum + NEW.listening_score;
        score_count := score_count + 1;
      END IF;
      
      IF NEW.speaking_pace_score IS NOT NULL THEN
        score_sum := score_sum + NEW.speaking_pace_score;
        score_count := score_count + 1;
      END IF;
      
      IF NEW.active_listening_score IS NOT NULL THEN
        score_sum := score_sum + NEW.active_listening_score;
        score_count := score_count + 1;
      END IF;
      
      IF NEW.assumptive_language_score IS NOT NULL THEN
        score_sum := score_sum + NEW.assumptive_language_score;
        score_count := score_count + 1;
      END IF;
      
      -- Calculate average if we have any scores
      IF score_count > 0 THEN
        NEW.overall_score := ROUND(score_sum::NUMERIC / score_count);
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-create the trigger
CREATE TRIGGER calculate_overall_score_trigger
  BEFORE INSERT OR UPDATE ON live_sessions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_overall_score();

-- Add comment explaining the behavior
COMMENT ON FUNCTION calculate_overall_score() IS 'Calculates overall_score as average of core metrics (excluding filler_words and question_ratio). Only runs if overall_score is NULL, allowing API to provide OpenAI-generated scores.';

