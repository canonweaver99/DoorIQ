-- Fix the "I Need to Talk to My Spouse" agent to use Angela White's actual ElevenLabs agent ID for Windows industry
-- This agent should use agent_9301kg0vggg4em0aqfs72f9r3bp4 (Angela White) for Windows

DO $$
DECLARE
  agent_record RECORD;
  windows_industry_id UUID;
BEGIN
  -- Get windows industry ID
  SELECT id INTO windows_industry_id FROM industries WHERE slug = 'windows';
  
  -- Find the agent
  SELECT id, eleven_agent_id INTO agent_record
  FROM agents
  WHERE name = 'I Need to Talk to My Spouse'
  LIMIT 1;
  
  -- If agent exists and is associated with windows industry
  IF agent_record.id IS NOT NULL AND windows_industry_id IS NOT NULL THEN
    -- Check if agent is associated with windows industry
    IF EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agent_record.id 
      AND industry_id = windows_industry_id
    ) THEN
      -- Update to Angela White's actual ElevenLabs agent ID
      UPDATE agents
      SET eleven_agent_id = 'agent_9301kg0vggg4em0aqfs72f9r3bp4'
      WHERE id = agent_record.id
        AND (eleven_agent_id IS NULL 
             OR eleven_agent_id NOT LIKE 'agent_9301kg0vggg4em0aqfs72f9r3bp4'
             OR eleven_agent_id LIKE 'placeholder_%');
    END IF;
  END IF;
END $$;
