-- Update all fiber agents with their correct ElevenLabs agent IDs
-- Ensure all 10 fiber agents exist with correct IDs and are linked to fiber industry only

DO $$
DECLARE
  fiber_industry_id UUID;
BEGIN
  -- Get fiber industry ID
  SELECT id INTO fiber_industry_id FROM industries WHERE slug = 'fiber';
  
  IF fiber_industry_id IS NULL THEN
    RAISE EXCEPTION 'Fiber industry not found';
  END IF;

  -- 1. How Much Is It? - Michael Chen
  UPDATE agents
  SET eleven_agent_id = 'agent_7301kfgsf649e8jah8qme3csnvpx'
  WHERE name = 'How Much Is It?'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = fiber_industry_id
    );

  -- 2. I Need to Talk to My Spouse - Jessica Martinez
  UPDATE agents
  SET eleven_agent_id = 'agent_7201kfgssnt8eb2a8a4kghb421vd'
  WHERE name = 'I Need to Talk to My Spouse'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = fiber_industry_id
    );

  -- 3. I Already Have Internet - Brian Thompson
  UPDATE agents
  SET eleven_agent_id = 'agent_3401kfgsy2vdfcrb9gesp3zw8jqw'
  WHERE name = 'I Already Have Internet'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = fiber_industry_id
    );

  -- 4. I'm in a Contract - Amanda Stevens
  UPDATE agents
  SET eleven_agent_id = 'agent_0401kfgt10g0f5xbtxm3a7y92p27'
  WHERE name = 'I''m in a Contract'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = fiber_industry_id
    );

  -- 5. I Don't Want to Deal With Switching - Kevin Richardson
  UPDATE agents
  SET eleven_agent_id = 'agent_7401kfgt21gtebxt2tasfk46tpyk'
  WHERE name = 'I Don''t Want to Deal With Switching'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = fiber_industry_id
    );

  -- 6. I Just Signed Up - Marcus Johnson
  UPDATE agents
  SET eleven_agent_id = 'agent_8601kfgt8mv3ey09nb14fwbwd3jb'
  WHERE name = 'I Just Signed Up'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = fiber_industry_id
    );

  -- 7. What's the Catch? - Rob Davis
  UPDATE agents
  SET eleven_agent_id = 'agent_5701kfgt9n2ff06ajk6bfq7974w5'
  WHERE name = 'What''s the Catch?'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = fiber_industry_id
    );

  -- 8. I'm Moving Soon - Sarah Kim
  UPDATE agents
  SET eleven_agent_id = 'agent_9101kfgtbp2me14t01n0c0nbanw3'
  WHERE name = 'I''m Moving Soon'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = fiber_industry_id
    );

  -- 9. My Internet Works Fine - Tom Henderson
  UPDATE agents
  SET eleven_agent_id = 'agent_5901kfgtcpaneyqs2c7ajb3fnb8w'
  WHERE name = 'My Internet Works Fine'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = fiber_industry_id
    );

  -- 10. I'm Happy With What I Have - Linda Morrison
  UPDATE agents
  SET eleven_agent_id = 'agent_0501kfgtdkcxfs28bb022mc5g9bw'
  WHERE name = 'I''m Happy With What I Have'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = fiber_industry_id
    );

  -- Ensure all fiber agents are active
  UPDATE agents
  SET is_active = TRUE
  WHERE id IN (
    SELECT agent_id FROM agent_industries WHERE industry_id = fiber_industry_id
  )
  AND name IN (
    'How Much Is It?',
    'I Need to Talk to My Spouse',
    'I Already Have Internet',
    'I''m in a Contract',
    'I Don''t Want to Deal With Switching',
    'I Just Signed Up',
    'What''s the Catch?',
    'I''m Moving Soon',
    'My Internet Works Fine',
    'I''m Happy With What I Have'
  );

END $$;
