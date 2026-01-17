-- Add Angry Indian agent for content creator sessions
-- Note: You'll need to create this agent in ElevenLabs with "FUNNY INDIAN" voice
-- and update the eleven_agent_id below with the actual agent ID

DO $$
BEGIN
  -- Check if agent already exists
  IF EXISTS (SELECT 1 FROM agents WHERE name = 'Angry Indian') THEN
    -- Update existing agent
    UPDATE agents 
    SET 
      persona = 'Angry and confrontational homeowner. Tests your ability to handle difficult situations and maintain professionalism under pressure.',
      eleven_agent_id = 'agent_3301kf4hmz0qfcdsms0djvq8wf2z',
      is_active = TRUE
    WHERE name = 'Angry Indian';
  ELSE
    -- Insert new agent
    INSERT INTO agents (name, persona, eleven_agent_id, is_active) 
    VALUES (
      'Angry Indian',
      'Angry and confrontational homeowner. Tests your ability to handle difficult situations and maintain professionalism under pressure.',
      'agent_3301kf4hmz0qfcdsms0djvq8wf2z',
      TRUE
    );
  END IF;
END $$;

-- Add comment
COMMENT ON TABLE agents IS 'ElevenLabs conversational AI agents for door-to-door sales training';

