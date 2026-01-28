-- Update all windows agents with their correct ElevenLabs agent IDs
-- Ensure all 11 windows agents exist with correct IDs and are linked to windows industry only
-- Note: "How Much Does It Cost?" uses agent_6201kg2w5zfxe0dr1cwnb5qp1416 for Windows

DO $$
DECLARE
  windows_industry_id UUID;
  duplicate_agent_id UUID;
BEGIN
  -- Get windows industry ID
  SELECT id INTO windows_industry_id FROM industries WHERE slug = 'windows';
  
  IF windows_industry_id IS NULL THEN
    RAISE EXCEPTION 'Windows industry not found';
  END IF;

  -- 1. I Need to Talk to My Spouse - Angela White
  UPDATE agents
  SET eleven_agent_id = 'agent_3301kg2vydhnf28s2q2b6thzhfa4'
  WHERE name = 'I Need to Talk to My Spouse'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = windows_industry_id
    );

  -- 2. How Much Does It Cost? - James Porter (Windows uses agent_6201kg2w5zfxe0dr1cwnb5qp1416)
  UPDATE agents
  SET eleven_agent_id = 'agent_6201kg2w5zfxe0dr1cwnb5qp1416'
  WHERE name = 'How Much Does It Cost?'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = windows_industry_id
    );

  -- 3. My Windows Are Fine - Robert Lee
  UPDATE agents
  SET eleven_agent_id = 'agent_5901kg2w2pbke0p81575yq1c6spj'
  WHERE name = 'My Windows Are Fine'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = windows_industry_id
    );

  -- 4. That's Too Expensive - Kellie Adams
  UPDATE agents
  SET eleven_agent_id = 'agent_0801kg2w6rdpe2jtdpg6s4ge2xct'
  WHERE name = 'That''s Too Expensive'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = windows_industry_id
    );

  -- 5. I'm Going to Get Multiple Quotes - Jeffrey Clark
  UPDATE agents
  SET eleven_agent_id = 'agent_9801kg2w89tqfy3tht3zwjp5w3qc'
  WHERE name = 'I''m Going to Get Multiple Quotes'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = windows_industry_id
    );

  -- 6. I Just Need One or Two Windows - Maria Gonzalez
  UPDATE agents
  SET eleven_agent_id = 'agent_9901kg2w904weyjv9xjs9sxjzszt'
  WHERE name = 'I Just Need One or Two Windows'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = windows_industry_id
    );

  -- 7. I'm Selling/Moving Soon - Sherry Green
  UPDATE agents
  SET eleven_agent_id = 'agent_1401kg2w9r2tf13bwqebxrn9m3g0'
  WHERE name = 'I''m Selling/Moving Soon'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = windows_industry_id
    );

  -- 8. I'll Just Do It Myself - Patrick Murphy
  UPDATE agents
  SET eleven_agent_id = 'agent_6601kg2wav3hebnvq04zeymzkbhb'
  WHERE name = 'I''ll Just Do It Myself'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = windows_industry_id
    );

  -- 9. What's Wrong With My Current Windows? - Laura Thompson
  UPDATE agents
  SET eleven_agent_id = 'agent_7701kg2wbfn0e7mvw4p69wr13rb4'
  WHERE name = 'What''s Wrong With My Current Windows?'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = windows_industry_id
    );

  -- 10. I'm Waiting Until... - Jonathan Wright
  UPDATE agents
  SET eleven_agent_id = 'agent_7801kg2wc55se38vwwrj6dafec7d'
  WHERE name = 'I''m Waiting Until...'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = windows_industry_id
    );

  -- 11. Not the Right Time / Maybe Next Year - Steve Harry
  UPDATE agents
  SET eleven_agent_id = 'agent_2601kg2wcsw2f16sw06e5mxaeras'
  WHERE name = 'Not the Right Time / Maybe Next Year'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = windows_industry_id
    );

  -- Ensure all windows agents are active
  UPDATE agents
  SET is_active = TRUE
  WHERE id IN (
    SELECT agent_id FROM agent_industries WHERE industry_id = windows_industry_id
  )
  AND name IN (
    'I Need to Talk to My Spouse',
    'How Much Does It Cost?',
    'My Windows Are Fine',
    'That''s Too Expensive',
    'I''m Going to Get Multiple Quotes',
    'I Just Need One or Two Windows',
    'I''m Selling/Moving Soon',
    'I''ll Just Do It Myself',
    'What''s Wrong With My Current Windows?',
    'I''m Waiting Until...',
    'Not the Right Time / Maybe Next Year'
  );

END $$;
