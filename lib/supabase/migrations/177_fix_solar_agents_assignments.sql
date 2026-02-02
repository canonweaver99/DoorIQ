-- Fix solar agent assignments - ensure solar-specific agents are ONLY in solar
-- Remove any incorrect assignments and ensure correct ones are in place

DO $$
DECLARE
  solar_industry_id UUID;
  roofing_industry_id UUID;
  fiber_industry_id UUID;
  windows_industry_id UUID;
  pest_industry_id UUID;
BEGIN
  -- Get industry IDs
  SELECT id INTO solar_industry_id FROM industries WHERE slug = 'solar';
  SELECT id INTO roofing_industry_id FROM industries WHERE slug = 'roofing';
  SELECT id INTO fiber_industry_id FROM industries WHERE slug = 'fiber';
  SELECT id INTO windows_industry_id FROM industries WHERE slug = 'windows';
  SELECT id INTO pest_industry_id FROM industries WHERE slug = 'pest';
  
  IF solar_industry_id IS NULL THEN
    RAISE EXCEPTION 'Solar industry not found';
  END IF;

  -- ============================================
  -- ENSURE ALL SOLAR-SPECIFIC AGENTS ARE ONLY IN SOLAR
  -- ============================================
  
  -- Gary Thompson - I'm Not Interested in Solar (Solar ONLY)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_2101kfgybvm0fz1shb4msy1q5qxz'
  )
  AND industry_id != solar_industry_id;

  -- Brian Walsh - Solar is Too Expensive (Solar ONLY)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_1501kfgycw6wff3vd46tnzjr8xkb'
  )
  AND industry_id != solar_industry_id;

  -- Sarah Chen - My Electric Bill is Too Low (Solar ONLY)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_0501kfgyh9vrea4v9sb923t6vtfv'
  )
  AND industry_id != solar_industry_id;

  -- David Martinez - What If It Doesn't Work? (Solar ONLY)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_1801kfgyj8hxf4p91mg5tfpwq9pp'
  )
  AND industry_id != solar_industry_id;

  -- Robert Jenkins - My Roof is Too Old (Solar ONLY)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_0201kfgymyrpe6yvb7f0ay8efd72'
  )
  AND industry_id != solar_industry_id;

  -- Linda Morrison - I've Heard Bad Things About Solar (Solar ONLY)
  -- Note: There's a different Linda Morrison in Fiber - that's fine, they're different agents
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_0901kfgyntt4ekz9xfj3q5srk3sh'
  )
  AND industry_id != solar_industry_id;

  -- Terrell Washington - I Don't Qualify (Solar ONLY)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_7401kg2vf3twe1xr9d66asfc43sv'
  )
  AND industry_id != solar_industry_id;

  -- Michelle Torres - I Need to Talk to My Spouse (Solar ONLY)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_9101kfgy6d0jft18a06r0zj19jp1'
  )
  AND industry_id != solar_industry_id;

  -- James Porter - How Much Does It Cost? (Solar ONLY)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_5001kfgygawzf3z9prjqkqv1wj85'
  )
  AND industry_id != solar_industry_id;

  -- Jennifer Walsh - I'm Selling Soon (Solar ONLY)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_2701kg2yvease7b89h6nx6p1eqjy'
  )
  AND industry_id != solar_industry_id;

  -- Ensure all solar agents are assigned to Solar
  INSERT INTO agent_industries (agent_id, industry_id)
  SELECT a.id, solar_industry_id
  FROM agents a
  WHERE a.eleven_agent_id IN (
    'agent_2101kfgybvm0fz1shb4msy1q5qxz', -- Gary Thompson
    'agent_1501kfgycw6wff3vd46tnzjr8xkb', -- Brian Walsh
    'agent_0501kfgyh9vrea4v9sb923t6vtfv', -- Sarah Chen
    'agent_1801kfgyj8hxf4p91mg5tfpwq9pp', -- David Martinez
    'agent_0201kfgymyrpe6yvb7f0ay8efd72', -- Robert Jenkins
    'agent_0901kfgyntt4ekz9xfj3q5srk3sh', -- Linda Morrison (Solar)
    'agent_7401kg2vf3twe1xr9d66asfc43sv', -- Terrell Washington
    'agent_9101kfgy6d0jft18a06r0zj19jp1', -- Michelle Torres
    'agent_5001kfgygawzf3z9prjqkqv1wj85', -- James Porter
    'agent_2701kg2yvease7b89h6nx6p1eqjy'  -- Jennifer Walsh
  )
  AND a.is_active = true
  ON CONFLICT (agent_id, industry_id) DO NOTHING;

END $$;

-- Add comment
COMMENT ON TABLE agent_industries IS 'Junction table linking agents to industries. Migration 177 ensures solar-specific agents are ONLY assigned to solar industry.';
