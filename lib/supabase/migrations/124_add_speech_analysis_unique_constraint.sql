-- Add unique constraint on session_id to speech_analysis table
-- Migration: 124_add_speech_analysis_unique_constraint.sql
-- Date: 2025-01-XX
-- Purpose: Allow upsert operations on speech_analysis table using session_id

-- First, remove any duplicate records (keep the most recent one per session)
DELETE FROM speech_analysis a
USING speech_analysis b
WHERE a.id < b.id
  AND a.session_id = b.session_id;

-- Add unique constraint on session_id
-- This allows one record per session (can be updated via upsert)
ALTER TABLE speech_analysis
ADD CONSTRAINT speech_analysis_session_id_unique UNIQUE (session_id);

-- Add comment
COMMENT ON CONSTRAINT speech_analysis_session_id_unique ON speech_analysis IS 
'Ensures one speech_analysis record per session, allowing upsert operations';
