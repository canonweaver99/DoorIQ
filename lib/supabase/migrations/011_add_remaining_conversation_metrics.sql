-- Migration 011: Add remaining conversation metric columns
-- These columns exist in TypeScript types but were missing from database

-- Conversation metrics that should have existed
ALTER TABLE live_sessions 
ADD COLUMN IF NOT EXISTS total_turns INTEGER,
ADD COLUMN IF NOT EXISTS conversation_duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS questions_asked_by_homeowner INTEGER,
ADD COLUMN IF NOT EXISTS objections_raised INTEGER,
ADD COLUMN IF NOT EXISTS objections_resolved INTEGER,
ADD COLUMN IF NOT EXISTS homeowner_first_words TEXT,
ADD COLUMN IF NOT EXISTS homeowner_final_words TEXT,
ADD COLUMN IF NOT EXISTS homeowner_key_questions TEXT[],
ADD COLUMN IF NOT EXISTS sales_rep_energy_level TEXT CHECK (sales_rep_energy_level IN ('low', 'moderate', 'high', 'too aggressive')),
ADD COLUMN IF NOT EXISTS close_attempted BOOLEAN,
ADD COLUMN IF NOT EXISTS closing_technique TEXT,
ADD COLUMN IF NOT EXISTS rapport_score INTEGER CHECK (rapport_score >= 0 AND rapport_score <= 100),
ADD COLUMN IF NOT EXISTS sentiment_progression TEXT,
ADD COLUMN IF NOT EXISTS interruptions_count INTEGER,
ADD COLUMN IF NOT EXISTS filler_words_count INTEGER,
ADD COLUMN IF NOT EXISTS agent_persona TEXT,
ADD COLUMN IF NOT EXISTS conversation_id TEXT;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_live_sessions_total_turns ON live_sessions(total_turns);
CREATE INDEX IF NOT EXISTS idx_live_sessions_conversation_id ON live_sessions(conversation_id);

-- Comments
COMMENT ON COLUMN live_sessions.total_turns IS 'Total number of back-and-forth exchanges';
COMMENT ON COLUMN live_sessions.conversation_duration_seconds IS 'Length of conversation in seconds';
COMMENT ON COLUMN live_sessions.questions_asked_by_homeowner IS 'Count of questions from homeowner';
COMMENT ON COLUMN live_sessions.objections_raised IS 'Number of objections detected';
COMMENT ON COLUMN live_sessions.objections_resolved IS 'Number of objections successfully handled';

