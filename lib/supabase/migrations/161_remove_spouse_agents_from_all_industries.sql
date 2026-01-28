-- Remove the 4 spouse agents (Angela White, Jessica Martinez, Patricia Wells, Michelle Torres)
-- from all industries except their specific assigned industry
-- This ensures they don't show up in "All Industries" view

DO $$
DECLARE
  windows_industry_id UUID;
  fiber_industry_id UUID;
  roofing_industry_id UUID;
  solar_industry_id UUID;
  angela_agent_id UUID;
  jessica_agent_id UUID;
  patricia_agent_id UUID;
  michelle_agent_id UUID;
BEGIN
  -- Get industry IDs
  SELECT id INTO windows_industry_id FROM industries WHERE slug = 'windows';
  SELECT id INTO fiber_industry_id FROM industries WHERE slug = 'fiber';
  SELECT id INTO roofing_industry_id FROM industries WHERE slug = 'roofing';
  SELECT id INTO solar_industry_id FROM industries WHERE slug = 'solar';

  -- Find agents by their ElevenLabs agent IDs
  SELECT id INTO angela_agent_id FROM agents WHERE eleven_agent_id = 'agent_3301kg2vydhnf28s2q2b6thzhfa4' LIMIT 1;
  SELECT id INTO jessica_agent_id FROM agents WHERE eleven_agent_id = 'agent_7201kfgssnt8eb2a8a4kghb421vd' LIMIT 1;
  SELECT id INTO patricia_agent_id FROM agents WHERE eleven_agent_id = 'agent_2001kfgxefjcefk9r6s1m5vkfzxn' LIMIT 1;
  SELECT id INTO michelle_agent_id FROM agents WHERE eleven_agent_id = 'agent_9101kfgy6d0jft18a06r0zj19jp1' LIMIT 1;

  -- Remove Angela White (Windows) from all industries except Windows
  IF angela_agent_id IS NOT NULL AND windows_industry_id IS NOT NULL THEN
    DELETE FROM agent_industries
    WHERE agent_id = angela_agent_id
      AND industry_id != windows_industry_id;
    
    -- Ensure she's linked to Windows
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (angela_agent_id, windows_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- Remove Jessica Martinez (Fiber) from all industries except Fiber
  IF jessica_agent_id IS NOT NULL AND fiber_industry_id IS NOT NULL THEN
    DELETE FROM agent_industries
    WHERE agent_id = jessica_agent_id
      AND industry_id != fiber_industry_id;
    
    -- Ensure she's linked to Fiber
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (jessica_agent_id, fiber_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- Remove Patricia Wells (Roofing) from all industries except Roofing
  IF patricia_agent_id IS NOT NULL AND roofing_industry_id IS NOT NULL THEN
    DELETE FROM agent_industries
    WHERE agent_id = patricia_agent_id
      AND industry_id != roofing_industry_id;
    
    -- Ensure she's linked to Roofing
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (patricia_agent_id, roofing_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- Remove Michelle Torres (Solar) from all industries except Solar
  IF michelle_agent_id IS NOT NULL AND solar_industry_id IS NOT NULL THEN
    DELETE FROM agent_industries
    WHERE agent_id = michelle_agent_id
      AND industry_id != solar_industry_id;
    
    -- Ensure she's linked to Solar
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (michelle_agent_id, solar_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

END $$;
