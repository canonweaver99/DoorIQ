-- Replace "How Much Is It?" with "What's the Price?" for pest industry only
-- This creates a new agent specifically for pest while keeping "How Much Is It?" for other industries

DO $$
DECLARE
  pest_industry_id UUID;
  old_agent_id UUID;
  new_agent_id UUID;
BEGIN
  -- Get pest industry ID
  SELECT id INTO pest_industry_id FROM industries WHERE slug = 'pest';
  
  IF pest_industry_id IS NULL THEN
    RAISE EXCEPTION 'Pest industry not found';
  END IF;

  -- Find the existing "How Much Is It?" agent linked to pest
  SELECT a.id INTO old_agent_id
  FROM agents a
  INNER JOIN agent_industries ai ON a.id = ai.agent_id
  WHERE a.name = 'How Much Is It?'
    AND ai.industry_id = pest_industry_id
  LIMIT 1;

  -- Create new "What's the Price?" agent for pest
  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'What''s the Price?') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'What''s the Price?',
      'Smokescreen/Qualification - Very common (50%+). They want to disqualify you quickly or they''re price shopping. What it means: "Give me a reason to say no" OR genuinely price-sensitive. Overcome by: Building value first, discovering their situation, then anchoring price to value.',
      'agent_4701kg2tk5d9f5ksab7r3e7q9t1b',
      TRUE
    )
    RETURNING id INTO new_agent_id;
  ELSE
    SELECT id INTO new_agent_id FROM agents WHERE name = 'What''s the Price?' LIMIT 1;
    -- Update existing agent with new ID
    UPDATE agents
    SET eleven_agent_id = 'agent_4701kg2tk5d9f5ksab7r3e7q9t1b',
        persona = 'Smokescreen/Qualification - Very common (50%+). They want to disqualify you quickly or they''re price shopping. What it means: "Give me a reason to say no" OR genuinely price-sensitive. Overcome by: Building value first, discovering their situation, then anchoring price to value.',
        is_active = TRUE
    WHERE id = new_agent_id;
  END IF;

  -- Link new agent to pest industry
  INSERT INTO agent_industries (agent_id, industry_id)
  VALUES (new_agent_id, pest_industry_id)
  ON CONFLICT (agent_id, industry_id) DO NOTHING;

  -- Remove "How Much Is It?" from pest industry (but keep it for other industries)
  IF old_agent_id IS NOT NULL THEN
    DELETE FROM agent_industries
    WHERE agent_id = old_agent_id
      AND industry_id = pest_industry_id;
  END IF;

END $$;
