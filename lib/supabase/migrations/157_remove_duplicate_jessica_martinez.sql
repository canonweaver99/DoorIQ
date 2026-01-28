-- Remove duplicate "I Need to Talk to My Spouse" agents that incorrectly show Jessica Martinez
-- Keep only the correct Fiber industry agent with agent_7201kfgssnt8eb2a8a4kghb421vd
-- This removes any agents linked to Fiber that don't have the correct Jessica Martinez agent ID

DO $$
DECLARE
  fiber_industry_id UUID;
  correct_fiber_agent_id UUID;
  agent_to_delete RECORD;
BEGIN
  -- Get fiber industry ID
  SELECT id INTO fiber_industry_id FROM industries WHERE slug = 'fiber';

  -- Find the correct Fiber agent (should have Jessica Martinez's agent ID)
  SELECT id INTO correct_fiber_agent_id
  FROM agents
  WHERE name = 'I Need to Talk to My Spouse'
    AND eleven_agent_id = 'agent_7201kfgssnt8eb2a8a4kghb421vd'
  LIMIT 1;

  -- If we found the correct agent, ensure it's linked to Fiber industry
  IF correct_fiber_agent_id IS NOT NULL AND fiber_industry_id IS NOT NULL THEN
    -- Ensure the correct agent is linked to Fiber
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (correct_fiber_agent_id, fiber_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;

    -- Find and remove any other agents linked to Fiber that are NOT the correct one
    -- These are duplicates incorrectly showing Jessica Martinez
    FOR agent_to_delete IN
      SELECT DISTINCT a.id
      FROM agents a
      INNER JOIN agent_industries ai ON ai.agent_id = a.id
      WHERE a.name = 'I Need to Talk to My Spouse'
        AND a.id != correct_fiber_agent_id
        AND ai.industry_id = fiber_industry_id
        -- Only delete if it doesn't have the correct agent ID
        AND a.eleven_agent_id != 'agent_7201kfgssnt8eb2a8a4kghb421vd'
    LOOP
      -- Remove the Fiber industry link from this duplicate agent
      DELETE FROM agent_industries 
      WHERE agent_id = agent_to_delete.id 
        AND industry_id = fiber_industry_id;
      
      -- If this agent has no more industry links, delete it completely
      -- Otherwise, it might belong to another industry (like Windows, Pest, etc.)
      IF NOT EXISTS (
        SELECT 1 FROM agent_industries WHERE agent_id = agent_to_delete.id
      ) THEN
        DELETE FROM agents WHERE id = agent_to_delete.id;
      END IF;
    END LOOP;
  END IF;

END $$;
