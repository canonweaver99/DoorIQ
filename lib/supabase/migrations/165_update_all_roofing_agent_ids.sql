-- Update all roofing agents with their correct ElevenLabs agent IDs
-- Ensure all 10 roofing agents exist with correct IDs and are linked to roofing industry only

DO $$
DECLARE
  roofing_industry_id UUID;
BEGIN
  -- Get roofing industry ID
  SELECT id INTO roofing_industry_id FROM industries WHERE slug = 'roofing';
  
  IF roofing_industry_id IS NULL THEN
    RAISE EXCEPTION 'Roofing industry not found';
  END IF;

  -- 1. I Need to Talk to My Spouse - Patricia Wells
  UPDATE agents
  SET eleven_agent_id = 'agent_2001kfgxefjcefk9r6s1m5vkfzxn'
  WHERE name = 'I Need to Talk to My Spouse'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = roofing_industry_id
    );

  -- 2. My Roof is Fine - Mark Patterson
  UPDATE agents
  SET eleven_agent_id = 'agent_3401kfgxgp5cfgkbt18dsedj21f1'
  WHERE name = 'My Roof is Fine'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = roofing_industry_id
    );

  -- 3. I'm Not Interested - Frank Rodriguez
  UPDATE agents
  SET eleven_agent_id = 'agent_4701kfgxhm6bff0949sm66mr8n21'
  WHERE name = 'I''m Not Interested'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = roofing_industry_id
    );

  -- 4. How Much Does a Roof Cost? - David Kim
  UPDATE agents
  SET eleven_agent_id = 'agent_3201kfgxs63qf3yrz6spva0xmn76'
  WHERE name = 'How Much Does a Roof Cost?'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = roofing_industry_id
    );

  -- 5. I Just Had My Roof Done - Carlos Mendez
  UPDATE agents
  SET eleven_agent_id = 'agent_6801kfgxt1bxfzvrc1xatssc5f1m'
  WHERE name = 'I Just Had My Roof Done'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = roofing_industry_id
    );

  -- 6. I'll Call You When I Need a Roof - Tom Bradley
  UPDATE agents
  SET eleven_agent_id = 'agent_3001kfgxy6vfe3fe3wbsjeqpczh4gje'
  WHERE name = 'I''ll Call You When I Need a Roof'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = roofing_industry_id
    );

  -- 7. I Already Have Someone - Kevin Anderson
  UPDATE agents
  SET eleven_agent_id = 'agent_9201kfgy0r49fc09xn6t28bcr7n5'
  WHERE name = 'I Already Have Someone'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = roofing_industry_id
    );

  -- 8. My Insurance Won't Cover It - Lisa Martinez
  UPDATE agents
  SET eleven_agent_id = 'agent_3801kfgy1qw9eyxa31hxdy66syrm'
  WHERE name = 'My Insurance Won''t Cover It'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = roofing_industry_id
    );

  -- 9. I'm Selling Soon - Robert Williams
  UPDATE agents
  SET eleven_agent_id = 'agent_9701kfgy2ptff7x8je2fcca13jp1'
  WHERE name = 'I''m Selling Soon'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = roofing_industry_id
    );

  -- 10. I Don't Trust Door-to-Door Roofers - Harold Stevens
  UPDATE agents
  SET eleven_agent_id = 'agent_7201kfgy3kgeexwvkw15c30n3q3n'
  WHERE name = 'I Don''t Trust Door-to-Door Roofers'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = roofing_industry_id
    );

  -- Ensure all roofing agents are active
  UPDATE agents
  SET is_active = TRUE
  WHERE id IN (
    SELECT agent_id FROM agent_industries WHERE industry_id = roofing_industry_id
  )
  AND name IN (
    'I Need to Talk to My Spouse',
    'My Roof is Fine',
    'I''m Not Interested',
    'How Much Does a Roof Cost?',
    'I Just Had My Roof Done',
    'I''ll Call You When I Need a Roof',
    'I Already Have Someone',
    'My Insurance Won''t Cover It',
    'I''m Selling Soon',
    'I Don''t Trust Door-to-Door Roofers'
  );

END $$;
