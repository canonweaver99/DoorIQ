-- Add agent_id column to live_sessions table if it doesn't exist
-- This column stores the ElevenLabs agent ID used for the session

ALTER TABLE live_sessions
ADD COLUMN IF NOT EXISTS agent_id TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_live_sessions_agent_id ON live_sessions(agent_id);

-- Add comment for documentation
COMMENT ON COLUMN live_sessions.agent_id IS 'ElevenLabs agent ID used for this training session';

