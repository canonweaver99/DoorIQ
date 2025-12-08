-- Restructure live_sessions table to match GPT grading output exactly
-- Migration: 121_restructure_live_sessions_for_gpt_output.sql
-- Date: 2025-01-XX
-- Purpose: Ensure all GPT grading outputs are properly stored in dedicated columns

-- ============================================
-- 1. Add missing columns that GPT outputs
-- ============================================

-- Core GPT outputs (if not exists)
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS overall_assessment TEXT;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS top_strengths TEXT[];
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS top_improvements TEXT[];
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS session_highlight TEXT;

-- Ensure all score columns exist
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS overall_score INTEGER;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS rapport_score INTEGER;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS discovery_score INTEGER;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS objection_handling_score INTEGER;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS close_score INTEGER;

-- Sale/Deal status (GPT outputs)
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS sale_closed BOOLEAN DEFAULT false;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS return_appointment BOOLEAN DEFAULT false;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS virtual_earnings DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS total_contract_value DECIMAL(10, 2);

-- JSONB columns for complex data (GPT outputs)
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS earnings_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS deal_details JSONB DEFAULT '{}'::jsonb;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS coaching_plan JSONB DEFAULT '{}'::jsonb;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS feedback_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS final_scores JSONB DEFAULT '{}'::jsonb;

-- Grading metadata
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS grading_status TEXT DEFAULT 'pending';
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS grading_version TEXT;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS graded_at TIMESTAMPTZ;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS grading_audit JSONB DEFAULT '{}'::jsonb;

-- ============================================
-- 2. Add constraints
-- ============================================

-- Score constraints (0-100)
ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_overall_score_check;
ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_overall_score_check 
  CHECK (overall_score IS NULL OR (overall_score >= 0 AND overall_score <= 100));

ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_rapport_score_check;
ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_rapport_score_check 
  CHECK (rapport_score IS NULL OR (rapport_score >= 0 AND rapport_score <= 100));

ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_discovery_score_check;
ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_discovery_score_check 
  CHECK (discovery_score IS NULL OR (discovery_score >= 0 AND discovery_score <= 100));

ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_objection_handling_score_check;
ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_objection_handling_score_check 
  CHECK (objection_handling_score IS NULL OR (objection_handling_score >= 0 AND objection_handling_score <= 100));

ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_close_score_check;
ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_close_score_check 
  CHECK (close_score IS NULL OR (close_score >= 0 AND close_score <= 100));

-- Grading status constraint
-- First, DROP the existing constraint if it exists (might be causing the error)
ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_grading_status_check;

-- Now fix any invalid grading_status values
UPDATE live_sessions
SET grading_status = CASE
  WHEN grading_status IS NULL THEN 'pending'
  WHEN grading_status = '' THEN 'pending'
  WHEN grading_status NOT IN ('pending', 'processing', 'complete', 'failed') THEN 
    CASE 
      WHEN overall_score IS NOT NULL THEN 'complete'
      ELSE 'pending'
    END
  ELSE grading_status
END
WHERE grading_status IS NULL 
   OR grading_status = ''
   OR grading_status NOT IN ('pending', 'processing', 'complete', 'failed');

-- Set default for NULL values
ALTER TABLE live_sessions ALTER COLUMN grading_status SET DEFAULT 'pending';

-- Now add the constraint back
ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_grading_status_check 
  CHECK (grading_status IN ('pending', 'processing', 'complete', 'failed'));

-- Virtual earnings constraint (must be >= 0)
ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_virtual_earnings_check;
ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_virtual_earnings_check 
  CHECK (virtual_earnings IS NULL OR virtual_earnings >= 0);

