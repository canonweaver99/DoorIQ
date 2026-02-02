-- Fix Diane Martinez roofing assignment
-- Jennifer Walsh (agent_2701kg2yvease7b89h6nx6p1eqjy) should be assigned to Solar only
-- Diane Martinez (agent_9701kfgy2ptff7x8je2fcca13jp1) should be assigned to Roofing ONLY
-- NOTE: Migration 176 provides a more comprehensive fix for all roofing agents

DO $$
DECLARE
  solar_industry_id UUID;
  roofing_industry_id UUID;
  jennifer_walsh_id UUID;
  diane_martinez_id UUID;
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

  -- Find Jennifer Walsh (agent ID for Solar)
  SELECT id INTO jennifer_walsh_id
  FROM agents
  WHERE eleven_agent_id = 'agent_2701kg2yvease7b89h6nx6p1eqjy'
  LIMIT 1;

  -- Ensure Jennifer Walsh is assigned to Solar only (remove from Roofing if present)
  IF jennifer_walsh_id IS NOT NULL THEN
    -- Remove from Roofing
    DELETE FROM agent_industries
    WHERE agent_id = jennifer_walsh_id
      AND industry_id = roofing_industry_id;
    
    -- Ensure assigned to Solar
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (jennifer_walsh_id, solar_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- Find Diane Martinez (should be in Roofing ONLY)
  SELECT id INTO diane_martinez_id
  FROM agents
  WHERE eleven_agent_id = 'agent_9701kfgy2ptff7x8je2fcca13jp1'
  LIMIT 1;

  -- Ensure Diane Martinez is assigned to Roofing ONLY (remove from Solar if present)
  IF diane_martinez_id IS NOT NULL THEN
    -- Remove from Solar
    DELETE FROM agent_industries
    WHERE agent_id = diane_martinez_id
      AND industry_id = solar_industry_id;
    
    -- Ensure assigned to Roofing
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (diane_martinez_id, roofing_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

END $$;

-- Add comment
COMMENT ON TABLE agent_industries IS 'Junction table linking agents to industries. Migration 175 ensures correct assignments for "I''m Selling Soon" agents.';
