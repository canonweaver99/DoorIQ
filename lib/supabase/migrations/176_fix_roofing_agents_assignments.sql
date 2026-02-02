-- Fix roofing agent assignments - ensure roofing-specific agents are ONLY in roofing
-- Remove any incorrect assignments and ensure correct ones are in place

DO $$
DECLARE
  solar_industry_id UUID;
  roofing_industry_id UUID;
  diane_martinez_id UUID;
  jennifer_walsh_id UUID;
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

  -- ============================================
  -- DIANE MARTINEZ - Should be in Roofing ONLY
  -- ============================================
  SELECT id INTO diane_martinez_id
  FROM agents
  WHERE eleven_agent_id = 'agent_9701kfgy2ptff7x8je2fcca13jp1'
  LIMIT 1;

  IF diane_martinez_id IS NOT NULL THEN
    -- Remove from Solar
    DELETE FROM agent_industries
    WHERE agent_id = diane_martinez_id
      AND industry_id = solar_industry_id;
    
    -- Ensure assigned to Roofing ONLY
    DELETE FROM agent_industries
    WHERE agent_id = diane_martinez_id
      AND industry_id != roofing_industry_id;
    
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (diane_martinez_id, roofing_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- ============================================
  -- JENNIFER WALSH - Should be in Solar ONLY (remove from Roofing)
  -- ============================================
  SELECT id INTO jennifer_walsh_id
  FROM agents
  WHERE eleven_agent_id = 'agent_2701kg2yvease7b89h6nx6p1eqjy'
  LIMIT 1;

  IF jennifer_walsh_id IS NOT NULL THEN
    -- Remove from Roofing
    DELETE FROM agent_industries
    WHERE agent_id = jennifer_walsh_id
      AND industry_id = roofing_industry_id;
    
    -- Ensure assigned to Solar ONLY
    DELETE FROM agent_industries
    WHERE agent_id = jennifer_walsh_id
      AND industry_id != solar_industry_id;
    
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (jennifer_walsh_id, solar_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- ============================================
  -- ENSURE ALL ROOFING-SPECIFIC AGENTS ARE ONLY IN ROOFING
  -- ============================================
  
  -- Lewis McArthur - I'm Not Interested (Roofing)
  UPDATE agent_industries
  SET industry_id = roofing_industry_id
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_4701kfgxhm6bff0949sm66mr8n21'
  )
  AND industry_id != roofing_industry_id;
  
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_4701kfgxhm6bff0949sm66mr8n21'
  )
  AND industry_id != roofing_industry_id;

  -- Mark Patterson - My Roof is Fine (Roofing)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_3401kfgxgp5cfgkbt18dsedj21f1'
  )
  AND industry_id != roofing_industry_id;

  -- Kevin Anderson - I Already Have Someone (Roofing)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_9201kfgy0r49fc09xn6t28bcr7n5'
  )
  AND industry_id != roofing_industry_id;

  -- Lisa Martinez - My Insurance Won't Cover It (Roofing)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_3801kfgy1qw9eyxa31hxdy66syrm'
  )
  AND industry_id != roofing_industry_id;

  -- David Kim - How Much Does a Roof Cost? (Roofing)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_3201kfgxs63qf3yrz6spva0xmn76'
  )
  AND industry_id != roofing_industry_id;

  -- Carlos Mendez - I Just Had My Roof Done (Roofing)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_6801kfgxt1bxfzvrc1xatssc5f1m'
  )
  AND industry_id != roofing_industry_id;

  -- Harold Stevens - I Don't Trust Door-to-Door Roofers (Roofing)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_7201kfgy3kgeexwvkw15c30n3q3n'
  )
  AND industry_id != roofing_industry_id;

  -- Patricia Wells - I Need to Talk to My Spouse (Roofing)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_2001kfgxefjcefk9r6s1m5vkfzxn'
  )
  AND industry_id != roofing_industry_id;

  -- Tom Bradley - I'll Call You When I Need a Roof (Roofing)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_3001kfgxy6vfe3wbsjeqpczh4gje'
  )
  AND industry_id != roofing_industry_id;

END $$;

-- Add comment
COMMENT ON TABLE agent_industries IS 'Junction table linking agents to industries. Migration 176 ensures roofing-specific agents are ONLY assigned to roofing industry.';
