-- Add is_coaching_script flag to knowledge_base table
-- Migration: 131_add_coaching_script_flag.sql
-- Date: 2025-01-XX
-- Purpose: Identify coaching scripts vs other knowledge documents

-- ============================================
-- 1. Add is_coaching_script column
-- ============================================

ALTER TABLE knowledge_base
ADD COLUMN IF NOT EXISTS is_coaching_script BOOLEAN DEFAULT false;

-- ============================================
-- 2. Add index for coaching script queries
-- ============================================

CREATE INDEX IF NOT EXISTS idx_knowledge_base_is_coaching_script 
ON knowledge_base(is_coaching_script)
WHERE is_coaching_script = true;

-- ============================================
-- 3. Add composite index for team coaching scripts
-- ============================================

-- Index for querying active coaching scripts by team (via metadata)
CREATE INDEX IF NOT EXISTS idx_knowledge_base_coaching_scripts_active 
ON knowledge_base(is_coaching_script, is_active)
WHERE is_coaching_script = true AND is_active = true;

-- ============================================
-- 4. Add comment
-- ============================================

COMMENT ON COLUMN knowledge_base.is_coaching_script IS 'Whether this document is a coaching script for real-time suggestions during practice sessions';

-- ============================================
-- Migration Complete
-- ============================================
