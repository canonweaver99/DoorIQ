-- Add Nick Fuentes agent for content creator sessions
-- Note: You'll need to create this agent in ElevenLabs
-- and update the eleven_agent_id below with the actual agent ID

DO $$
BEGIN
  -- Check if agent already exists
  IF EXISTS (SELECT 1 FROM agents WHERE name = 'Nick Fuentes') THEN
    -- Update existing agent
    UPDATE agents 
    SET 
      persona = 'Challenging homeowner who tests your ability to handle difficult situations and maintain professionalism under pressure.',
      eleven_agent_id = 'agent_placeholder_update_with_actual_id',
      is_active = TRUE
    WHERE name = 'Nick Fuentes';
  ELSE
    -- Insert new agent
    INSERT INTO agents (name, persona, eleven_agent_id, is_active) 
    VALUES (
      'Nick Fuentes',
      'Challenging homeowner who tests your ability to handle difficult situations and maintain professionalism under pressure.',
      'agent_placeholder_update_with_actual_id',
      TRUE
    );
  END IF;
END $$;

-- Add comment
COMMENT ON TABLE agents IS 'ElevenLabs conversational AI agents for door-to-door sales training';
