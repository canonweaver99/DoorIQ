-- Fix pest control agent assignments - ensure pest-specific agents are ONLY in pest
-- Remove any incorrect assignments and ensure correct ones are in place

DO $$
DECLARE
  pest_industry_id UUID;
BEGIN
  -- Get industry IDs
  SELECT id INTO pest_industry_id FROM industries WHERE slug = 'pest';
  
  IF pest_industry_id IS NULL THEN
    RAISE EXCEPTION 'Pest industry not found';
  END IF;

  -- ============================================
  -- ENSURE ALL PEST-SPECIFIC AGENTS ARE ONLY IN PEST
  -- ============================================
  
  -- Dan Mitchell - I Already Have a Pest Guy (Pest ONLY)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_7801kfgwtwrnfjn998jh1xztrgen'
  )
  AND industry_id != pest_industry_id;

  -- Rachel Cooper - I Don't Have Any Bugs (Pest ONLY)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_5901kfgwvwq1e49smdr13zc3mwj0'
  )
  AND industry_id != pest_industry_id;

  -- Tyler Jackson - I'm Renting/Don't Own (Pest ONLY)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_9801kfgwyjz8ffkbbr1xscdwxfdt'
  )
  AND industry_id != pest_industry_id;

  -- Greg Wilson - I Just Spray Myself (Pest ONLY)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_5601kfgwzpnweks9myh96gy91zea'
  )
  AND industry_id != pest_industry_id;

  -- Jennifer Lee - Send Me Information (Pest ONLY)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_8501kfgx77bsfd7bjm9nh30g8z4c'
  )
  AND industry_id != pest_industry_id;

  -- Chris Bennett - We're Selling/Moving Soon (Pest ONLY)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_1201kfgx8761fv7vkygynecyg5y1'
  )
  AND industry_id != pest_industry_id;

  -- Nicole Rodriguez - I Have Pets/Kids - Worried About Chemicals (Pest ONLY)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_4901kfgx9acaee6bpmnb0vjhfevx'
  )
  AND industry_id != pest_industry_id;

  -- Mike Sullivan - Bad Timing - Call Me Back Later (Pest ONLY)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_3801kfgxa5v1fg9van0enjj6qf3p'
  )
  AND industry_id != pest_industry_id;

  -- Vincent "Vinny" Caruso - What's the Price? (Pest ONLY)
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents WHERE eleven_agent_id = 'agent_4701kg2tk5d9f5ksab7r3e7q9t1b'
  )
  AND industry_id != pest_industry_id;

  -- Ensure all pest agents are assigned to Pest
  INSERT INTO agent_industries (agent_id, industry_id)
  SELECT a.id, pest_industry_id
  FROM agents a
  WHERE a.eleven_agent_id IN (
    'agent_7801kfgwtwrnfjn998jh1xztrgen', -- Dan Mitchell
    'agent_5901kfgwvwq1e49smdr13zc3mwj0', -- Rachel Cooper
    'agent_9801kfgwyjz8ffkbbr1xscdwxfdt', -- Tyler Jackson
    'agent_5601kfgwzpnweks9myh96gy91zea', -- Greg Wilson
    'agent_8501kfgx77bsfd7bjm9nh30g8z4c', -- Jennifer Lee
    'agent_1201kfgx8761fv7vkygynecyg5y1', -- Chris Bennett
    'agent_4901kfgx9acaee6bpmnb0vjhfevx', -- Nicole Rodriguez
    'agent_3801kfgxa5v1fg9van0enjj6qf3p', -- Mike Sullivan
    'agent_4701kg2tk5d9f5ksab7r3e7q9t1b'  -- Vincent "Vinny" Caruso
  )
  AND a.is_active = true
  ON CONFLICT (agent_id, industry_id) DO NOTHING;

END $$;

-- Add comment
COMMENT ON TABLE agent_industries IS 'Junction table linking agents to industries. Migration 179 ensures pest-specific agents are ONLY assigned to pest industry.';
