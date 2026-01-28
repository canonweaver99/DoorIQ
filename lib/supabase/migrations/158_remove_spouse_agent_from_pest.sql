-- Remove "I Need to Talk to My Spouse" agent from Pest Control industry
-- User wants to create a new pest-specific agent instead
-- This keeps the agent in other industries (Fiber, Windows, Solar, Roofing)

DO $$
DECLARE
  pest_industry_id UUID;
  spouse_agent_ids UUID[];
BEGIN
  -- Get pest industry ID
  SELECT id INTO pest_industry_id FROM industries WHERE slug = 'pest';

  IF pest_industry_id IS NOT NULL THEN
    -- Find all "I Need to Talk to My Spouse" agents linked to Pest Control
    SELECT ARRAY_AGG(DISTINCT a.id) INTO spouse_agent_ids
    FROM agents a
    INNER JOIN agent_industries ai ON ai.agent_id = a.id
    WHERE a.name = 'I Need to Talk to My Spouse'
      AND ai.industry_id = pest_industry_id;

    -- Remove Pest Control industry links from these agents
    IF spouse_agent_ids IS NOT NULL AND array_length(spouse_agent_ids, 1) > 0 THEN
      DELETE FROM agent_industries
      WHERE agent_id = ANY(spouse_agent_ids)
        AND industry_id = pest_industry_id;

      -- If any of these agents have no more industry links, delete them
      -- (This handles the case where an agent was ONLY in Pest Control)
      DELETE FROM agents
      WHERE id = ANY(spouse_agent_ids)
        AND NOT EXISTS (
          SELECT 1 FROM agent_industries WHERE agent_id = agents.id
        );
    END IF;
  END IF;
END $$;