-- ============================================
-- 3. Add indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_live_sessions_sale_closed ON live_sessions(sale_closed) WHERE sale_closed = true;
CREATE INDEX IF NOT EXISTS idx_live_sessions_grading_status ON live_sessions(grading_status);
CREATE INDEX IF NOT EXISTS idx_live_sessions_graded_at ON live_sessions(graded_at DESC) WHERE graded_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_live_sessions_virtual_earnings ON live_sessions(virtual_earnings DESC) WHERE virtual_earnings > 0;
CREATE INDEX IF NOT EXISTS idx_live_sessions_overall_score ON live_sessions(overall_score DESC) WHERE overall_score IS NOT NULL;

-- ============================================
-- 4. Create function to sync GPT output to columns
-- ============================================

CREATE OR REPLACE FUNCTION sync_gpt_grading_to_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Extract GPT data from analytics JSONB and populate columns
  IF NEW.analytics IS NOT NULL AND NEW.analytics ? 'deep_analysis' THEN
    DECLARE
      deep_analysis JSONB := NEW.analytics->'deep_analysis';
      final_scores JSONB := COALESCE(deep_analysis->'finalScores', '{}'::jsonb);
    BEGIN
      -- Sync scores from finalScores
      IF final_scores ? 'overall' THEN
        NEW.overall_score := (final_scores->>'overall')::INTEGER;
      END IF;
      
      IF final_scores ? 'rapport' THEN
        NEW.rapport_score := (final_scores->>'rapport')::INTEGER;
      END IF;
      
      IF final_scores ? 'discovery' THEN
        NEW.discovery_score := (final_scores->>'discovery')::INTEGER;
      END IF;
      
      IF final_scores ? 'objectionHandling' THEN
        NEW.objection_handling_score := (final_scores->>'objectionHandling')::INTEGER;
      END IF;
      
      IF final_scores ? 'closing' THEN
        NEW.close_score := (final_scores->>'closing')::INTEGER;
      END IF;
      
      -- Sync sale status
      IF deep_analysis ? 'saleClosed' THEN
        NEW.sale_closed := (deep_analysis->>'saleClosed')::BOOLEAN;
      END IF;
      
      IF deep_analysis ? 'returnAppointment' THEN
        NEW.return_appointment := (deep_analysis->>'returnAppointment')::BOOLEAN;
      END IF;
      
      IF deep_analysis ? 'virtualEarnings' THEN
        NEW.virtual_earnings := (deep_analysis->>'virtualEarnings')::DECIMAL;
      END IF;
      
      -- Sync deal details
      IF deep_analysis ? 'dealDetails' THEN
        NEW.deal_details := deep_analysis->'dealDetails';
        IF deep_analysis->'dealDetails' ? 'total_contract_value' THEN
          NEW.total_contract_value := (deep_analysis->'dealDetails'->>'total_contract_value')::DECIMAL;
        END IF;
      END IF;
      
      -- Sync earnings data
      IF deep_analysis ? 'earningsData' THEN
        NEW.earnings_data := deep_analysis->'earningsData';
      END IF;
      
      -- Sync feedback
      IF deep_analysis ? 'feedback' THEN
        NEW.feedback_data := deep_analysis->'feedback';
        IF deep_analysis->'feedback' ? 'strengths' THEN
          NEW.top_strengths := ARRAY(SELECT jsonb_array_elements_text(deep_analysis->'feedback'->'strengths'));
        END IF;
        IF deep_analysis->'feedback' ? 'improvements' THEN
          NEW.top_improvements := ARRAY(SELECT jsonb_array_elements_text(deep_analysis->'feedback'->'improvements'));
        END IF;
      END IF;
      
      -- Sync coaching plan
      IF NEW.analytics ? 'coaching_plan' THEN
        NEW.coaching_plan := NEW.analytics->'coaching_plan';
      END IF;
      
      -- Sync other GPT outputs
      IF deep_analysis ? 'overallAssessment' THEN
        NEW.overall_assessment := deep_analysis->>'overallAssessment';
      END IF;
      
      IF deep_analysis ? 'sessionHighlight' THEN
        NEW.session_highlight := deep_analysis->>'sessionHighlight';
      END IF;
      
      -- Sync final_scores JSONB
      NEW.final_scores := final_scores;
      
      -- Sync grading audit
      IF NEW.analytics ? 'grading_audit' THEN
        NEW.grading_audit := NEW.analytics->'grading_audit';
      END IF;
      
      -- Sync grading metadata
      IF NEW.analytics ? 'graded_at' THEN
        NEW.graded_at := (NEW.analytics->>'graded_at')::TIMESTAMPTZ;
      END IF;
      
      IF NEW.analytics ? 'grading_version' THEN
        NEW.grading_version := NEW.analytics->>'grading_version';
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. Create trigger to auto-sync GPT data to columns
-- ============================================

