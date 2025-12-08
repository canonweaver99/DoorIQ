-- Remove unused columns from live_sessions table
-- Migration: 122_remove_unused_live_sessions_columns.sql
-- Date: 2025-01-XX
-- Purpose: Clean up unused legacy columns that are not being used in the codebase

-- ============================================
-- 1. Remove legacy score columns that are not used
-- ============================================

-- These are replaced by the core 5 scores (overall, rapport, discovery, objection_handling, close)
ALTER TABLE live_sessions DROP COLUMN IF EXISTS close_effectiveness_score;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS needs_discovery_score;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS introduction_score;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS listening_score;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS speaking_pace_score;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS filler_words_score;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS question_ratio_score;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS active_listening_score;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS assumptive_language_score;

-- Remove legacy score data columns
ALTER TABLE live_sessions DROP COLUMN IF EXISTS speaking_pace_data;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS filler_words_data;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS question_ratio_data;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS active_listening_data;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS assumptive_language_data;

-- ============================================
-- 2. Remove legacy feedback columns (now in feedback_data JSONB)
-- ============================================

ALTER TABLE live_sessions DROP COLUMN IF EXISTS what_worked;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS what_failed;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS key_learnings;

-- ============================================
-- 3. Remove legacy conversation metadata columns
-- ============================================

ALTER TABLE live_sessions DROP COLUMN IF EXISTS agent_persona;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS conversation_id;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS total_turns;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS conversation_duration_seconds;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS questions_asked_by_homeowner;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS objections_raised;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS objections_resolved;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS homeowner_response_pattern;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS homeowner_first_words;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS homeowner_final_words;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS homeowner_key_questions;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS sales_rep_energy_level;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS close_attempted;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS closing_technique;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS sentiment_progression;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS time_to_value_seconds;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS interruptions_count;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS filler_words_count;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS conversation_summary;

-- ============================================
-- 4. Remove legacy score/reason columns (if they still exist)
-- ============================================

ALTER TABLE live_sessions DROP COLUMN IF EXISTS opening_introduction_score;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS opening_introduction_reason;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS rapport_building_score;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS rapport_building_reason;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS needs_discovery_reason;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS value_communication_score;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS value_communication_reason;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS objection_handling_reason;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS closing_reason;

-- ============================================
-- 5. Remove legacy deduction columns (if they still exist)
-- ============================================

ALTER TABLE live_sessions DROP COLUMN IF EXISTS deductions_interruption_count;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS deductions_interruption_penalty;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS deductions_excessive_pressure_penalty;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS deductions_weak_rapport_penalty;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS deductions_unprofessional_language_penalty;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS deductions_pricing_deflections;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS deductions_pressure_tactics;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS deductions_made_up_info;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS deductions_rude_or_dismissive;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS deductions_total;

-- ============================================
-- 6. Remove other legacy columns (if they still exist)
-- ============================================

ALTER TABLE live_sessions DROP COLUMN IF EXISTS score_feedback;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS sentiment_data;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS transcript; -- We use full_transcript
ALTER TABLE live_sessions DROP COLUMN IF EXISTS analyzed_transcript;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS sale_amount;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS service_type;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS service_frequency;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS commission_amount;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS revenue_category;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS grade_letter;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS pass;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS outcome;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS device_info;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS conversation_metadata;
ALTER TABLE live_sessions DROP COLUMN IF EXISTS user_feedback_submitted_at; -- Check if this is used

-- ============================================
-- 7. Update table comment to reflect cleaned structure
-- ============================================

COMMENT ON TABLE live_sessions IS 'Core training sessions table. All GPT grading outputs stored in dedicated columns. Detailed analysis in analytics JSONB.';

-- ============================================
-- Migration Complete
-- ============================================
