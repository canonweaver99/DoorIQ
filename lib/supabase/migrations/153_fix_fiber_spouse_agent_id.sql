-- Fix the "I Need to Talk to My Spouse" agent to use the correct eleven_agent_id for fiber industry
-- Migration 147 (windows) runs after 144 (fiber) and overwrites the eleven_agent_id
-- This migration ensures fiber industry agents have the correct ElevenLabs agent ID for Jessica Martinez
-- Note: Since the same agent name exists in multiple industries and agents table only has one 
-- eleven_agent_id field, we prioritize fiber when the agent is associated with fiber industry.
-- The application code has been updated to check fiber first for this agent name regardless of ID.

DO $$
DECLARE
  agent_record RECORD;
  fiber_industry_id UUID;
BEGIN
  -- Get fiber industry ID
  SELECT id INTO fiber_industry_id FROM industries WHERE slug = 'fiber';
  
  -- Find the agent
  SELECT id, eleven_agent_id INTO agent_record
  FROM agents
  WHERE name = 'I Need to Talk to My Spouse'
  LIMIT 1;
  
  -- If agent exists and is associated with fiber industry
  IF agent_record.id IS NOT NULL AND fiber_industry_id IS NOT NULL THEN
    -- Check if agent is associated with fiber industry
    IF EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agent_record.id 
      AND industry_id = fiber_industry_id
    ) THEN
      -- Update to Jessica Martinez's actual ElevenLabs agent ID
      -- This prioritizes fiber over windows when agent is in both industries
      -- The application code will check fiber first for this agent name
      UPDATE agents
      SET eleven_agent_id = 'agent_7201kfgssnt8eb2a8a4kghb421vd'
      WHERE id = agent_record.id
        AND (eleven_agent_id IS NULL 
             OR eleven_agent_id NOT LIKE 'agent_7201kfgssnt8eb2a8a4kghb421vd'
             OR eleven_agent_id LIKE 'placeholder_%');
    END IF;
  END IF;
END $$;