DROP TRIGGER IF EXISTS trigger_sync_gpt_grading_to_columns ON live_sessions;
CREATE TRIGGER trigger_sync_gpt_grading_to_columns
  BEFORE INSERT OR UPDATE OF analytics ON live_sessions
  FOR EACH ROW
  EXECUTE FUNCTION sync_gpt_grading_to_columns();

-- ============================================
-- 6. Add comments documenting structure
-- ============================================

COMMENT ON COLUMN live_sessions.overall_assessment IS 'GPT output: One sentence summary of the conversation';
COMMENT ON COLUMN live_sessions.top_strengths IS 'GPT output: Array of top strengths observed';
COMMENT ON COLUMN live_sessions.top_improvements IS 'GPT output: Array of top areas for improvement';
COMMENT ON COLUMN live_sessions.session_highlight IS 'GPT output: One highlight with quote from conversation';
COMMENT ON COLUMN live_sessions.total_contract_value IS 'GPT output: Total value of the sale extracted from conversation';
COMMENT ON COLUMN live_sessions.final_scores IS 'GPT output: All scores as JSONB {overall, rapport, discovery, objectionHandling, closing}';
COMMENT ON COLUMN live_sessions.feedback_data IS 'GPT output: Feedback object {strengths, improvements, specific_tips}';
COMMENT ON COLUMN live_sessions.coaching_plan IS 'GPT output: Coaching plan {immediateFixes, rolePlayScenarios}';
COMMENT ON COLUMN live_sessions.grading_audit IS 'Audit trail of grading process: detection, adjustments, evidence';

-- ============================================
-- 7. Update existing sessions to sync data from analytics
-- ============================================

-- This will populate columns from existing analytics JSONB
UPDATE live_sessions
SET 
  overall_score = COALESCE(
    overall_score,
    (analytics->'deep_analysis'->'finalScores'->>'overall')::INTEGER
  ),
  rapport_score = COALESCE(
    rapport_score,
    (analytics->'deep_analysis'->'finalScores'->>'rapport')::INTEGER
  ),
  discovery_score = COALESCE(
    discovery_score,
    (analytics->'deep_analysis'->'finalScores'->>'discovery')::INTEGER
  ),
  objection_handling_score = COALESCE(
    objection_handling_score,
    (analytics->'deep_analysis'->'finalScores'->>'objectionHandling')::INTEGER
  ),
  close_score = COALESCE(
    close_score,
    (analytics->'deep_analysis'->'finalScores'->>'closing')::INTEGER
  ),
  sale_closed = COALESCE(
    sale_closed,
    (analytics->'deep_analysis'->>'saleClosed')::BOOLEAN
  ),
  virtual_earnings = COALESCE(
    virtual_earnings,
    (analytics->'deep_analysis'->>'virtualEarnings')::DECIMAL
  ),
  overall_assessment = COALESCE(
    overall_assessment,
    analytics->'deep_analysis'->>'overallAssessment'
  ),
  session_highlight = COALESCE(
    session_highlight,
    analytics->'deep_analysis'->>'sessionHighlight'
  )
WHERE analytics IS NOT NULL 
  AND analytics ? 'deep_analysis'
  AND analytics->'deep_analysis' IS NOT NULL;

-- ============================================
-- Migration Complete
-- ============================================
