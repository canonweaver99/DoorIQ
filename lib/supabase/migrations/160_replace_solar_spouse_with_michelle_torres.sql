-- Remove "I Need to Talk to My Spouse" agents from Solar industry
-- Add Michelle Torres as the new spouse agent for Solar with agent_9101kfgy6d0jft18a06r0zj19jp1

DO $$
DECLARE
  solar_industry_id UUID;
  spouse_agent_ids UUID[];
  michelle_agent_id UUID;
BEGIN
  -- Get solar industry ID
  SELECT id INTO solar_industry_id FROM industries WHERE slug = 'solar';

  IF solar_industry_id IS NOT NULL THEN
    -- Find all "I Need to Talk to My Spouse" agents linked to Solar
    SELECT ARRAY_AGG(DISTINCT a.id) INTO spouse_agent_ids
    FROM agents a
    INNER JOIN agent_industries ai ON ai.agent_id = a.id
    WHERE a.name = 'I Need to Talk to My Spouse'
      AND ai.industry_id = solar_industry_id;

    -- Remove Solar industry links from these agents
    IF spouse_agent_ids IS NOT NULL AND array_length(spouse_agent_ids, 1) > 0 THEN
      DELETE FROM agent_industries
      WHERE agent_id = ANY(spouse_agent_ids)
        AND industry_id = solar_industry_id;

      -- If any of these agents have no more industry links, delete them
      DELETE FROM agents
      WHERE id = ANY(spouse_agent_ids)
        AND NOT EXISTS (
          SELECT 1 FROM agent_industries WHERE agent_id = agents.id
        );
    END IF;

    -- Check if Michelle Torres agent already exists with this agent ID
    SELECT id INTO michelle_agent_id
    FROM agents
    WHERE eleven_agent_id = 'agent_9101kfgy6d0jft18a06r0zj19jp1'
    LIMIT 1;

    -- Create or update Michelle Torres agent
    IF michelle_agent_id IS NULL THEN
      -- Create new Michelle Torres agent
      INSERT INTO agents (name, persona, eleven_agent_id, is_active)
      VALUES (
        'I Need to Talk to My Spouse',
        'Smokescreen/Real objection - Very common (60%+). MAJOR household decision, requires both parties, or easy out. What it means: "This is too big for me alone" OR "I want you gone". Overcome by: Only meet with both present, FaceTime spouse, schedule evening appointment, never one-leg a solar deal.',
        'agent_9101kfgy6d0jft18a06r0zj19jp1',
        TRUE
      )
      RETURNING id INTO michelle_agent_id;
    ELSE
      -- Update existing agent to ensure correct name and persona
      UPDATE agents
      SET name = 'I Need to Talk to My Spouse',
          persona = 'Smokescreen/Real objection - Very common (60%+). MAJOR household decision, requires both parties, or easy out. What it means: "This is too big for me alone" OR "I want you gone". Overcome by: Only meet with both present, FaceTime spouse, schedule evening appointment, never one-leg a solar deal.',
          is_active = TRUE
      WHERE id = michelle_agent_id;
    END IF;

    -- Link Michelle Torres agent to Solar industry
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (michelle_agent_id, solar_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;
END $$;
