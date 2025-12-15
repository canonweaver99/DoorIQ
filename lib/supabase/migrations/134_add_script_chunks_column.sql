-- Add chunks JSONB column to knowledge_base table for caching script chunks
-- Migration: 134_add_script_chunks_column.sql
-- Date: 2025-01-XX
-- Purpose: Cache pre-processed script chunks for faster RAG retrieval

-- ============================================
-- 1. Add chunks JSONB column
-- ============================================

ALTER TABLE knowledge_base
ADD COLUMN IF NOT EXISTS chunks JSONB DEFAULT NULL;

-- ============================================
-- 2. Add GIN index for efficient JSONB queries
-- ============================================

CREATE INDEX IF NOT EXISTS idx_knowledge_base_chunks_gin 
ON knowledge_base USING GIN (chunks)
WHERE chunks IS NOT NULL;

-- ============================================
-- 3. Add comment
-- ============================================

COMMENT ON COLUMN knowledge_base.chunks IS 'Pre-processed script chunks with keywords for faster RAG retrieval. Format: [{"text": "...", "keywords": [...], "startIndex": 0, "endIndex": 300}]';

-- ============================================
-- Migration Complete
-- ============================================

