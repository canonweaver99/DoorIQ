-- Add 10 new solar specific agent personas
-- These are placeholder agents that will be built out with ElevenLabs agent IDs later

DO $$
BEGIN
  -- Insert or update each agent
  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'I''m Not Interested in Solar') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'I''m Not Interested in Solar',
      'Smokescreen - Most common (65%+). Pre-programmed response to solar reps, haven''t actually considered it. What it means: "I''ve heard this pitch before" OR "Solar reps are annoying". Overcome by: Pattern interrupt ("Not here to sell you solar today"), utility bill angle, neighbor installs, savings calculator.',
      'placeholder_solar_001',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Smokescreen - Most common (65%+). Pre-programmed response to solar reps, haven''t actually considered it. What it means: "I''ve heard this pitch before" OR "Solar reps are annoying". Overcome by: Pattern interrupt ("Not here to sell you solar today"), utility bill angle, neighbor installs, savings calculator.',
      eleven_agent_id = 'placeholder_solar_001',
      is_active = TRUE
    WHERE name = 'I''m Not Interested in Solar';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'Solar is Too Expensive') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'Solar is Too Expensive',
      'Misconception/Real concern - Very common (60%+). Think they need $30k-$50k upfront cash. What it means: "I don''t have that kind of money lying around". Overcome by: $0 down, lower monthly payment than current bill, lease vs buy options, finance terms, it SAVES money not costs.',
      'placeholder_solar_002',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Misconception/Real concern - Very common (60%+). Think they need $30k-$50k upfront cash. What it means: "I don''t have that kind of money lying around". Overcome by: $0 down, lower monthly payment than current bill, lease vs buy options, finance terms, it SAVES money not costs.',
      eleven_agent_id = 'placeholder_solar_002',
      is_active = TRUE
    WHERE name = 'Solar is Too Expensive';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'How Much Does It Cost?') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'How Much Does It Cost?',
      'Smokescreen/Qualification - Very common (55%+). Want a number to disqualify you or compare against what they''ve heard. What it means: "Give me a reason to say no" OR actually price shopping. Overcome by: Can''t quote without seeing bill/roof, focus on savings not cost, showing net monthly payment vs current bill.',
      'placeholder_solar_003',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Smokescreen/Qualification - Very common (55%+). Want a number to disqualify you or compare against what they''ve heard. What it means: "Give me a reason to say no" OR actually price shopping. Overcome by: Can''t quote without seeing bill/roof, focus on savings not cost, showing net monthly payment vs current bill.',
      eleven_agent_id = 'placeholder_solar_003',
      is_active = TRUE
    WHERE name = 'How Much Does It Cost?';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'I Need to Talk to My Spouse') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'I Need to Talk to My Spouse',
      'Smokescreen/Real objection - Very common (60%+). MAJOR household decision, requires both parties, or easy out. What it means: "This is too big for me alone" OR "I want you gone". Overcome by: Only meet with both present, FaceTime spouse, schedule evening appointment, never one-leg a solar deal.',
      'placeholder_solar_004',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Smokescreen/Real objection - Very common (60%+). MAJOR household decision, requires both parties, or easy out. What it means: "This is too big for me alone" OR "I want you gone". Overcome by: Only meet with both present, FaceTime spouse, schedule evening appointment, never one-leg a solar deal.',
      eleven_agent_id = 'placeholder_solar_004',
      is_active = TRUE
    WHERE name = 'I Need to Talk to My Spouse';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'I''m Selling/Moving Soon') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'I''m Selling/Moving Soon',
      'Smokescreen/Real objection - Common (30%+). Sometimes true, often convenient excuse for major commitment. What it means: "Why would I invest in a house I''m leaving?". Overcome by: Solar increases home value ($15k-$20k), transferable agreements, helps house sell faster, buyer assumes payments.',
      'placeholder_solar_005',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Smokescreen/Real objection - Common (30%+). Sometimes true, often convenient excuse for major commitment. What it means: "Why would I invest in a house I''m leaving?". Overcome by: Solar increases home value ($15k-$20k), transferable agreements, helps house sell faster, buyer assumes payments.',
      eleven_agent_id = 'placeholder_solar_005',
      is_active = TRUE
    WHERE name = 'I''m Selling/Moving Soon';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'My Electric Bill is Too Low') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'My Electric Bill is Too Low',
      'Real objection - Disqualifier - Common (25-30%). Bill under $100/month, solar doesn''t make financial sense. What it means: "The savings won''t justify the hassle/commitment". Overcome by: Future usage (EVs, pool, AC, family growth), rising utility rates, small system options, environmental impact angle.',
      'placeholder_solar_006',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Real objection - Disqualifier - Common (25-30%). Bill under $100/month, solar doesn''t make financial sense. What it means: "The savings won''t justify the hassle/commitment". Overcome by: Future usage (EVs, pool, AC, family growth), rising utility rates, small system options, environmental impact angle.',
      eleven_agent_id = 'placeholder_solar_006',
      is_active = TRUE
    WHERE name = 'My Electric Bill is Too Low';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'What If It Doesn''t Work?') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'What If It Doesn''t Work?',
      'Real concern - Lack of understanding - Common (30%+). Don''t understand how solar works or think panels only work in direct sun. What it means: "I don''t trust the technology". Overcome by: Net metering explanation, battery backup options, production guarantees, manufacturer warranties, local climate data.',
      'placeholder_solar_007',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Real concern - Lack of understanding - Common (30%+). Don''t understand how solar works or think panels only work in direct sun. What it means: "I don''t trust the technology". Overcome by: Net metering explanation, battery backup options, production guarantees, manufacturer warranties, local climate data.',
      eleven_agent_id = 'placeholder_solar_007',
      is_active = TRUE
    WHERE name = 'What If It Doesn''t Work?';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'My Roof is Too Old') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'My Roof is Too Old',
      'Real objection - Legitimate concern - Common (25%+). Roof is 15-20+ years old, worried about removing panels later. What it means: "I can''t put solar on a roof I''m about to replace". Overcome by: Free roof inspection, bundled roof + solar, roof replacement included, 25-year system life requires good roof.',
      'placeholder_solar_008',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Real objection - Legitimate concern - Common (25%+). Roof is 15-20+ years old, worried about removing panels later. What it means: "I can''t put solar on a roof I''m about to replace". Overcome by: Free roof inspection, bundled roof + solar, roof replacement included, 25-year system life requires good roof.',
      eleven_agent_id = 'placeholder_solar_008',
      is_active = TRUE
    WHERE name = 'My Roof is Too Old';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'I''ve Heard Bad Things About Solar') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'I''ve Heard Bad Things About Solar',
      'Real concern - Industry reputation - Common (20-25%). Early solar horror stories, shady companies, lease nightmares. What it means: "I don''t trust this industry". Overcome by: Company reputation/reviews, manufacturer warranties, ownership vs lease, realistic expectations, references.',
      'placeholder_solar_009',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Real concern - Industry reputation - Common (20-25%). Early solar horror stories, shady companies, lease nightmares. What it means: "I don''t trust this industry". Overcome by: Company reputation/reviews, manufacturer warranties, ownership vs lease, realistic expectations, references.',
      eleven_agent_id = 'placeholder_solar_009',
      is_active = TRUE
    WHERE name = 'I''ve Heard Bad Things About Solar';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agents WHERE name = 'I Don''t Qualify') THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'I Don''t Qualify',
      'Real objection - Self-disqualification - Moderate (20%+). Bad credit history or assume they won''t qualify. What it means: "Don''t waste your time, I can''t get financing". Overcome by: Multiple financing partners, soft credit check first, lease options with lower requirements, cash purchase option.',
      'placeholder_solar_010',
      TRUE
    );
  ELSE
    UPDATE agents SET
      persona = 'Real objection - Self-disqualification - Moderate (20%+). Bad credit history or assume they won''t qualify. What it means: "Don''t waste your time, I can''t get financing". Overcome by: Multiple financing partners, soft credit check first, lease options with lower requirements, cash purchase option.',
      eleven_agent_id = 'placeholder_solar_010',
      is_active = TRUE
    WHERE name = 'I Don''t Qualify';
  END IF;
