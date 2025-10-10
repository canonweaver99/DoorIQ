-- Complete score columns setup for live_sessions
-- Adds any missing score columns and sets up proper constraints

-- 1) Add all score columns if they don't exist
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS overall_score INTEGER;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS rapport_score INTEGER;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS discovery_score INTEGER;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS objection_handling_score INTEGER;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS close_score INTEGER;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS close_effectiveness_score INTEGER;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS safety_score INTEGER;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS introduction_score INTEGER;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS listening_score INTEGER;

-- Enhanced metric scores
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS speaking_pace_score INTEGER;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS filler_words_score INTEGER;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS question_ratio_score INTEGER;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS active_listening_score INTEGER;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS assumptive_language_score INTEGER;

-- Enhanced metric data
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS speaking_pace_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS filler_words_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS question_ratio_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS active_listening_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS assumptive_language_data JSONB DEFAULT '{}'::jsonb;

-- 2) Drop all existing score constraints
DO $$ 
BEGIN
    ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_overall_score_check;
    ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_rapport_score_check;
    ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_discovery_score_check;
    ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_objection_handling_score_check;
    ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_close_score_check;
    ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_close_effectiveness_score_check;
    ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_safety_score_check;
    ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_introduction_score_check;
    ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_listening_score_check;
    ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_speaking_pace_score_check;
    ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_filler_words_score_check;
    ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_question_ratio_score_check;
    ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_active_listening_score_check;
    ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_assumptive_language_score_check;
END $$;

-- 3) Add new constraints that allow 0-100 range for all score columns
ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_overall_score_check 
  CHECK (overall_score IS NULL OR (overall_score >= 0 AND overall_score <= 100));

ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_rapport_score_check 
  CHECK (rapport_score IS NULL OR (rapport_score >= 0 AND rapport_score <= 100));

ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_discovery_score_check 
  CHECK (discovery_score IS NULL OR (discovery_score >= 0 AND discovery_score <= 100));

ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_objection_handling_score_check 
  CHECK (objection_handling_score IS NULL OR (objection_handling_score >= 0 AND objection_handling_score <= 100));

ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_close_score_check 
  CHECK (close_score IS NULL OR (close_score >= 0 AND close_score <= 100));

ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_close_effectiveness_score_check 
  CHECK (close_effectiveness_score IS NULL OR (close_effectiveness_score >= 0 AND close_effectiveness_score <= 100));

ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_safety_score_check 
  CHECK (safety_score IS NULL OR (safety_score >= 0 AND safety_score <= 100));

ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_introduction_score_check 
  CHECK (introduction_score IS NULL OR (introduction_score >= 0 AND introduction_score <= 100));

ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_listening_score_check 
  CHECK (listening_score IS NULL OR (listening_score >= 0 AND listening_score <= 100));

-- Enhanced metric constraints
ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_speaking_pace_score_check 
  CHECK (speaking_pace_score IS NULL OR (speaking_pace_score >= 0 AND speaking_pace_score <= 100));

ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_filler_words_score_check 
  CHECK (filler_words_score IS NULL OR (filler_words_score >= 0 AND filler_words_score <= 100));

ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_question_ratio_score_check 
  CHECK (question_ratio_score IS NULL OR (question_ratio_score >= 0 AND question_ratio_score <= 100));

ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_active_listening_score_check 
  CHECK (active_listening_score IS NULL OR (active_listening_score >= 0 AND active_listening_score <= 100));

ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_assumptive_language_score_check 
  CHECK (assumptive_language_score IS NULL OR (assumptive_language_score >= 0 AND assumptive_language_score <= 100));

-- 4) Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_live_sessions_overall_score ON live_sessions(overall_score);
CREATE INDEX IF NOT EXISTS idx_live_sessions_enhanced_scores ON live_sessions(
  speaking_pace_score,
  filler_words_score,
  question_ratio_score,
  active_listening_score,
  assumptive_language_score
);

-- 5) Add helpful comments
COMMENT ON COLUMN live_sessions.overall_score IS 'Overall performance score (0-100)';
COMMENT ON COLUMN live_sessions.rapport_score IS 'Rapport building score (0-100)';
COMMENT ON COLUMN live_sessions.discovery_score IS 'Discovery/needs analysis score (0-100)';
COMMENT ON COLUMN live_sessions.objection_handling_score IS 'Objection handling effectiveness (0-100)';
COMMENT ON COLUMN live_sessions.close_score IS 'Closing technique score (0-100)';
COMMENT ON COLUMN live_sessions.safety_score IS 'Safety discussion score (0-100)';
COMMENT ON COLUMN live_sessions.introduction_score IS 'Introduction quality score (0-100)';
COMMENT ON COLUMN live_sessions.listening_score IS 'Active listening score (0-100)';

COMMENT ON COLUMN live_sessions.speaking_pace_score IS 'Speaking pace score (0-100). Optimal: 140-160 WPM';
COMMENT ON COLUMN live_sessions.filler_words_score IS 'Filler words score (0-100). Lower density = higher score';
COMMENT ON COLUMN live_sessions.question_ratio_score IS 'Question ratio score (0-100). Target: 30-40% questions';
COMMENT ON COLUMN live_sessions.active_listening_score IS 'Active listening indicators score (0-100)';
COMMENT ON COLUMN live_sessions.assumptive_language_score IS 'Assumptive language usage score (0-100)';

