-- Re-add "How Much Does It Cost?" (James Porter) to Solar industry
-- Remove "How Much Does It Cost?" from Windows industry (keep Solar only)
-- This agent was removed from solar in migration 154 but should be available for solar
-- Migration 166 tried to update it but only if already linked, so we need to ensure the link exists

DO $$
DECLARE
  solar_industry_id UUID;
  windows_industry_id UUID;
  james_porter_agent_id UUID;
BEGIN
  -- Get industry IDs
  SELECT id INTO solar_industry_id FROM industries WHERE slug = 'solar';
  SELECT id INTO windows_industry_id FROM industries WHERE slug = 'windows';
  
  IF solar_industry_id IS NULL THEN
    RAISE EXCEPTION 'Solar industry not found';
  END IF;
  
  IF windows_industry_id IS NULL THEN
    RAISE EXCEPTION 'Windows industry not found';
  END IF;

  -- Find or create the "How Much Does It Cost?" agent with James Porter's ID (Solar)
  SELECT id INTO james_porter_agent_id
  FROM agents
  WHERE name = 'How Much Does It Cost?'
    AND eleven_agent_id = 'agent_5001kfgygawzf3z9prjqkqv1wj85'
  LIMIT 1;

  -- If agent doesn't exist with this ID, check if it exists with a different ID
  IF james_porter_agent_id IS NULL THEN
    SELECT id INTO james_porter_agent_id
    FROM agents
    WHERE name = 'How Much Does It Cost?'
    LIMIT 1;
    
    -- If found, update it with the correct ID for Solar
    IF james_porter_agent_id IS NOT NULL THEN
      UPDATE agents
      SET eleven_agent_id = 'agent_5001kfgygawzf3z9prjqkqv1wj85'
      WHERE id = james_porter_agent_id;
    END IF;
  END IF;

  -- If agent still doesn't exist, create it
  IF james_porter_agent_id IS NULL THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'How Much Does It Cost?',
      'Smokescreen/Qualification - Very common (55%+). Want a number to disqualify you or compare. Price-focused, wants to disqualify or compare prices. Responds to savings focus and net monthly payment.',
      'agent_5001kfgygawzf3z9prjqkqv1wj85',
      TRUE
    )
    RETURNING id INTO james_porter_agent_id;
  END IF;

  -- Remove "How Much Does It Cost?" from Windows industry
  DELETE FROM agent_industries
  WHERE agent_id = james_porter_agent_id
    AND industry_id = windows_industry_id;

  -- Ensure agent is linked to solar industry
  INSERT INTO agent_industries (agent_id, industry_id)
  VALUES (james_porter_agent_id, solar_industry_id)
  ON CONFLICT (agent_id, industry_id) DO NOTHING;

  -- Ensure agent is active
  UPDATE agents
  SET is_active = TRUE
  WHERE id = james_porter_agent_id;

END $$;
