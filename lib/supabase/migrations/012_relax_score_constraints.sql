-- Relax score constraints to allow 0 values
-- OpenAI sometimes returns 0 for categories that don't apply

-- Drop existing constraints
ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_objection_handling_score_check;
ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_safety_score_check;
ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_close_effectiveness_score_check;
ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_introduction_score_check;
ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_listening_score_check;
ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_rapport_score_check;
ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_overall_score_check;

-- Add new constraints that allow 0-100 range
ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_objection_handling_score_check 
  CHECK (objection_handling_score IS NULL OR (objection_handling_score >= 0 AND objection_handling_score <= 100));

ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_safety_score_check 
  CHECK (safety_score IS NULL OR (safety_score >= 0 AND safety_score <= 100));

ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_close_effectiveness_score_check 
  CHECK (close_effectiveness_score IS NULL OR (close_effectiveness_score >= 0 AND close_effectiveness_score <= 100));

ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_introduction_score_check 
  CHECK (introduction_score IS NULL OR (introduction_score >= 0 AND introduction_score <= 100));

ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_listening_score_check 
  CHECK (listening_score IS NULL OR (listening_score >= 0 AND listening_score <= 100));

ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_rapport_score_check 
  CHECK (rapport_score IS NULL OR (rapport_score >= 0 AND rapport_score <= 100));

ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_overall_score_check 
  CHECK (overall_score IS NULL OR (overall_score >= 0 AND overall_score <= 100));

COMMENT ON CONSTRAINT live_sessions_objection_handling_score_check ON live_sessions IS 'Allows 0-100 score range or NULL';
