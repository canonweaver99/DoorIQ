-- Add 10 new fiber internet specific agent personas
-- These are placeholder agents that will be built out with ElevenLabs agent IDs later

DO $$
BEGIN
  -- Insert or update each agent
  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'I Already Have Internet') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'I Already Have Internet',
      'Smokescreen/Real objection - Most common (70%+). They have service and don''t see a reason to switch. What it means: "I''m comfortable with what I have, convince me why I should change". Overcome by: Finding pain points (slow speeds, price hikes, outages), comparing speeds/price, finding service gaps.',
      'placeholder_fiber_001',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Smokescreen/Real objection - Most common (70%+). They have service and don''t see a reason to switch. What it means: "I''m comfortable with what I have, convince me why I should change". Overcome by: Finding pain points (slow speeds, price hikes, outages), comparing speeds/price, finding service gaps.',
      eleven_agent_id = 'placeholder_fiber_001',
      is_active = TRUE
    WHERE name = 'I Already Have Internet';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'I''m in a Contract') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'I''m in a Contract',
      'Real objection - Very common (50%+). Locked in for 12-24 months with early termination fees. What it means: "Even if I wanted to switch, I can''t afford to break my contract". Overcome by: Pre-qualifying for when contract ends, buyout offers, showing long-term savings outweigh ETF.',
      'placeholder_fiber_002',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Real objection - Very common (50%+). Locked in for 12-24 months with early termination fees. What it means: "Even if I wanted to switch, I can''t afford to break my contract". Overcome by: Pre-qualifying for when contract ends, buyout offers, showing long-term savings outweigh ETF.',
      eleven_agent_id = 'placeholder_fiber_002',
      is_active = TRUE
    WHERE name = 'I''m in a Contract';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'How Much Is It?') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'How Much Is It?',
      'Smokescreen/Qualification - Very common (60%+). Want to compare to current bill or disqualify you quickly. What it means: "If you''re more expensive, I''m out" OR price shopping. Overcome by: Asking what they pay now first, building value (speeds, reliability), showing total cost over time.',
      'placeholder_fiber_003',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Smokescreen/Qualification - Very common (60%+). Want to compare to current bill or disqualify you quickly. What it means: "If you''re more expensive, I''m out" OR price shopping. Overcome by: Asking what they pay now first, building value (speeds, reliability), showing total cost over time.',
      eleven_agent_id = 'placeholder_fiber_003',
      is_active = TRUE
    WHERE name = 'How Much Is It?';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'I''m Happy With What I Have') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'I''m Happy With What I Have',
      'Smokescreen - Very common (50%+). Internet works "well enough" - they don''t know what they''re missing. What it means: "It''s not broken, why fix it?" OR "Leave me alone". Overcome by: Uncovering hidden pain (buffering, lag, slowdowns at night), work-from-home needs, multiple users.',
      'placeholder_fiber_004',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Smokescreen - Very common (50%+). Internet works "well enough" - they don''t know what they''re missing. What it means: "It''s not broken, why fix it?" OR "Leave me alone". Overcome by: Uncovering hidden pain (buffering, lag, slowdowns at night), work-from-home needs, multiple users.',
      eleven_agent_id = 'placeholder_fiber_004',
      is_active = TRUE
    WHERE name = 'I''m Happy With What I Have';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'I Need to Talk to My Spouse') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'I Need to Talk to My Spouse',
      'Smokescreen/Real objection - Very common (45%+). Joint decision for household service, or easy exit. What it means: "I can''t decide this alone" OR "I want you to leave". Overcome by: Getting spouse on phone/FaceTime, leaving info with callback time, both-present appointments.',
      'placeholder_fiber_005',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Smokescreen/Real objection - Very common (45%+). Joint decision for household service, or easy exit. What it means: "I can''t decide this alone" OR "I want you to leave". Overcome by: Getting spouse on phone/FaceTime, leaving info with callback time, both-present appointments.',
      eleven_agent_id = 'placeholder_fiber_005',
      is_active = TRUE
    WHERE name = 'I Need to Talk to My Spouse';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'I Just Signed Up') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'I Just Signed Up',
      'Real objection/Timing issue - Common (20-25%). Literally just got new service, fresh contract. What it means: "Worst possible timing - I''m locked in and just went through setup hassle". Overcome by: Getting contract end date, pre-qualifying for future, planting seed for when promo ends.',
      'placeholder_fiber_006',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Real objection/Timing issue - Common (20-25%). Literally just got new service, fresh contract. What it means: "Worst possible timing - I''m locked in and just went through setup hassle". Overcome by: Getting contract end date, pre-qualifying for future, planting seed for when promo ends.',
      eleven_agent_id = 'placeholder_fiber_006',
      is_active = TRUE
    WHERE name = 'I Just Signed Up';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'I Don''t Want to Deal With Switching') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'I Don''t Want to Deal With Switching',
      'Real objection - Hassle factor - Common (30%+). Switching seems like too much work - calling old company, scheduling install, potential downtime. What it means: "The pain of switching outweighs the benefit you''re offering". Overcome by: Making it easy (handle cancellation, same-day install, no service gap), emphasizing white-glove service.',
      'placeholder_fiber_007',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Real objection - Hassle factor - Common (30%+). Switching seems like too much work - calling old company, scheduling install, potential downtime. What it means: "The pain of switching outweighs the benefit you''re offering". Overcome by: Making it easy (handle cancellation, same-day install, no service gap), emphasizing white-glove service.',
      eleven_agent_id = 'placeholder_fiber_007',
      is_active = TRUE
    WHERE name = 'I Don''t Want to Deal With Switching';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'My Internet Works Fine') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'My Internet Works Fine',
      'Smokescreen - Common (40%+). They don''t experience obvious problems or don''t know their internet is slow. What it means: "I don''t see the problem, so why would I switch?". Overcome by: Asking about specific scenarios (work calls, gaming, streaming), comparing speeds, future-proofing.',
      'placeholder_fiber_008',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Smokescreen - Common (40%+). They don''t experience obvious problems or don''t know their internet is slow. What it means: "I don''t see the problem, so why would I switch?". Overcome by: Asking about specific scenarios (work calls, gaming, streaming), comparing speeds, future-proofing.',
      eleven_agent_id = 'placeholder_fiber_008',
      is_active = TRUE
    WHERE name = 'My Internet Works Fine';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'What''s the Catch?') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'What''s the Catch?',
      'Skepticism/Real concern - Common (25-30%). Been burned before by hidden fees, price hikes after promo, equipment charges. What it means: "I don''t trust you - everyone has hidden costs". Overcome by: Full transparency upfront, price lock guarantees, no hidden fees script, showing total monthly cost.',
      'placeholder_fiber_009',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Skepticism/Real concern - Common (25-30%). Been burned before by hidden fees, price hikes after promo, equipment charges. What it means: "I don''t trust you - everyone has hidden costs". Overcome by: Full transparency upfront, price lock guarantees, no hidden fees script, showing total monthly cost.',
      eleven_agent_id = 'placeholder_fiber_009',
      is_active = TRUE
    WHERE name = 'What''s the Catch?';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'I''m Moving Soon') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'I''m Moving Soon',
      'Smokescreen/Real objection - Moderate (15-20%). Sometimes true, often an excuse to avoid commitment. What it means: "Why would I set up service if I''m leaving?" OR just an easy out. Overcome by: No contract/month-to-month options, transferable service, short-term solution until move.',
      'placeholder_fiber_010',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Smokescreen/Real objection - Moderate (15-20%). Sometimes true, often an excuse to avoid commitment. What it means: "Why would I set up service if I''m leaving?" OR just an easy out. Overcome by: No contract/month-to-month options, transferable service, short-term solution until move.',
      eleven_agent_id = 'placeholder_fiber_010',
      is_active = TRUE
    WHERE name = 'I''m Moving Soon';
  END IF;
