-- Relax score constraints to allow 0 values (SAFE VERSION)
-- OpenAI sometimes returns 0 for categories that don't apply
-- This version only modifies constraints for columns that actually exist

-- Drop existing constraints if they exist
DO $$ 
BEGIN
    -- Drop constraints only if columns exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'live_sessions' AND column_name = 'objection_handling_score') THEN
        ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_objection_handling_score_check;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'live_sessions' AND column_name = 'safety_score') THEN
        ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_safety_score_check;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'live_sessions' AND column_name = 'close_effectiveness_score') THEN
        ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_close_effectiveness_score_check;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'live_sessions' AND column_name = 'introduction_score') THEN
        ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_introduction_score_check;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'live_sessions' AND column_name = 'listening_score') THEN
        ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_listening_score_check;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'live_sessions' AND column_name = 'rapport_score') THEN
        ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_rapport_score_check;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'live_sessions' AND column_name = 'overall_score') THEN
        ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_overall_score_check;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'live_sessions' AND column_name = 'discovery_score') THEN
        ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_discovery_score_check;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'live_sessions' AND column_name = 'close_score') THEN
        ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_close_score_check;
    END IF;
END $$;

-- Add new constraints that allow 0-100 range (only for columns that exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'live_sessions' AND column_name = 'objection_handling_score') THEN
        ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_objection_handling_score_check 
          CHECK (objection_handling_score IS NULL OR (objection_handling_score >= 0 AND objection_handling_score <= 100));
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'live_sessions' AND column_name = 'safety_score') THEN
        ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_safety_score_check 
          CHECK (safety_score IS NULL OR (safety_score >= 0 AND safety_score <= 100));
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'live_sessions' AND column_name = 'close_effectiveness_score') THEN
        ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_close_effectiveness_score_check 
          CHECK (close_effectiveness_score IS NULL OR (close_effectiveness_score >= 0 AND close_effectiveness_score <= 100));
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'live_sessions' AND column_name = 'introduction_score') THEN
        ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_introduction_score_check 
          CHECK (introduction_score IS NULL OR (introduction_score >= 0 AND introduction_score <= 100));
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'live_sessions' AND column_name = 'listening_score') THEN
        ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_listening_score_check 
          CHECK (listening_score IS NULL OR (listening_score >= 0 AND listening_score <= 100));
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'live_sessions' AND column_name = 'rapport_score') THEN
        ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_rapport_score_check 
          CHECK (rapport_score IS NULL OR (rapport_score >= 0 AND rapport_score <= 100));
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'live_sessions' AND column_name = 'overall_score') THEN
        ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_overall_score_check 
          CHECK (overall_score IS NULL OR (overall_score >= 0 AND overall_score <= 100));
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'live_sessions' AND column_name = 'discovery_score') THEN
        ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_discovery_score_check 
          CHECK (discovery_score IS NULL OR (discovery_score >= 0 AND discovery_score <= 100));
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'live_sessions' AND column_name = 'close_score') THEN
        ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_close_score_check 
          CHECK (close_score IS NULL OR (close_score >= 0 AND close_score <= 100));
    END IF;
END $$;

