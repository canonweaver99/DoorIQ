-- Streamline live_sessions table - remove columns not needed for current grading system
-- This migration removes redundant columns since we now store detailed analysis in the analytics JSONB

-- Drop columns that duplicate information now stored in analytics JSONB
ALTER TABLE live_sessions
-- Remove individual reason columns (now in analytics.feedback)
DROP COLUMN IF EXISTS opening_introduction_reason,
DROP COLUMN IF EXISTS rapport_building_reason,
DROP COLUMN IF EXISTS needs_discovery_reason,
DROP COLUMN IF EXISTS value_communication_reason,
DROP COLUMN IF EXISTS objection_handling_reason,
DROP COLUMN IF EXISTS closing_reason,

-- Remove duplicate score columns (keeping main ones, removing variants)
DROP COLUMN IF EXISTS rapport_building_score, -- keeping rapport_score
DROP COLUMN IF EXISTS closing_score, -- keeping close_effectiveness_score
DROP COLUMN IF EXISTS value_communication_score, -- not in our 4 main categories

-- Remove detailed conversation metrics (AI calculates these now)
DROP COLUMN IF EXISTS total_turns,
DROP COLUMN IF EXISTS conversation_duration_seconds, -- we have duration_seconds
DROP COLUMN IF EXISTS questions_asked_by_homeowner,
DROP COLUMN IF EXISTS objections_raised,
DROP COLUMN IF EXISTS objections_resolved,
DROP COLUMN IF EXISTS homeowner_response_pattern,
DROP COLUMN IF EXISTS homeowner_first_words,
DROP COLUMN IF EXISTS homeowner_final_words,
DROP COLUMN IF EXISTS homeowner_key_questions,
DROP COLUMN IF EXISTS sales_rep_energy_level,
DROP COLUMN IF EXISTS close_attempted,
DROP COLUMN IF EXISTS closing_technique,
DROP COLUMN IF EXISTS sentiment_progression,
DROP COLUMN IF EXISTS time_to_value_seconds,
DROP COLUMN IF EXISTS interruptions_count,
DROP COLUMN IF EXISTS filler_words_count,
DROP COLUMN IF EXISTS conversation_summary,

-- Remove deduction columns (AI handles this holistically now)
DROP COLUMN IF EXISTS deductions_interruption_count,
DROP COLUMN IF EXISTS deductions_pricing_deflections,
DROP COLUMN IF EXISTS deductions_pressure_tactics,
DROP COLUMN IF EXISTS deductions_made_up_info,
DROP COLUMN IF EXISTS deductions_rude_or_dismissive,
DROP COLUMN IF EXISTS deductions_total,

-- Remove sale tracking columns (not core to training system)
DROP COLUMN IF EXISTS sale_amount,
DROP COLUMN IF EXISTS service_type,
DROP COLUMN IF EXISTS service_frequency,
DROP COLUMN IF EXISTS total_contract_value,
DROP COLUMN IF EXISTS commission_amount,
DROP COLUMN IF EXISTS revenue_category,

-- Remove legacy columns
DROP COLUMN IF EXISTS key_learnings, -- now in analytics.feedback.specific_tips
DROP COLUMN IF EXISTS grade_letter, -- can be calculated from overall_score
DROP COLUMN IF EXISTS pass, -- can be calculated from overall_score
DROP COLUMN IF EXISTS outcome, -- not needed
DROP COLUMN IF EXISTS device_info, -- not used
DROP COLUMN IF EXISTS conversation_metadata, -- not used
DROP COLUMN IF EXISTS agent_persona, -- not used
DROP COLUMN IF EXISTS conversation_id; -- not used

-- Columns we're KEEPING:
-- Core identification & timing:
--   id, created_at, started_at, ended_at, duration_seconds, user_id
-- Agent info:
--   agent_id, agent_name
-- Main scores (as requested):
--   overall_score, rapport_score, objection_handling_score, close_effectiveness_score, needs_discovery_score
-- Additional scores:
--   safety_score, introduction_score, listening_score
-- Results:
--   virtual_earnings, sale_closed
-- Feedback:
--   what_worked, what_failed
-- Core data:
--   full_transcript, analytics, audio_url

-- Add comment documenting the streamlined structure
COMMENT ON TABLE live_sessions IS 'Streamlined training sessions table. Core scores and transcript with detailed analysis in analytics JSONB';

-- Document what's in the analytics column
COMMENT ON COLUMN live_sessions.analytics IS 'Comprehensive session analysis: {
  line_ratings: [{ 
    line_number, 
    effectiveness: "excellent|good|average|poor",
    score: 0-100,
    alternative_lines: string[],
    improvement_notes: string,
    category: string
  }],
  feedback: { 
    strengths: string[], 
    improvements: string[], 
    specific_tips: string[] 
  },
  grading_version: string,
  graded_at: timestamp,
  // Plus any additional AI-generated insights
}';
