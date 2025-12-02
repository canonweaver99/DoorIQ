-- Add user feedback columns to live_sessions table
-- This allows users to provide feedback after each session

ALTER TABLE live_sessions
ADD COLUMN IF NOT EXISTS user_feedback_rating INTEGER CHECK (user_feedback_rating >= 1 AND user_feedback_rating <= 10),
ADD COLUMN IF NOT EXISTS user_feedback_improvement_area TEXT,
ADD COLUMN IF NOT EXISTS user_feedback_text TEXT,
ADD COLUMN IF NOT EXISTS user_feedback_submitted_at TIMESTAMPTZ;

-- Add index for querying feedback submissions
CREATE INDEX IF NOT EXISTS idx_live_sessions_user_feedback_submitted_at 
ON live_sessions(user_feedback_submitted_at) 
WHERE user_feedback_submitted_at IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN live_sessions.user_feedback_rating IS 'User rating of session quality (1-10 scale)';
COMMENT ON COLUMN live_sessions.user_feedback_improvement_area IS 'AI agent improvement area: Agent responses were too generic, Agent didn\'t respond naturally, Agent missed key conversation cues, Agent objections were unrealistic, Agent personality didn\'t match scenario, Other';
COMMENT ON COLUMN live_sessions.user_feedback_text IS 'Free-form text feedback from user about the session and AI agent';
COMMENT ON COLUMN live_sessions.user_feedback_submitted_at IS 'Timestamp when user submitted feedback';

