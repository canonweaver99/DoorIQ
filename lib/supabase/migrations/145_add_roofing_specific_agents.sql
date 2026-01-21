-- Add 10 new roofing specific agent personas
-- These are placeholder agents that will be built out with ElevenLabs agent IDs later

DO $$
BEGIN
  -- Insert or update each agent
  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'My Roof is Fine') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'My Roof is Fine',
      'Smokescreen/Real objection - Most common (70%+). They haven''t inspected it or don''t see obvious issues from ground level. What it means: "I don''t see damage, so why would I spend money?". Overcome by: Free inspection offer, storm damage they don''t know about, showing age/lifespan concerns, pointing out visible issues.',
      'placeholder_roofing_001',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Smokescreen/Real objection - Most common (70%+). They haven''t inspected it or don''t see obvious issues from ground level. What it means: "I don''t see damage, so why would I spend money?". Overcome by: Free inspection offer, storm damage they don''t know about, showing age/lifespan concerns, pointing out visible issues.',
      eleven_agent_id = 'placeholder_roofing_001',
      is_active = TRUE
    WHERE name = 'My Roof is Fine';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'I''m Not Interested') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'I''m Not Interested',
      'Smokescreen - Very common (60%+). Roofing reps have bad reputation, they assume you''re pushy/scammy. What it means: "I hate door-to-door roofers" OR "Don''t waste my time". Overcome by: Pattern interrupt ("Not selling anything today"), storm damage canvassing angle, neighbor social proof.',
      'placeholder_roofing_002',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Smokescreen - Very common (60%+). Roofing reps have bad reputation, they assume you''re pushy/scammy. What it means: "I hate door-to-door roofers" OR "Don''t waste my time". Overcome by: Pattern interrupt ("Not selling anything today"), storm damage canvassing angle, neighbor social proof.',
      eleven_agent_id = 'placeholder_roofing_002',
      is_active = TRUE
    WHERE name = 'I''m Not Interested';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'How Much Does a Roof Cost?') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'How Much Does a Roof Cost?',
      'Smokescreen/Real concern - Common (40%+). They''ve heard roofs are expensive ($10k-$30k+) and want to disqualify you. What it means: "This is going to be too expensive" OR price shopping. Overcome by: Can''t quote without inspection, insurance may cover it, financing options, cost of NOT replacing.',
      'placeholder_roofing_003',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Smokescreen/Real concern - Common (40%+). They''ve heard roofs are expensive ($10k-$30k+) and want to disqualify you. What it means: "This is going to be too expensive" OR price shopping. Overcome by: Can''t quote without inspection, insurance may cover it, financing options, cost of NOT replacing.',
      eleven_agent_id = 'placeholder_roofing_003',
      is_active = TRUE
    WHERE name = 'How Much Does a Roof Cost?';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'I Just Had My Roof Done') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'I Just Had My Roof Done',
      'Real objection/Disqualifier - Common (25-30%). Recent replacement or roof is relatively new. What it means: "Worst timing - I literally just spent money on this". Overcome by: Storm damage can happen to new roofs, manufacturer defects, free inspection for peace of mind, get them in CRM for 10+ years.',
      'placeholder_roofing_004',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Real objection/Disqualifier - Common (25-30%). Recent replacement or roof is relatively new. What it means: "Worst timing - I literally just spent money on this". Overcome by: Storm damage can happen to new roofs, manufacturer defects, free inspection for peace of mind, get them in CRM for 10+ years.',
      eleven_agent_id = 'placeholder_roofing_004',
      is_active = TRUE
    WHERE name = 'I Just Had My Roof Done';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'I Need to Talk to My Spouse') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'I Need to Talk to My Spouse',
      'Smokescreen/Real objection - Very common (50%+). Major purchase decision, both need to agree, or easy exit. What it means: "This is a huge decision I can''t make alone" OR "Go away". Overcome by: Getting both present, scheduling appointment when both home, FaceTime spouse, leaving detailed info.',
      'placeholder_roofing_005',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Smokescreen/Real objection - Very common (50%+). Major purchase decision, both need to agree, or easy exit. What it means: "This is a huge decision I can''t make alone" OR "Go away". Overcome by: Getting both present, scheduling appointment when both home, FaceTime spouse, leaving detailed info.',
      eleven_agent_id = 'placeholder_roofing_005',
      is_active = TRUE
    WHERE name = 'I Need to Talk to My Spouse';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'I''ll Call You When I Need a Roof') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'I''ll Call You When I Need a Roof',
      'Smokescreen - Very common (45%+). Polite dismissal - they''re never calling you. What it means: "I''m not interested but trying to be nice". Overcome by: Free inspection now to know WHEN they''ll need it, storm damage urgency, insurance timeline pressure.',
      'placeholder_roofing_006',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Smokescreen - Very common (45%+). Polite dismissal - they''re never calling you. What it means: "I''m not interested but trying to be nice". Overcome by: Free inspection now to know WHEN they''ll need it, storm damage urgency, insurance timeline pressure.',
      eleven_agent_id = 'placeholder_roofing_006',
      is_active = TRUE
    WHERE name = 'I''ll Call You When I Need a Roof';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'I Already Have Someone') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'I Already Have Someone',
      'Smokescreen/Real objection - Common (30%+). They used someone 15 years ago or have a "guy" they''ve never called. What it means: "I''m loyal" OR "I have an easy excuse to say no". Overcome by: Second opinion value, asking when last inspected, insurance claim specialization, storm damage expertise.',
      'placeholder_roofing_007',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Smokescreen/Real objection - Common (30%+). They used someone 15 years ago or have a "guy" they''ve never called. What it means: "I''m loyal" OR "I have an easy excuse to say no". Overcome by: Second opinion value, asking when last inspected, insurance claim specialization, storm damage expertise.',
      eleven_agent_id = 'placeholder_roofing_007',
      is_active = TRUE
    WHERE name = 'I Already Have Someone';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'My Insurance Won''t Cover It') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'My Insurance Won''t Cover It',
      'Real concern/Misconception - Common (35%+). They assume insurance won''t pay or don''t know they can file a claim. What it means: "I can''t afford this out of pocket" OR "I don''t understand insurance claims". Overcome by: Free inspection determines if insurance will cover, storm damage almost always covered, you handle the claim process.',
      'placeholder_roofing_008',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Real concern/Misconception - Common (35%+). They assume insurance won''t pay or don''t know they can file a claim. What it means: "I can''t afford this out of pocket" OR "I don''t understand insurance claims". Overcome by: Free inspection determines if insurance will cover, storm damage almost always covered, you handle the claim process.',
      eleven_agent_id = 'placeholder_roofing_008',
      is_active = TRUE
    WHERE name = 'My Insurance Won''t Cover It';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'I''m Selling Soon') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'I''m Selling Soon',
      'Smokescreen/Real objection - Moderate (20%+). Sometimes true, often an easy excuse. What it means: "Why invest in a house I''m leaving?" OR just want you gone. Overcome by: New roof increases home value/sale price, required for sale inspection, buyer will demand it anyway, insurance requirement.',
      'placeholder_roofing_009',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Smokescreen/Real objection - Moderate (20%+). Sometimes true, often an easy excuse. What it means: "Why invest in a house I''m leaving?" OR just want you gone. Overcome by: New roof increases home value/sale price, required for sale inspection, buyer will demand it anyway, insurance requirement.',
      eleven_agent_id = 'placeholder_roofing_009',
      is_active = TRUE
    WHERE name = 'I''m Selling Soon';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'I Don''t Trust Door-to-Door Roofers') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'I Don''t Trust Door-to-Door Roofers',
      'Real concern - Industry reputation - Common (25-30%). Storm chasers and scammers have ruined D2D roofing reputation. What it means: "You''re probably going to rip me off". Overcome by: Local company proof, references, reviews, certifications, licensed/insured proof, no money upfront, manufacturer warranties.',
      'placeholder_roofing_010',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Real concern - Industry reputation - Common (25-30%). Storm chasers and scammers have ruined D2D roofing reputation. What it means: "You''re probably going to rip me off". Overcome by: Local company proof, references, reviews, certifications, licensed/insured proof, no money upfront, manufacturer warranties.',
      eleven_agent_id = 'placeholder_roofing_010',
      is_active = TRUE
    WHERE name = 'I Don''t Trust Door-to-Door Roofers';
  END IF;
