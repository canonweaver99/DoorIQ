-- Streamline live_sessions table by removing duplicate/unnecessary columns
-- This will significantly reduce the JSON payload size for OpenAI grading

-- First, ensure analytics column can store all the data we're moving
ALTER TABLE live_sessions 
ALTER COLUMN analytics SET DEFAULT '{}'::jsonb;

-- Drop duplicate score/reason columns (these are now in analytics.feedback)
ALTER TABLE live_sessions 
DROP COLUMN IF EXISTS opening_introduction_score,
DROP COLUMN IF EXISTS opening_introduction_reason,
DROP COLUMN IF EXISTS rapport_building_score,
DROP COLUMN IF EXISTS rapport_building_reason,
DROP COLUMN IF EXISTS needs_discovery_score,
DROP COLUMN IF EXISTS needs_discovery_reason,
DROP COLUMN IF EXISTS value_communication_score,
DROP COLUMN IF EXISTS value_communication_reason,
DROP COLUMN IF EXISTS objection_handling_reason,
DROP COLUMN IF EXISTS closing_score,
DROP COLUMN IF EXISTS closing_reason;

-- Drop conversation metadata that's never used or can be calculated
ALTER TABLE live_sessions
DROP COLUMN IF EXISTS conversation_id,
DROP COLUMN IF EXISTS total_turns,
DROP COLUMN IF EXISTS conversation_duration_seconds,  -- We have duration_seconds
DROP COLUMN IF EXISTS questions_asked_by_homeowner,
DROP COLUMN IF EXISTS objections_raised,
DROP COLUMN IF EXISTS objections_resolved,
DROP COLUMN IF EXISTS homeowner_response_pattern,
DROP COLUMN IF EXISTS homeowner_first_words,
DROP COLUMN IF EXISTS homeowner_final_words,
DROP COLUMN IF EXISTS homeowner_key_questions,
DROP COLUMN IF EXISTS sales_rep_energy_level,
DROP COLUMN IF EXISTS close_attempted,  -- This is in analytics.key_moments
DROP COLUMN IF EXISTS closing_technique,
DROP COLUMN IF EXISTS sentiment_progression,
DROP COLUMN IF EXISTS time_to_value_seconds,
DROP COLUMN IF EXISTS interruptions_count,  -- Can be in analytics if needed
DROP COLUMN IF EXISTS filler_words_count,
DROP COLUMN IF EXISTS conversation_summary;

-- Drop feedback columns that are now in analytics.feedback
-- Note: Keeping these for now as they might still be referenced
-- ALTER TABLE live_sessions
-- DROP COLUMN IF EXISTS what_worked,      -- Now in analytics.feedback.strengths
-- DROP COLUMN IF EXISTS what_failed,      -- Now in analytics.feedback.improvements  
-- DROP COLUMN IF EXISTS key_learnings;    -- Now in analytics.feedback.specific_tips

-- Drop unused deduction columns
ALTER TABLE live_sessions
DROP COLUMN IF EXISTS deductions_interruption_count,
DROP COLUMN IF EXISTS deductions_interruption_penalty,
DROP COLUMN IF EXISTS deductions_excessive_pressure_penalty,
DROP COLUMN IF EXISTS deductions_weak_rapport_penalty,
DROP COLUMN IF EXISTS deductions_unprofessional_language_penalty,
DROP COLUMN IF EXISTS deductions_total;

-- Drop other redundant columns
ALTER TABLE live_sessions
DROP COLUMN IF EXISTS score_feedback,      -- This is in analytics.feedback
DROP COLUMN IF EXISTS sentiment_data,      -- This is in analytics.sentiment_data
DROP COLUMN IF EXISTS transcript,          -- We use full_transcript instead
DROP COLUMN IF EXISTS analyzed_transcript; -- This is in analytics.line_ratings

-- Keep audio_url for potential future use

-- Add comment documenting the streamlined structure
COMMENT ON TABLE live_sessions IS 'Streamlined sessions table focused on core fields. Detailed analysis in analytics JSONB.';

-- Document the analytics column structure
COMMENT ON COLUMN live_sessions.analytics IS 'Contains: {
  feedback: { strengths[], improvements[], specific_tips[] },
  line_ratings: [{ line_number, score, feedback, category }],
  sentiment_data: { overall, by_section },
  key_moments: { price_discussed, safety_addressed, etc },
  transcript_sections: { introduction, discovery, presentation, closing },
  scores: { decimal values },
  grading_version: string,
  graded_at: timestamp
}';