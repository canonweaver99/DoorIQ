-- Simplify scoring system to 4 main categories
-- 1. Rapport (introduction, trust building)
-- 2. Discovery (questions asked, listening skills)
-- 3. Objection Handling (answering questions, proposing solutions)
-- 4. Close (closing method, ability to sign on doorstep)

-- First, rename existing columns to match new system
ALTER TABLE live_sessions 
  RENAME COLUMN rapport_score TO rapport_score_old;

ALTER TABLE live_sessions
  RENAME COLUMN objection_handling_score TO objection_handling_score_old;

-- Add new simplified score columns if they don't exist
ALTER TABLE live_sessions
  ADD COLUMN IF NOT EXISTS rapport_score INTEGER CHECK (rapport_score >= 0 AND rapport_score <= 100),
  ADD COLUMN IF NOT EXISTS discovery_score INTEGER CHECK (discovery_score >= 0 AND discovery_score <= 100),
  ADD COLUMN IF NOT EXISTS objection_handling_score INTEGER CHECK (objection_handling_score >= 0 AND objection_handling_score <= 100),
  ADD COLUMN IF NOT EXISTS close_score INTEGER CHECK (close_score >= 0 AND close_score <= 100);

-- Copy data from old columns where applicable
UPDATE live_sessions 
SET 
  rapport_score = COALESCE(rapport_score_old, introduction_score),
  objection_handling_score = objection_handling_score_old,
  discovery_score = listening_score,  -- Discovery wasn't tracked before, use listening as proxy
  close_score = close_effectiveness_score;

-- Drop old scoring columns we no longer need
ALTER TABLE live_sessions
  DROP COLUMN IF EXISTS rapport_score_old,
  DROP COLUMN IF EXISTS objection_handling_score_old,
  DROP COLUMN IF EXISTS safety_score,
  DROP COLUMN IF EXISTS close_effectiveness_score,
  DROP COLUMN IF EXISTS introduction_score,
  DROP COLUMN IF EXISTS listening_score;

-- Update the overall score calculation to be average of 4 scores
-- This will be handled in the application logic, but add a trigger for consistency
CREATE OR REPLACE FUNCTION calculate_overall_score()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rapport_score IS NOT NULL 
     AND NEW.discovery_score IS NOT NULL 
     AND NEW.objection_handling_score IS NOT NULL 
     AND NEW.close_score IS NOT NULL THEN
    NEW.overall_score := ROUND((
      NEW.rapport_score + 
      NEW.discovery_score + 
      NEW.objection_handling_score + 
      NEW.close_score
    ) / 4.0);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate overall score
DROP TRIGGER IF EXISTS calculate_overall_score_trigger ON live_sessions;
CREATE TRIGGER calculate_overall_score_trigger
  BEFORE INSERT OR UPDATE ON live_sessions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_overall_score();

-- Add comments explaining the scoring system
COMMENT ON COLUMN live_sessions.rapport_score IS 'How well they introduced themselves and gained favor/trust (0-100)';
COMMENT ON COLUMN live_sessions.discovery_score IS 'Amount of questions asked and listening quality (0-100)';
COMMENT ON COLUMN live_sessions.objection_handling_score IS 'How well they answered questions and proposed solutions (0-100)';
COMMENT ON COLUMN live_sessions.close_score IS 'Closing method effectiveness and ability to sign on doorstep (0-100)';
COMMENT ON COLUMN live_sessions.overall_score IS 'Average of the 4 category scores (0-100)';
