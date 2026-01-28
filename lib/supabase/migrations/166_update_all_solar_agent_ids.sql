-- Update all solar agents with their correct ElevenLabs agent IDs
-- Ensure all 9 solar agents exist with correct IDs and are linked to solar industry only

DO $$
DECLARE
  solar_industry_id UUID;
BEGIN
  -- Get solar industry ID
  SELECT id INTO solar_industry_id FROM industries WHERE slug = 'solar';
  
  IF solar_industry_id IS NULL THEN
    RAISE EXCEPTION 'Solar industry not found';
  END IF;

  -- 1. I Need to Talk to My Spouse - Michelle Torres
  UPDATE agents
  SET eleven_agent_id = 'agent_9101kfgy6d0jft18a06r0zj19jp1'
  WHERE name = 'I Need to Talk to My Spouse'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = solar_industry_id
    );

  -- 2. I'm Not Interested in Solar - Gary Thompson
  UPDATE agents
  SET eleven_agent_id = 'agent_2101kfgybvm0fz1shb4msy1q5qxz'
  WHERE name = 'I''m Not Interested in Solar'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = solar_industry_id
    );

  -- 3. Solar is Too Expensive - Brian Walsh
  UPDATE agents
  SET eleven_agent_id = 'agent_1501kfgycw6wff3vd46tnzjr8xkb'
  WHERE name = 'Solar is Too Expensive'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = solar_industry_id
    );

  -- 4. How Much Does It Cost? - James Porter
  UPDATE agents
  SET eleven_agent_id = 'agent_5001kfgygawzf3z9prjqkqv1wj85'
  WHERE name = 'How Much Does It Cost?'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = solar_industry_id
    );

  -- 5. My Electric Bill is Too Low - Sarah Chen
  UPDATE agents
  SET eleven_agent_id = 'agent_0501kfgyh9vrea4v9sb923t6vtfv'
  WHERE name = 'My Electric Bill is Too Low'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = solar_industry_id
    );

  -- 6. What If It Doesn't Work? - David Martinez
  UPDATE agents
  SET eleven_agent_id = 'agent_1801kfgyj8hxf4p91mg5tfpwq9pp'
  WHERE name = 'What If It Doesn''t Work?'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = solar_industry_id
    );

  -- 7. My Roof is Too Old - Robert Jenkins
  UPDATE agents
  SET eleven_agent_id = 'agent_0201kfgymyrpe6yvb7f0ay8efd72'
  WHERE name = 'My Roof is Too Old'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = solar_industry_id
    );

  -- 8. I've Heard Bad Things About Solar - Linda Morrison
  UPDATE agents
  SET eleven_agent_id = 'agent_0901kfgyntt4ekz9xfj3q5srk3sh'
  WHERE name = 'I''ve Heard Bad Things About Solar'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = solar_industry_id
    );

  -- 9. I'm Selling Soon - Diane Martinez (replaced Robert Williams)
  UPDATE agents
  SET eleven_agent_id = 'agent_2701kg2yvease7b89h6nx6p1eqjy'
  WHERE name = 'I''m Selling Soon'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = solar_industry_id
    );

  -- Ensure all solar agents are active
  UPDATE agents
  SET is_active = TRUE
  WHERE id IN (
    SELECT agent_id FROM agent_industries WHERE industry_id = solar_industry_id
  )
  AND name IN (
    'I Need to Talk to My Spouse',
    'I''m Not Interested in Solar',
    'Solar is Too Expensive',
    'How Much Does It Cost?',
    'My Electric Bill is Too Low',
    'What If It Doesn''t Work?',
    'My Roof is Too Old',
    'I''ve Heard Bad Things About Solar',
    'I''m Selling Soon'
  );

END $$;
