-- Fix agent assignments for "I'm Selling Soon" objection
-- 1. Remove Diane Martinez from Solar industry (she should only be in Roofing)
-- 2. Assign Jennifer Walsh to Solar industry for "I'm Selling Soon" objection
-- 3. Ensure Diane Martinez is only assigned to Roofing industry

DO $$
DECLARE
  solar_industry_id UUID;
  roofing_industry_id UUID;
  diane_martinez_agent_id UUID;
  jennifer_walsh_agent_id UUID;
BEGIN
  -- Get industry IDs
  SELECT id INTO solar_industry_id FROM industries WHERE slug = 'solar';
  SELECT id INTO roofing_industry_id FROM industries WHERE slug = 'roofing';
  
  IF solar_industry_id IS NULL THEN
    RAISE EXCEPTION 'Solar industry not found';
  END IF;
  
  IF roofing_industry_id IS NULL THEN
    RAISE EXCEPTION 'Roofing industry not found';
  END IF;

  -- Find Diane Martinez agent (agent_2701kg2yvease7b89h6nx6p1eqjy)
  SELECT id INTO diane_martinez_agent_id
  FROM agents
  WHERE name = 'I''m Selling Soon'
    AND eleven_agent_id = 'agent_2701kg2yvease7b89h6nx6p1eqjy'
  LIMIT 1;

  -- Remove Diane Martinez from Solar industry
  IF diane_martinez_agent_id IS NOT NULL THEN
    DELETE FROM agent_industries
    WHERE agent_id = diane_martinez_agent_id
      AND industry_id = solar_industry_id;
    
    -- Ensure Diane Martinez is linked to Roofing industry
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (diane_martinez_agent_id, roofing_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- Find or create Jennifer Walsh agent for Solar
  -- TODO: Replace 'PLACEHOLDER_JENNIFER_WALSH_AGENT_ID' with actual Jennifer Walsh agent ID
  SELECT id INTO jennifer_walsh_agent_id
  FROM agents
  WHERE name = 'I''m Selling Soon'
    AND eleven_agent_id = 'PLACEHOLDER_JENNIFER_WALSH_AGENT_ID'
  LIMIT 1;

  -- If Jennifer Walsh agent doesn't exist, create it
  IF jennifer_walsh_agent_id IS NULL THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'I''m Selling Soon',
      'Smokescreen/Real Objection - Moderate (20%+). Sometimes true, often an easy excuse.',
      'PLACEHOLDER_JENNIFER_WALSH_AGENT_ID', -- TODO: Replace with actual Jennifer Walsh agent ID
      TRUE
    )
    RETURNING id INTO jennifer_walsh_agent_id;
  END IF;

  -- Link Jennifer Walsh to Solar industry
  IF jennifer_walsh_agent_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (jennifer_walsh_agent_id, solar_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

END $$;
