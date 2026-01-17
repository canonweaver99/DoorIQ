-- Add Angry Indian agent for content creator sessions
-- Note: You'll need to create this agent in ElevenLabs with "FUNNY INDIAN" voice
-- and update the eleven_agent_id below with the actual agent ID

INSERT INTO agents (name, persona, eleven_agent_id, is_active) 
VALUES (
  'Angry Indian',
  'Angry and confrontational homeowner. Tests your ability to handle difficult situations and maintain professionalism under pressure.',
  'PLACEHOLDER_AGENT_ID', -- TODO: Replace with actual ElevenLabs agent ID
  TRUE
)
ON CONFLICT (name) DO UPDATE SET
  persona = EXCLUDED.persona,
  eleven_agent_id = EXCLUDED.eleven_agent_id,
  is_active = EXCLUDED.is_active;

-- Add comment
COMMENT ON TABLE agents IS 'ElevenLabs conversational AI agents for door-to-door sales training';

