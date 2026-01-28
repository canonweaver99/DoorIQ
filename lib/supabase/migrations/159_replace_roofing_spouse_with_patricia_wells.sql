-- Remove "I Need to Talk to My Spouse" agents from Roofing industry
-- Add Patricia Wells as the new spouse agent for Roofing with agent_2001kfgxefjcefk9r6s1m5vkfzxn

DO $$
DECLARE
  roofing_industry_id UUID;
  spouse_agent_ids UUID[];
  patricia_agent_id UUID;
BEGIN
  -- Get roofing industry ID
  SELECT id INTO roofing_industry_id FROM industries WHERE slug = 'roofing';

  IF roofing_industry_id IS NOT NULL THEN
    -- Find all "I Need to Talk to My Spouse" agents linked to Roofing
    SELECT ARRAY_AGG(DISTINCT a.id) INTO spouse_agent_ids
    FROM agents a
    INNER JOIN agent_industries ai ON ai.agent_id = a.id
    WHERE a.name = 'I Need to Talk to My Spouse'
      AND ai.industry_id = roofing_industry_id;

    -- Remove Roofing industry links from these agents
    IF spouse_agent_ids IS NOT NULL AND array_length(spouse_agent_ids, 1) > 0 THEN
      DELETE FROM agent_industries
      WHERE agent_id = ANY(spouse_agent_ids)
        AND industry_id = roofing_industry_id;

      -- If any of these agents have no more industry links, delete them
      DELETE FROM agents
      WHERE id = ANY(spouse_agent_ids)
        AND NOT EXISTS (
          SELECT 1 FROM agent_industries WHERE agent_id = agents.id
        );
    END IF;

    -- Check if Patricia Wells agent already exists with this agent ID
    SELECT id INTO patricia_agent_id
    FROM agents
    WHERE eleven_agent_id = 'agent_2001kfgxefjcefk9r6s1m5vkfzxn'
    LIMIT 1;

    -- Create or update Patricia Wells agent
    IF patricia_agent_id IS NULL THEN
      -- Create new Patricia Wells agent
      INSERT INTO agents (name, persona, eleven_agent_id, is_active)
      VALUES (
        'I Need to Talk to My Spouse',
        'Smokescreen/Real objection - Very common (50%+). Major purchase decision, both need to agree, or easy exit. What it means: "This is a huge decision I can''t make alone" OR "Go away". Overcome by: Getting both present, scheduling appointment when both home, FaceTime spouse, leaving detailed info.',
        'agent_2001kfgxefjcefk9r6s1m5vkfzxn',
        TRUE
      )
      RETURNING id INTO patricia_agent_id;
    ELSE
      -- Update existing agent to ensure correct name and persona
      UPDATE agents
      SET name = 'I Need to Talk to My Spouse',
          persona = 'Smokescreen/Real objection - Very common (50%+). Major purchase decision, both need to agree, or easy exit. What it means: "This is a huge decision I can''t make alone" OR "Go away". Overcome by: Getting both present, scheduling appointment when both home, FaceTime spouse, leaving detailed info.',
          is_active = TRUE
      WHERE id = patricia_agent_id;
    END IF;

    -- Link Patricia Wells agent to Roofing industry
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (patricia_agent_id, roofing_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;
END $$;
