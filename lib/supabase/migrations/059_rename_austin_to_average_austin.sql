-- Rename Austin to Average Austin
-- This migration updates the agent name in the database

UPDATE agents 
SET name = 'Average Austin'
WHERE name = 'Austin' AND eleven_agent_id = 'agent_7001k5jqfjmtejvs77jvhjf254tz';

-- Add comment for documentation
COMMENT ON TABLE agents IS 'ElevenLabs conversational AI agents for door-to-door sales training. Austin has been renamed to Average Austin.';

