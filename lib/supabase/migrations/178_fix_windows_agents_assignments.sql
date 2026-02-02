-- Fix windows agent assignments - ensure windows-specific agents are ONLY in windows
-- Remove any incorrect assignments and ensure correct ones are in place

DO $$
DECLARE
  windows_industry_id UUID;
BEGIN
  -- Get industry IDs
  SELECT id INTO windows_industry_id FROM industries WHERE slug = 'windows';
  
  IF windows_industry_id IS NULL THEN
    RAISE EXCEPTION 'Windows industry not found';
  END IF;

  -- ============================================
  -- ENSURE ALL WINDOWS-SPECIFIC AGENTS ARE ONLY IN WINDOWS
  -- ============================================
  
  -- Robert Lee - My Windows Are Fine (Windows ONLY)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_5901kg2w2pbke0p81575yq1c6spj'
  )
  AND industry_id != windows_industry_id;

  -- Laura Thompson - What's Wrong With My Current Windows? (Windows ONLY)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_7701kg2wbfn0e7mvw4p69wr13rb4'
  )
  AND industry_id != windows_industry_id;

  -- Maria Gonzalez - I Just Need One or Two Windows (Windows ONLY)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_9901kg2w904weyjv9xjs9sxjzszt'
  )
  AND industry_id != windows_industry_id;

  -- Kellie Adams - That's Too Expensive (Windows ONLY)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_0801kg2w6rdpe2jtdpg6s4ge2xct'
  )
  AND industry_id != windows_industry_id;

  -- Jonathan Wright - I'm Waiting Until... (Windows ONLY)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_7801kg2wc55se38vwwrj6dafec7d'
  )
  AND industry_id != windows_industry_id;

  -- Sherry Green - I'm Selling/Moving Soon (Windows ONLY)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_1401kg2w9r2tf13bwqebxrn9m3g0'
  )
  AND industry_id != windows_industry_id;

  -- Patrick Murphy - I'll Just Do It Myself (Windows ONLY)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_6601kg2wav3hebnvq04zeymzkbhb'
  )
  AND industry_id != windows_industry_id;

  -- Jeffrey Clark - I'm Going to Get Multiple Quotes (Windows ONLY)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_9801kg2w89tqfy3tht3zwjp5w3qc'
  )
  AND industry_id != windows_industry_id;

  -- Angela White - I Need to Talk to My Spouse (Windows ONLY)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_3301kg2vydhnf28s2q2b6thzhfa4'
  )
  AND industry_id != windows_industry_id;

  -- Steve Harry - Not the Right Time / Maybe Next Year (Windows ONLY)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_2601kg2wcsw2f16sw06e5mxaeras'
  )
  AND industry_id != windows_industry_id;

  -- Ensure all windows agents are assigned to Windows
  INSERT INTO agent_industries (agent_id, industry_id)
  SELECT a.id, windows_industry_id
  FROM agents a
  WHERE a.eleven_agent_id IN (
    'agent_5901kg2w2pbke0p81575yq1c6spj', -- Robert Lee
    'agent_7701kg2wbfn0e7mvw4p69wr13rb4', -- Laura Thompson
    'agent_9901kg2w904weyjv9xjs9sxjzszt', -- Maria Gonzalez
    'agent_0801kg2w6rdpe2jtdpg6s4ge2xct', -- Kellie Adams
    'agent_7801kg2wc55se38vwwrj6dafec7d', -- Jonathan Wright
    'agent_1401kg2w9r2tf13bwqebxrn9m3g0', -- Sherry Green
    'agent_6601kg2wav3hebnvq04zeymzkbhb', -- Patrick Murphy
    'agent_9801kg2w89tqfy3tht3zwjp5w3qc', -- Jeffrey Clark
    'agent_3301kg2vydhnf28s2q2b6thzhfa4', -- Angela White
    'agent_2601kg2wcsw2f16sw06e5mxaeras'  -- Steve Harry
  )
  AND a.is_active = true
  ON CONFLICT (agent_id, industry_id) DO NOTHING;

END $$;

-- Add comment
COMMENT ON TABLE agent_industries IS 'Junction table linking agents to industries. Migration 178 ensures windows-specific agents are ONLY assigned to windows industry.';
