-- Fix fiber internet agent assignments - ensure fiber-specific agents are ONLY in fiber
-- Remove any incorrect assignments and ensure correct ones are in place

DO $$
DECLARE
  fiber_industry_id UUID;
BEGIN
  -- Get industry IDs
  SELECT id INTO fiber_industry_id FROM industries WHERE slug = 'fiber';
  
  IF fiber_industry_id IS NULL THEN
    RAISE EXCEPTION 'Fiber industry not found';
  END IF;

  -- ============================================
  -- ENSURE ALL FIBER-SPECIFIC AGENTS ARE ONLY IN FIBER
  -- ============================================
  
  -- Daniel Mitchell - I Already Have Internet (Fiber ONLY)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_3401kfgsy2vdfcrb9gesp3zw8jqw'
  )
  AND industry_id != fiber_industry_id;

  -- Amanda Stevens - I didn't sign up for anything (Fiber ONLY)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_0401kfgt10g0f5xbtxm3a7y92p27'
  )
  AND industry_id != fiber_industry_id;

  -- James Wilson - How Much Is It? (Fiber ONLY)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_7301kfgsf649e8jah8qme3csnvpx'
  )
  AND industry_id != fiber_industry_id;

  -- Linda Morrison - I'm Happy With What I Have (Fiber ONLY)
  -- Note: There's a different Linda Morrison in Solar - that's fine, they're different agents
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_0501kfgtdkcxfs28bb022mc5g9bw'
  )
  AND industry_id != fiber_industry_id;

  -- Marcus Johnson - I Just Signed Up (Fiber ONLY)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_8601kfgt8mv3ey09nb14fwbwd3jb'
  )
  AND industry_id != fiber_industry_id;

  -- Kevin Richardson - I Don't Want to Deal With Switching (Fiber ONLY)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_7401kfgt21gtebxt2tasfk46tpyk'
  )
  AND industry_id != fiber_industry_id;

  -- Tom Henderson - My Internet Works Fine (Fiber ONLY)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_5901kfgtcpaneyqs2c7ajb3fnb8w'
  )
  AND industry_id != fiber_industry_id;

  -- "Rob" Davis - What's the Catch? (Fiber ONLY)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_5701kfgt9n2ff06ajk6bfq7974w5'
  )
  AND industry_id != fiber_industry_id;

  -- Sarah Kim - I'm Moving Soon (Fiber ONLY)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_9101kfgtbp2me14t01n0c0nbanw3'
  )
  AND industry_id != fiber_industry_id;

  -- Jessica Martinez - I Need to Talk to My Spouse (Fiber ONLY)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_7201kfgssnt8eb2a8a4kghb421vd'
  )
  AND industry_id != fiber_industry_id;

  -- Ensure all fiber agents are assigned to Fiber
  INSERT INTO agent_industries (agent_id, industry_id)
  SELECT a.id, fiber_industry_id
  FROM agents a
  WHERE a.eleven_agent_id IN (
    'agent_3401kfgsy2vdfcrb9gesp3zw8jqw', -- Daniel Mitchell
    'agent_0401kfgt10g0f5xbtxm3a7y92p27', -- Amanda Stevens
    'agent_7301kfgsf649e8jah8qme3csnvpx', -- James Wilson
    'agent_0501kfgtdkcxfs28bb022mc5g9bw', -- Linda Morrison (Fiber)
    'agent_8601kfgt8mv3ey09nb14fwbwd3jb', -- Marcus Johnson
    'agent_7401kfgt21gtebxt2tasfk46tpyk', -- Kevin Richardson
    'agent_5901kfgtcpaneyqs2c7ajb3fnb8w', -- Tom Henderson
    'agent_5701kfgt9n2ff06ajk6bfq7974w5', -- "Rob" Davis
    'agent_9101kfgtbp2me14t01n0c0nbanw3', -- Sarah Kim
    'agent_7201kfgssnt8eb2a8a4kghb421vd'  -- Jessica Martinez
  )
  AND a.is_active = true
  ON CONFLICT (agent_id, industry_id) DO NOTHING;

END $$;

-- Add comment
COMMENT ON TABLE agent_industries IS 'Junction table linking agents to industries. Migration 180 ensures fiber-specific agents are ONLY assigned to fiber industry.';