END $$;

-- Assign all these new agents to roofing industry only
INSERT INTO agent_industries (agent_id, industry_id)
SELECT a.id, i.id
FROM agents a
CROSS JOIN industries i
WHERE a.name IN (
  'My Roof is Fine',
  'I''m Not Interested',
  'How Much Does a Roof Cost?',
  'I Just Had My Roof Done',
  'I Need to Talk to My Spouse',
  'I''ll Call You When I Need a Roof',
  'I Already Have Someone',
  'My Insurance Won''t Cover It',
  'I''m Selling Soon',
  'I Don''t Trust Door-to-Door Roofers',
  'Angry Indian'
)
  AND i.slug = 'roofing'
  AND a.is_active = true
ON CONFLICT (agent_id, industry_id) DO NOTHING;

-- Remove all other agents from roofing industry except these new ones
DELETE FROM agent_industries
WHERE industry_id = (SELECT id FROM industries WHERE slug = 'roofing')
  AND agent_id NOT IN (
    SELECT id FROM agents 
    WHERE name IN (
      'My Roof is Fine',
      'I''m Not Interested',
      'How Much Does a Roof Cost?',
      'I Just Had My Roof Done',
      'I Need to Talk to My Spouse',
      'I''ll Call You When I Need a Roof',
      'I Already Have Someone',
      'My Insurance Won''t Cover It',
      'I''m Selling Soon',
      'I Don''t Trust Door-to-Door Roofers',
      'Angry Indian'
    )
  );