END $$;

-- Assign all these new agents to solar industry only
INSERT INTO agent_industries (agent_id, industry_id)
SELECT a.id, i.id
FROM agents a
CROSS JOIN industries i
WHERE a.name IN (
  'I''m Not Interested in Solar',
  'Solar is Too Expensive',
  'How Much Does It Cost?',
  'I Need to Talk to My Spouse',
  'I''m Selling/Moving Soon',
  'My Electric Bill is Too Low',
  'What If It Doesn''t Work?',
  'My Roof is Too Old',
  'I''ve Heard Bad Things About Solar',
  'I Don''t Qualify',
  'Angry Indian'
)
  AND i.slug = 'solar'
  AND a.is_active = true
ON CONFLICT (agent_id, industry_id) DO NOTHING;

-- Remove all other agents from solar industry except these new ones
DELETE FROM agent_industries
WHERE industry_id = (SELECT id FROM industries WHERE slug = 'solar')
  AND agent_id NOT IN (
    SELECT id FROM agents 
    WHERE name IN (
      'I''m Not Interested in Solar',
      'Solar is Too Expensive',
      'How Much Does It Cost?',
      'I Need to Talk to My Spouse',
      'I''m Selling/Moving Soon',
      'My Electric Bill is Too Low',
      'What If It Doesn''t Work?',
      'My Roof is Too Old',
      'I''ve Heard Bad Things About Solar',
      'I Don''t Qualify',
      'Angry Indian'
    )
  );
