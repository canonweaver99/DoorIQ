-- Migration 010: Add comprehensive grading system columns to live_sessions
-- This adds all columns needed for the new grading system to work properly

-- ============================================
-- CONVERSATION METRICS (15 columns)
-- ============================================
ALTER TABLE live_sessions 
ADD COLUMN IF NOT EXISTS homeowner_response_pattern TEXT,
ADD COLUMN IF NOT EXISTS time_to_value_seconds INTEGER,
ADD COLUMN IF NOT EXISTS conversation_summary TEXT;

-- Note: These were likely added in earlier migration but adding IF NOT EXISTS for safety
-- total_turns, conversation_duration_seconds, questions_asked_by_homeowner
-- objections_raised, objections_resolved, homeowner_first_words, homeowner_final_words
-- homeowner_key_questions, sales_rep_energy_level, close_attempted, closing_technique
-- interruptions_count, filler_words_count

-- ============================================
-- SCORE BREAKDOWN (10 columns)
-- ============================================
ALTER TABLE live_sessions
ADD COLUMN IF NOT EXISTS opening_introduction_score INTEGER CHECK (opening_introduction_score >= 0 AND opening_introduction_score <= 100),
ADD COLUMN IF NOT EXISTS opening_introduction_reason TEXT,
ADD COLUMN IF NOT EXISTS rapport_building_score INTEGER CHECK (rapport_building_score >= 0 AND rapport_building_score <= 100),
ADD COLUMN IF NOT EXISTS rapport_building_reason TEXT,
ADD COLUMN IF NOT EXISTS needs_discovery_score INTEGER CHECK (needs_discovery_score >= 0 AND needs_discovery_score <= 100),
ADD COLUMN IF NOT EXISTS needs_discovery_reason TEXT,
ADD COLUMN IF NOT EXISTS value_communication_score INTEGER CHECK (value_communication_score >= 0 AND value_communication_score <= 100),
ADD COLUMN IF NOT EXISTS value_communication_reason TEXT,
ADD COLUMN IF NOT EXISTS objection_handling_reason TEXT,
ADD COLUMN IF NOT EXISTS closing_score INTEGER CHECK (closing_score >= 0 AND closing_score <= 100),
ADD COLUMN IF NOT EXISTS closing_reason TEXT;

-- ============================================
-- DEDUCTIONS (6 columns)
-- ============================================
ALTER TABLE live_sessions
ADD COLUMN IF NOT EXISTS deductions_interruption_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS deductions_pricing_deflections INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS deductions_pressure_tactics BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deductions_made_up_info BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deductions_rude_or_dismissive BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deductions_total INTEGER DEFAULT 0;

-- ============================================
-- OUTCOME & RESULTS (4 columns)
-- ============================================
ALTER TABLE live_sessions
ADD COLUMN IF NOT EXISTS outcome TEXT CHECK (outcome IN ('SUCCESS', 'FAILURE', 'PARTIAL')),
ADD COLUMN IF NOT EXISTS sale_closed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pass BOOLEAN,
ADD COLUMN IF NOT EXISTS grade_letter TEXT CHECK (grade_letter IN ('A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'));

-- ============================================
-- FEEDBACK ARRAYS (3 columns)
-- ============================================
ALTER TABLE live_sessions
ADD COLUMN IF NOT EXISTS what_worked TEXT[],
ADD COLUMN IF NOT EXISTS what_failed TEXT[],
ADD COLUMN IF NOT EXISTS key_learnings TEXT[];

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_live_sessions_grade_letter ON live_sessions(grade_letter);
CREATE INDEX IF NOT EXISTS idx_live_sessions_outcome ON live_sessions(outcome);
CREATE INDEX IF NOT EXISTS idx_live_sessions_sale_closed ON live_sessions(sale_closed);
CREATE INDEX IF NOT EXISTS idx_live_sessions_pass ON live_sessions(pass);
CREATE INDEX IF NOT EXISTS idx_live_sessions_user_created ON live_sessions(user_id, created_at DESC);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON COLUMN live_sessions.homeowner_response_pattern IS 'Engagement style: short_dismissive, engaged_curious, detailed_responsive, moderate_responsive';
COMMENT ON COLUMN live_sessions.time_to_value_seconds IS 'How many seconds into conversation before value was mentioned';
COMMENT ON COLUMN live_sessions.conversation_summary IS 'Human-readable one-sentence summary of the conversation';
COMMENT ON COLUMN live_sessions.outcome IS 'Final outcome: SUCCESS (deal closed), FAILURE (rejected), PARTIAL (interest shown)';
COMMENT ON COLUMN live_sessions.grade_letter IS 'Letter grade from A+ to F based on overall_score';
COMMENT ON COLUMN live_sessions.pass IS 'Boolean: true if overall_score >= 70';
COMMENT ON COLUMN live_sessions.what_worked IS 'Array of strengths/wins from the conversation';
COMMENT ON COLUMN live_sessions.what_failed IS 'Array of areas needing improvement';
COMMENT ON COLUMN live_sessions.key_learnings IS 'Array of specific drill suggestions';
COMMENT ON COLUMN live_sessions.deductions_total IS 'Total penalty points deducted from score';