END $$;

-- Assign all these new agents to fiber internet industry only
INSERT INTO agent_industries (agent_id, industry_id)
SELECT a.id, i.id
FROM agents a
CROSS JOIN industries i
WHERE a.name IN (
  'I Already Have Internet',
  'I''m in a Contract',
  'How Much Is It?',
  'I''m Happy With What I Have',
  'I Need to Talk to My Spouse',
  'I Just Signed Up',
  'I Don''t Want to Deal With Switching',
  'My Internet Works Fine',
  'What''s the Catch?',
  'I''m Moving Soon',
  'Angry Indian'
)
  AND i.slug = 'fiber'
  AND a.is_active = true
ON CONFLICT (agent_id, industry_id) DO NOTHING;

-- Remove all other agents from fiber industry except these new ones
DELETE FROM agent_industries
WHERE industry_id = (SELECT id FROM industries WHERE slug = 'fiber')
  AND agent_id NOT IN (
    SELECT id FROM agents 
    WHERE name IN (
      'I Already Have Internet',
      'I''m in a Contract',
      'How Much Is It?',
      'I''m Happy With What I Have',
      'I Need to Talk to My Spouse',
      'I Just Signed Up',
      'I Don''t Want to Deal With Switching',
      'My Internet Works Fine',
      'What''s the Catch?',
      'I''m Moving Soon',
      'Angry Indian'
    )
  );
