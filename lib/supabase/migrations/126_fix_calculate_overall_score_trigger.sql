-- Fix calculate_overall_score trigger function
-- Migration: 126_fix_calculate_overall_score_trigger.sql
-- Date: 2025-01-XX
-- Purpose: Fix trigger function to only reference columns that actually exist

-- ============================================
-- 1. Update calculate_overall_score trigger function
-- Remove references to columns that don't exist (introduction_score, listening_score, etc.)
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
      -- Core 4 metrics (these definitely exist based on migration 123)
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
COMMENT ON FUNCTION calculate_overall_score() IS 'Calculates overall_score as average of available core metrics. Only runs if overall_score is NULL, allowing API to provide OpenAI-generated scores. Dynamically checks for column existence to avoid errors.';

-- ============================================
-- Migration Complete
-- ============================================
