-- Add coach specialization columns to team_grading_configs
-- Migration: 135_add_coach_specialization.sql
-- Date: 2025-01-XX
-- Purpose: Store AI-generated specialization paragraphs for coach agent based on manager's knowledge base

-- ============================================
-- 1. Add coach_specialization column
-- ============================================

ALTER TABLE team_grading_configs
ADD COLUMN IF NOT EXISTS coach_specialization TEXT;

-- ============================================
-- 2. Add coach_specialization_updated_at column
-- ============================================

ALTER TABLE team_grading_configs
ADD COLUMN IF NOT EXISTS coach_specialization_updated_at TIMESTAMPTZ;

-- ============================================
-- 3. Add comment
-- ============================================

COMMENT ON COLUMN team_grading_configs.coach_specialization IS 'AI-generated specialization paragraphs summarizing team knowledge base content (company info, pricing, scripts) for coach agent';
COMMENT ON COLUMN team_grading_configs.coach_specialization_updated_at IS 'Timestamp when coach_specialization was last generated';

-- ============================================
-- Migration Complete
-- ============================================
