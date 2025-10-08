-- Add 5 new enhanced grading metrics to live_sessions table
-- These metrics provide deeper insights into sales rep performance

-- 1. Speaking Pace (Words Per Minute)
ALTER TABLE live_sessions
  ADD COLUMN IF NOT EXISTS speaking_pace_score INTEGER CHECK (speaking_pace_score >= 0 AND speaking_pace_score <= 100),
  ADD COLUMN IF NOT EXISTS speaking_pace_data JSONB DEFAULT '{}'::jsonb;

-- 2. Filler Words Count
ALTER TABLE live_sessions
  ADD COLUMN IF NOT EXISTS filler_words_score INTEGER CHECK (filler_words_score >= 0 AND filler_words_score <= 100),
  ADD COLUMN IF NOT EXISTS filler_words_data JSONB DEFAULT '{}'::jsonb;

-- 3. Question vs. Statement Ratio
ALTER TABLE live_sessions
  ADD COLUMN IF NOT EXISTS question_ratio_score INTEGER CHECK (question_ratio_score >= 0 AND question_ratio_score <= 100),
  ADD COLUMN IF NOT EXISTS question_ratio_data JSONB DEFAULT '{}'::jsonb;

-- 4. Active Listening Indicators
ALTER TABLE live_sessions
  ADD COLUMN IF NOT EXISTS active_listening_score INTEGER CHECK (active_listening_score >= 0 AND active_listening_score <= 100),
  ADD COLUMN IF NOT EXISTS active_listening_data JSONB DEFAULT '{}'::jsonb;

-- 5. Assumptive Language Usage
ALTER TABLE live_sessions
  ADD COLUMN IF NOT EXISTS assumptive_language_score INTEGER CHECK (assumptive_language_score >= 0 AND assumptive_language_score <= 100),
  ADD COLUMN IF NOT EXISTS assumptive_language_data JSONB DEFAULT '{}'::jsonb;

-- Add comments explaining each new metric
COMMENT ON COLUMN live_sessions.speaking_pace_score IS 'Speaking pace score (0-100). Optimal: 140-160 WPM. Penalizes <120 or >200 WPM';
COMMENT ON COLUMN live_sessions.speaking_pace_data IS 'Detailed pace data: { avg_wpm, sections: [{ line_range, wpm, notes }], rushed_sections, clear_sections }';

COMMENT ON COLUMN live_sessions.filler_words_score IS 'Filler words score (0-100). Lower filler density = higher score';
COMMENT ON COLUMN live_sessions.filler_words_data IS 'Filler analysis: { total_count, per_minute, common_fillers: {word: count}, clusters: [{line_range, density}] }';

COMMENT ON COLUMN live_sessions.question_ratio_score IS 'Question vs statement ratio score (0-100). Target: 30-40% questions';
COMMENT ON COLUMN live_sessions.question_ratio_data IS 'Question analysis: { ratio_percentage, total_questions, open_ended_count, closed_count, by_category }';

COMMENT ON COLUMN live_sessions.active_listening_score IS 'Active listening indicators score (0-100). Based on acknowledgments, empathy, paraphrasing';
COMMENT ON COLUMN live_sessions.active_listening_data IS 'Listening analysis: { acknowledgments, empathy_statements, paraphrasing_count, building_on_responses }';

COMMENT ON COLUMN live_sessions.assumptive_language_score IS 'Assumptive language usage score (0-100). Higher score = more confident/assumptive language';
COMMENT ON COLUMN live_sessions.assumptive_language_data IS 'Language analysis: { assumptive_phrases, tentative_phrases, confidence_ratio, strong_closes }';

-- Update the overall score calculation trigger to include new metrics
CREATE OR REPLACE FUNCTION calculate_overall_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate average of all 9 scoring metrics if they exist
  DECLARE
    score_count INTEGER := 0;
    score_sum INTEGER := 0;
  BEGIN
    -- Core 4 metrics
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
    
    -- New 5 metrics
    IF NEW.speaking_pace_score IS NOT NULL THEN
      score_sum := score_sum + NEW.speaking_pace_score;
      score_count := score_count + 1;
    END IF;
    
    IF NEW.filler_words_score IS NOT NULL THEN
      score_sum := score_sum + NEW.filler_words_score;
      score_count := score_count + 1;
    END IF;
    
    IF NEW.question_ratio_score IS NOT NULL THEN
      score_sum := score_sum + NEW.question_ratio_score;
      score_count := score_count + 1;
    END IF;
    
    IF NEW.active_listening_score IS NOT NULL THEN
      score_sum := score_sum + NEW.active_listening_score;
      score_count := score_count + 1;
    END IF;
    
    IF NEW.assumptive_language_score IS NOT NULL THEN
      score_sum := score_sum + NEW.assumptive_language_score;
      score_count := score_count + 1;
    END IF;
    
    -- Calculate average if we have scores
    IF score_count > 0 THEN
      NEW.overall_score := ROUND(score_sum::NUMERIC / score_count);
    END IF;
    
    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql;

-- Re-create the trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS calculate_overall_score_trigger ON live_sessions;
CREATE TRIGGER calculate_overall_score_trigger
  BEFORE INSERT OR UPDATE ON live_sessions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_overall_score();

-- Add index for performance when querying by these new scores
CREATE INDEX IF NOT EXISTS idx_live_sessions_enhanced_scores ON live_sessions(
  speaking_pace_score,
  filler_words_score,
  question_ratio_score,
  active_listening_score,
  assumptive_language_score
);

-- Update analytics column comment to include new metric details
COMMENT ON COLUMN live_sessions.analytics IS 'Enhanced analytics including: {
  line_ratings: [{ 
    line_number: number,
    effectiveness: "excellent" | "good" | "average" | "poor",
    score: 0-100,
    alternative_lines: string[],
    improvement_notes: string,
    category: "introduction" | "rapport" | "discovery" | "objection_handling" | "closing" | "safety" | "general"
  }],
  feedback: { 
    strengths: string[], 
    improvements: string[], 
    specific_tips: string[] 
  },
  enhanced_metrics: {
    speaking_pace: { avg_wpm, pace_variation, rushed_sections, clear_sections },
    filler_words: { total_count, per_minute, common_fillers, clusters },
    question_ratio: { percentage, open_ended, closed, by_category },
    active_listening: { acknowledgments, empathy_count, paraphrasing, relevance },
    assumptive_language: { confidence_phrases, tentative_phrases, ratio }
  },
  sentiment_data: { overall, by_section },
  key_moments: { price_discussed, safety_addressed, etc },
  transcript_sections: { introduction, discovery, presentation, closing },
  scores: { decimal values },
  grading_version: string,
  graded_at: timestamp
}';
