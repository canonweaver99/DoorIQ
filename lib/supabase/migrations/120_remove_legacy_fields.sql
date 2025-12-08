-- Remove legacy fields: safety_score, commission_rate, commission_earned, bonus_modifiers
-- Migration: 120_remove_legacy_fields.sql
-- Date: 2025-01-XX

-- ============================================
-- 1. Remove safety_score column from live_sessions
-- ============================================

-- Drop constraint first (if column exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'live_sessions' AND column_name = 'safety_score'
  ) THEN
    ALTER TABLE live_sessions DROP CONSTRAINT IF EXISTS live_sessions_safety_score_check;
    ALTER TABLE live_sessions DROP COLUMN safety_score;
  END IF;
END $$;

-- ============================================
-- 2. Update calculate_overall_score trigger function
-- Remove safety_score from calculation
-- ============================================

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
      
      -- Additional metrics (lower priority)
      -- safety_score removed - no longer tracked
      
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

-- Update comment
COMMENT ON FUNCTION calculate_overall_score() IS 'Calculates overall_score as average of core metrics. Only runs if overall_score is NULL, allowing API to provide OpenAI-generated scores. Safety score removed.';

-- ============================================
-- 3. Update earnings_data column comment
-- Remove commission_rate, commission_earned, bonus_modifiers
-- ============================================

COMMENT ON COLUMN live_sessions.earnings_data IS 'Detailed earnings breakdown: {
  base_amount: number,
  closed_amount: number (extracted from conversation),
  total_earned: number (matches virtual_earnings column)
}';

-- ============================================
-- 4. Update session_earnings_breakdown view
-- Remove commission_rate, commission_earned, bonus_modifiers columns
-- ============================================

DROP VIEW IF EXISTS session_earnings_breakdown;

CREATE OR REPLACE VIEW session_earnings_breakdown AS
SELECT 
  id as session_id,
  user_id,
  virtual_earnings as total_earned,
  (earnings_data->>'base_amount')::DECIMAL as base_amount,
  (earnings_data->>'closed_amount')::DECIMAL as deal_value,
  (earnings_data->>'total_earned')::DECIMAL as total_earned_from_data,
  deal_details->>'product_sold' as product_name,
  (deal_details->>'total_contract_value')::DECIMAL as contract_value,
  deal_details->>'service_type' as service_type,
  sale_closed,
  return_appointment,
  created_at,
  ended_at
FROM live_sessions
WHERE virtual_earnings > 0 OR sale_closed = true;

COMMENT ON VIEW session_earnings_breakdown IS 'Detailed view of session earnings. Commission and bonus fields removed.';

-- ============================================
-- 5. Clean up any existing earnings_data JSONB
-- Remove legacy fields from existing records (optional - can be done gradually)
-- ============================================

-- Note: This updates existing records to remove legacy fields
-- Run this if you want to clean up existing data immediately
-- Otherwise, the fields will just be ignored going forward

UPDATE live_sessions
SET earnings_data = earnings_data - 'commission_rate' - 'commission_earned' - 'bonus_modifiers'
WHERE earnings_data ? 'commission_rate' 
   OR earnings_data ? 'commission_earned' 
   OR earnings_data ? 'bonus_modifiers';

-- ============================================
-- 6. Update get_user_sessions function
-- Remove safety_score from return table and SELECT
-- ============================================

-- Drop the function first to allow changing return type
DROP FUNCTION IF EXISTS get_user_sessions(UUID, INTEGER);

-- Recreate without safety_score
CREATE FUNCTION get_user_sessions(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  id TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  user_id TEXT,
  agent_id TEXT,
  agent_name TEXT,
  duration_seconds INTEGER,
  overall_score INTEGER,
  rapport_score INTEGER,
  objection_handling_score INTEGER,
  close_effectiveness_score INTEGER,
  introduction_score INTEGER,
  listening_score INTEGER,
  virtual_earnings DECIMAL,
  full_transcript JSONB,
  analytics JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ls.id::TEXT,
    ls.started_at,
    ls.ended_at,
    ls.user_id::TEXT,
    ls.agent_id::TEXT,
    ls.agent_name,
    ls.duration_seconds,
    ls.overall_score,
    ls.rapport_score,
    ls.objection_handling_score,
    ls.close_effectiveness_score,
    ls.introduction_score,
    ls.listening_score,
    ls.virtual_earnings,
    ls.full_transcript,
    ls.analytics,
    ls.created_at
  FROM live_sessions ls
  WHERE ls.user_id = p_user_id
  ORDER BY ls.started_at DESC
  LIMIT p_limit;
END;
$$;

-- Re-grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_sessions(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_sessions(UUID, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_user_sessions(UUID, INTEGER) TO service_role;

COMMENT ON FUNCTION get_user_sessions IS 'Returns user sessions with UUIDs as TEXT to avoid corruption in Supabase JS SDK. Safety score removed.';

-- ============================================
-- Migration Complete
-- ============================================
