-- Update all pest control agents with their correct ElevenLabs agent IDs
-- Ensure all 9 pest agents exist with correct IDs and are linked to pest industry only

DO $$
DECLARE
  pest_industry_id UUID;
BEGIN
  -- Get pest industry ID
  SELECT id INTO pest_industry_id FROM industries WHERE slug = 'pest';
  
  IF pest_industry_id IS NULL THEN
    RAISE EXCEPTION 'Pest industry not found';
  END IF;

  -- 1. I Already Have a Pest Guy - Dan Mitchell
  UPDATE agents
  SET eleven_agent_id = 'agent_7801kfgwtwrnfjn998jh1xztrgen'
  WHERE name = 'I Already Have a Pest Guy'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = pest_industry_id
    );

  -- 2. I Don't Have Any Bugs - Rachel Cooper
  UPDATE agents
  SET eleven_agent_id = 'agent_5901kfgwvwq1e49smdr13zc3mwj0'
  WHERE name = 'I Don''t Have Any Bugs'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = pest_industry_id
    );

  -- 3. I'm Renting/Don't Own - Tyler Jackson
  UPDATE agents
  SET eleven_agent_id = 'agent_9801kfgwyjz8ffkbbr1xscdwxfdt'
  WHERE name = 'I''m Renting/Don''t Own'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = pest_industry_id
    );

  -- 4. I Just Spray Myself - Greg Wilson
  UPDATE agents
  SET eleven_agent_id = 'agent_5601kfgwzpnweks9myh96gy91zea'
  WHERE name = 'I Just Spray Myself'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = pest_industry_id
    );

  -- 5. Send Me Information - Jennifer Lee
  UPDATE agents
  SET eleven_agent_id = 'agent_8501kfgx77bsfd7bjm9nh30g8z4c'
  WHERE name = 'Send Me Information'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = pest_industry_id
    );

  -- 6. We're Selling/Moving Soon - Chris Bennett
  UPDATE agents
  SET eleven_agent_id = 'agent_1201kfgx8761fv7vkygynecyg5y1'
  WHERE name = 'We''re Selling/Moving Soon'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = pest_industry_id
    );

  -- 7. I Have Pets/Kids - Worried About Chemicals - Nicole Rodriguez
  UPDATE agents
  SET eleven_agent_id = 'agent_4901kfgx9acaee6bpmnb0vjhfevx'
  WHERE name = 'I Have Pets/Kids - Worried About Chemicals'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = pest_industry_id
    );

  -- 8. Bad Timing - Call Me Back Later - Mike Sullivan
  UPDATE agents
  SET eleven_agent_id = 'agent_3801kfgxa5v1fg9van0enjj6qf3p'
  WHERE name = 'Bad Timing - Call Me Back Later'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = pest_industry_id
    );

  -- 9. What's the Price? - Vincent "Vinny" Caruso (already updated in migration 163)
  UPDATE agents
  SET eleven_agent_id = 'agent_4701kg2tk5d9f5ksab7r3e7q9t1b'
  WHERE name = 'What''s the Price?'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = pest_industry_id
    );

  -- Ensure all pest agents are active
  UPDATE agents
  SET is_active = TRUE
  WHERE id IN (
    SELECT agent_id FROM agent_industries WHERE industry_id = pest_industry_id
  )
  AND name IN (
    'I Already Have a Pest Guy',
    'I Don''t Have Any Bugs',
    'I''m Renting/Don''t Own',
    'I Just Spray Myself',
    'Send Me Information',
    'We''re Selling/Moving Soon',
    'I Have Pets/Kids - Worried About Chemicals',
    'Bad Timing - Call Me Back Later',
    'What''s the Price?'
  );

END $$;
