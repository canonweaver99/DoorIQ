-- Remove unused columns from live_sessions table
-- Migration: 122_remove_unused_live_sessions_columns.sql
-- Date: 2025-01-XX
-- Purpose: Clean up unused legacy columns that are not being used in the codebase

-- ============================================
-- 1. Remove legacy score columns that are not used
-- ============================================

-- These are replaced by the core 5 scores (overall, rapport, discovery, objection_handling, close)
-- NOTE: Keeping close_effectiveness_score, introduction_score, listening_score as they're still used in some routes
-- ALTER TABLE live_sessions DROP COLUMN IF EXISTS close_effectiveness_score; -- Still used in team analytics
-- ALTER TABLE live_sessions DROP COLUMN IF EXISTS introduction_score; -- Still used in dashboard
-- ALTER TABLE live_sessions DROP COLUMN IF EXISTS listening_score; -- Still used in team rep routes
ALTER TABLE live_sessions DROP COLUMN IF EXISTS needs_discovery_score;
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
-- 7. Remove GPT output columns that are duplicated in analytics JSONB
-- ============================================
-- These columns were added in migration 121 but are not used in the grading/feedback pages
-- All data is accessed via analytics JSONB instead

-- Feedback columns (now in analytics.feedback)
ALTER TABLE live_sessions DROP COLUMN IF EXISTS top_strengths; -- Replaced by analytics.feedback.strengths
ALTER TABLE live_sessions DROP COLUMN IF EXISTS top_improvements; -- Replaced by analytics.feedback.improvements
ALTER TABLE live_sessions DROP COLUMN IF EXISTS overall_assessment; -- Replaced by analytics.deep_analysis.overallAssessment
ALTER TABLE live_sessions DROP COLUMN IF EXISTS session_highlight; -- Replaced by analytics.session_highlight

-- JSONB columns that duplicate analytics data
ALTER TABLE live_sessions DROP COLUMN IF EXISTS feedback_data; -- Replaced by analytics.feedback
ALTER TABLE live_sessions DROP COLUMN IF EXISTS final_scores; -- Replaced by analytics.deep_analysis.finalScores
ALTER TABLE live_sessions DROP COLUMN IF EXISTS coaching_plan; -- Replaced by analytics.coaching_plan
ALTER TABLE live_sessions DROP COLUMN IF EXISTS grading_audit; -- Replaced by analytics.grading_audit

-- Deal value (now in deal_details.total_contract_value)
ALTER TABLE live_sessions DROP COLUMN IF EXISTS total_contract_value; -- Replaced by deal_details.total_contract_value

-- Audio metadata columns (not displayed in grading/feedback pages)
ALTER TABLE live_sessions DROP COLUMN IF EXISTS audio_duration; -- Not displayed in feedback
ALTER TABLE live_sessions DROP COLUMN IF EXISTS audio_file_size; -- Not displayed in feedback
ALTER TABLE live_sessions DROP COLUMN IF EXISTS has_video; -- Not displayed in feedback

-- User feedback columns (mostly NULL, not used in grading display)
ALTER TABLE live_sessions DROP COLUMN IF EXISTS user_feedback_rating; -- Not displayed in grading page
ALTER TABLE live_sessions DROP COLUMN IF EXISTS user_feedback_improvement_area; -- Not displayed in grading page
ALTER TABLE live_sessions DROP COLUMN IF EXISTS user_feedback_text; -- Not displayed in grading page

-- Grading version (mostly 0 or NULL, not displayed)
ALTER TABLE live_sessions DROP COLUMN IF EXISTS grading_version; -- Not displayed in feedback pages

-- Coaching suggestions (not used)
ALTER TABLE live_sessions DROP COLUMN IF EXISTS coaching_suggestions; -- Not used

-- Legacy columns that might still exist
ALTER TABLE live_sessions DROP COLUMN IF EXISTS gradir; -- Typo/legacy column
ALTER TABLE live_sessions DROP COLUMN IF EXISTS uuid; -- Duplicate of id

-- NOTE: Keeping these columns as they are used in the codebase:
-- - elevenlabs_conversation_id: Used in grading orchestration
-- - is_free_demo: Used in business logic for demo sessions
-- - homeowner_name: Displayed in feedback modal

-- ============================================
-- 8. Update table comment to reflect cleaned structure
-- ============================================

COMMENT ON TABLE live_sessions IS 'Core training sessions table. All GPT grading outputs stored in analytics JSONB. Core scores and sale data in dedicated columns for easy querying.';

-- ============================================
-- Migration Complete
-- ============================================
