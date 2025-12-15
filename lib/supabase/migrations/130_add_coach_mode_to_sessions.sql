-- Add coach mode columns to live_sessions table
-- Migration: 130_add_coach_mode_to_sessions.sql
-- Date: 2025-01-XX
-- Purpose: Add coach mode tracking and coaching suggestions storage

-- ============================================
-- 1. Add coach_mode_enabled column
-- ============================================

ALTER TABLE live_sessions
ADD COLUMN IF NOT EXISTS coach_mode_enabled BOOLEAN DEFAULT false;

-- ============================================
-- 2. Add coaching_suggestions JSONB column
-- ============================================

ALTER TABLE live_sessions
ADD COLUMN IF NOT EXISTS coaching_suggestions JSONB DEFAULT '[]'::jsonb;

-- ============================================
-- 3. Add index for coach_mode_enabled queries
-- ============================================

CREATE INDEX IF NOT EXISTS idx_live_sessions_coach_mode_enabled 
ON live_sessions(coach_mode_enabled)
WHERE coach_mode_enabled = true;

-- ============================================
-- 4. Add GIN index for coaching_suggestions queries
-- ============================================

CREATE INDEX IF NOT EXISTS idx_live_sessions_coaching_suggestions 
ON live_sessions USING GIN (coaching_suggestions jsonb_path_ops)
WHERE coaching_suggestions IS NOT NULL;

-- ============================================
-- 5. Add comments
-- ============================================

COMMENT ON COLUMN live_sessions.coach_mode_enabled IS 'Whether coach mode was enabled during this session';
COMMENT ON COLUMN live_sessions.coaching_suggestions IS 'Array of coaching suggestions generated during session. Structure: [{timestamp, homeowner_text, suggested_line, context, script_section}]';

-- ============================================
-- Migration Complete
-- ============================================
