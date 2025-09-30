-- Add agent_id to training_sessions table
-- This allows tracking which agent was used for each training session

ALTER TABLE training_sessions 
ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES agents(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_training_sessions_agent_id ON training_sessions(agent_id);

-- Add comment for documentation
COMMENT ON COLUMN training_sessions.agent_id IS 'Reference to the ElevenLabs agent used for this training session';
