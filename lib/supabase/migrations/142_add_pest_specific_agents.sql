-- Add 10 new pest control specific agent personas
-- These are placeholder agents that will be built out with ElevenLabs agent IDs later

-- Use DO block to handle insert/update logic since name doesn't have unique constraint
DO $$
BEGIN
  -- Insert or update each agent
  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'I Already Have a Pest Guy') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'I Already Have a Pest Guy',
      'Smokescreen/Real objection - Most common (60%+). They do have someone, but haven''t compared prices in years. What it means: "I''m comfortable, convince me to switch". Overcome by: Finding gaps in current service, better pricing, added value.',
      'placeholder_pest_001',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Smokescreen/Real objection - Most common (60%+). They do have someone, but haven''t compared prices in years. What it means: "I''m comfortable, convince me to switch". Overcome by: Finding gaps in current service, better pricing, added value.',
      eleven_agent_id = 'placeholder_pest_001',
      is_active = TRUE
    WHERE name = 'I Already Have a Pest Guy';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'I Don''t Have Any Bugs') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'I Don''t Have Any Bugs',
      'Smokescreen - Very common (40%+). They don''t see bugs RIGHT NOW, so they don''t think they need service. What it means: "Why would I pay for something I don''t need?". Overcome by: Preventative value, seasonal pests, future problems, property protection.',
      'placeholder_pest_002',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Smokescreen - Very common (40%+). They don''t see bugs RIGHT NOW, so they don''t think they need service. What it means: "Why would I pay for something I don''t need?". Overcome by: Preventative value, seasonal pests, future problems, property protection.',
      eleven_agent_id = 'placeholder_pest_002',
      is_active = TRUE
    WHERE name = 'I Don''t Have Any Bugs';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'How Much Is It?') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'How Much Is It?',
      'Smokescreen/Qualification - Very common (50%+). They want to disqualify you quickly or they''re price shopping. What it means: "Give me a reason to say no" OR genuinely price-sensitive. Overcome by: Building value first, discovering their situation, then anchoring price to value.',
      'placeholder_pest_003',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Smokescreen/Qualification - Very common (50%+). They want to disqualify you quickly or they''re price shopping. What it means: "Give me a reason to say no" OR genuinely price-sensitive. Overcome by: Building value first, discovering their situation, then anchoring price to value.',
      eleven_agent_id = 'placeholder_pest_003',
      is_active = TRUE
    WHERE name = 'How Much Is It?';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'I Need to Talk to My Spouse') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'I Need to Talk to My Spouse',
      'Smokescreen/Real objection - Very common (40%+). Sometimes legitimate, often an easy exit strategy. What it means: "I''m not the decision maker" OR "I want you to leave". Overcome by: Getting spouse on phone, leaving info for callback, booking follow-up time.',
      'placeholder_pest_004',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Smokescreen/Real objection - Very common (40%+). Sometimes legitimate, often an easy exit strategy. What it means: "I''m not the decision maker" OR "I want you to leave". Overcome by: Getting spouse on phone, leaving info for callback, booking follow-up time.',
      eleven_agent_id = 'placeholder_pest_004',
      is_active = TRUE
    WHERE name = 'I Need to Talk to My Spouse';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'I''m Renting/Don''t Own') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'I''m Renting/Don''t Own',
      'Real objection/Disqualifier - Common (20-30%). Landlord handles pest control OR they don''t want to pay for something temporary. What it means: "This isn''t my responsibility" OR "I''m not invested in this property". Overcome by: Offering month-to-month, emphasizing personal comfort/health, landlord doesn''t cover all pests.',
      'placeholder_pest_005',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Real objection/Disqualifier - Common (20-30%). Landlord handles pest control OR they don''t want to pay for something temporary. What it means: "This isn''t my responsibility" OR "I''m not invested in this property". Overcome by: Offering month-to-month, emphasizing personal comfort/health, landlord doesn''t cover all pests.',
      eleven_agent_id = 'placeholder_pest_005',
      is_active = TRUE
    WHERE name = 'I''m Renting/Don''t Own';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'I Just Spray Myself') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'I Just Spray Myself',
      'Real objection/DIY mindset - Common (25%+). They''re handling it themselves and think it''s working. What it means: "I''m cheap/handy and don''t see the value". Overcome by: Professional products vs consumer grade, time value, hard-to-reach areas, warranty.',
      'placeholder_pest_006',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Real objection/DIY mindset - Common (25%+). They''re handling it themselves and think it''s working. What it means: "I''m cheap/handy and don''t see the value". Overcome by: Professional products vs consumer grade, time value, hard-to-reach areas, warranty.',
      eleven_agent_id = 'placeholder_pest_006',
      is_active = TRUE
    WHERE name = 'I Just Spray Myself';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'Send Me Information') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'Send Me Information',
      'Smokescreen - Very common (35%+). Polite way to get you to leave without saying no. What it means: "I''m not interested but I''m too nice to tell you". Overcome by: "What specific questions do you have?", offering to answer now vs later, trial close.',
      'placeholder_pest_007',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Smokescreen - Very common (35%+). Polite way to get you to leave without saying no. What it means: "I''m not interested but I''m too nice to tell you". Overcome by: "What specific questions do you have?", offering to answer now vs later, trial close.',
      eleven_agent_id = 'placeholder_pest_007',
      is_active = TRUE
    WHERE name = 'Send Me Information';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'We''re Selling/Moving Soon') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'We''re Selling/Moving Soon',
      'Smokescreen/Real objection - Moderate (15-20%). Sometimes true, often an excuse. What it means: "I don''t want to commit to anything" OR genuinely leaving. Overcome by: Month-to-month service, helping sell house (no pests = higher value), transferable service.',
      'placeholder_pest_008',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Smokescreen/Real objection - Moderate (15-20%). Sometimes true, often an excuse. What it means: "I don''t want to commit to anything" OR genuinely leaving. Overcome by: Month-to-month service, helping sell house (no pests = higher value), transferable service.',
      eleven_agent_id = 'placeholder_pest_008',
      is_active = TRUE
    WHERE name = 'We''re Selling/Moving Soon';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'I Have Pets/Kids - Worried About Chemicals') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'I Have Pets/Kids - Worried About Chemicals',
      'Real concern/Objection - Common (20-25%). Legitimate safety concern, especially with young kids or pets. What it means: "I care more about safety than bugs". Overcome by: Pet/kid-safe products, application methods, timing (spray when they''re not home), certifications.',
      'placeholder_pest_009',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Real concern/Objection - Common (20-25%). Legitimate safety concern, especially with young kids or pets. What it means: "I care more about safety than bugs". Overcome by: Pet/kid-safe products, application methods, timing (spray when they''re not home), certifications.',
      eleven_agent_id = 'placeholder_pest_009',
      is_active = TRUE
    WHERE name = 'I Have Pets/Kids - Worried About Chemicals';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'Bad Timing - Call Me Back Later') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'Bad Timing - Call Me Back Later',
      'Smokescreen - Common (20%+). Rarely actually about timing, usually just want you gone. What it means: "I''m busy right now" OR "I''m not interested but don''t want confrontation". Overcome by: "Just take 60 seconds - when''s the last time you had a pest issue?", booking specific callback time.',
      'placeholder_pest_010',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Smokescreen - Common (20%+). Rarely actually about timing, usually just want you gone. What it means: "I''m busy right now" OR "I''m not interested but don''t want confrontation". Overcome by: "Just take 60 seconds - when''s the last time you had a pest issue?", booking specific callback time.',
      eleven_agent_id = 'placeholder_pest_010',
      is_active = TRUE
    WHERE name = 'Bad Timing - Call Me Back Later';
  END IF;
END $$;

-- Assign all these new agents to pest control industry only
INSERT INTO agent_industries (agent_id, industry_id)
SELECT a.id, i.id
FROM agents a
CROSS JOIN industries i
WHERE a.name IN (
  'I Already Have a Pest Guy',
  'I Don''t Have Any Bugs',
  'How Much Is It?',
  'I Need to Talk to My Spouse',
  'I''m Renting/Don''t Own',
  'I Just Spray Myself',
  'Send Me Information',
  'We''re Selling/Moving Soon',
  'I Have Pets/Kids - Worried About Chemicals',
  'Bad Timing - Call Me Back Later',
  'Angry Indian'
)
  AND i.slug = 'pest'
  AND a.is_active = true
ON CONFLICT (agent_id, industry_id) DO NOTHING;
