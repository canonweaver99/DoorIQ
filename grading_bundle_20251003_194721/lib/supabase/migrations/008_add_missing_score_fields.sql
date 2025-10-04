-- Add missing score fields to live_sessions table for grading system

ALTER TABLE live_sessions 
ADD COLUMN IF NOT EXISTS safety_score INTEGER CHECK (safety_score >= 0 AND safety_score <= 100),
ADD COLUMN IF NOT EXISTS close_effectiveness_score INTEGER CHECK (close_effectiveness_score >= 0 AND close_effectiveness_score <= 100),
ADD COLUMN IF NOT EXISTS introduction_score INTEGER CHECK (introduction_score >= 0 AND introduction_score <= 100),
ADD COLUMN IF NOT EXISTS listening_score INTEGER CHECK (listening_score >= 0 AND listening_score <= 100);

-- Create index for faster score queries
CREATE INDEX IF NOT EXISTS idx_live_sessions_overall_score ON live_sessions(overall_score);
CREATE INDEX IF NOT EXISTS idx_live_sessions_ended_at ON live_sessions(ended_at);

