-- Fix all agent IDs to match the correct ElevenLabs agent IDs
-- This migration ensures all agents have their correct agent IDs as specified

DO $$
DECLARE
  solar_industry_id UUID;
  roofing_industry_id UUID;
  pest_industry_id UUID;
  windows_industry_id UUID;
  selling_soon_agent_id UUID;
  solar_selling_soon_id UUID;
  roofing_selling_soon_id UUID;
  laura_thompson_id UUID;
  harold_stevens_id UUID;
BEGIN
  -- Get industry IDs
  SELECT id INTO solar_industry_id FROM industries WHERE slug = 'solar';
  SELECT id INTO roofing_industry_id FROM industries WHERE slug = 'roofing';
  SELECT id INTO pest_industry_id FROM industries WHERE slug = 'pest';
  SELECT id INTO windows_industry_id FROM industries WHERE slug = 'windows';
  
  IF solar_industry_id IS NULL THEN
    RAISE EXCEPTION 'Solar industry not found';
  END IF;
  
  IF roofing_industry_id IS NULL THEN
    RAISE EXCEPTION 'Roofing industry not found';
  END IF;
  
  IF pest_industry_id IS NULL THEN
    RAISE EXCEPTION 'Pest industry not found';
  END IF;
  
  IF windows_industry_id IS NULL THEN
    RAISE EXCEPTION 'Windows industry not found';
  END IF;

  -- ============================================
  -- UNIVERSAL AGENTS
  -- ============================================

  -- 1. Update The Karen agent ID (No Soliciting Sign - All Industries)
  UPDATE agents
  SET eleven_agent_id = 'agent_3401kfhajkp1efdrv88hp8rnzdh2'
  WHERE name = 'The Karen'
    AND (eleven_agent_id IS NULL 
         OR eleven_agent_id = 'placeholder_karen_001'
         OR eleven_agent_id != 'agent_3401kfhajkp1efdrv88hp8rnzdh2');

  -- 2. Travis "T-Bone" Hendricks (The Crackhead - Universal) - Already correct from migration 169
  -- agent_2601kg2zz82zf2mst4mrdj9mjr76 - No update needed

  -- ============================================
  -- SOLAR INDUSTRY AGENTS
  -- ============================================

  -- 1. Jennifer Walsh - I'm Selling Soon (Solar)
  -- NOTE: This agent shares the same eleven_agent_id as Diane Martinez (Roofing)
  -- They must be the same agent record assigned to both industries
  -- First, find existing agent with the correct ID
  SELECT id INTO selling_soon_agent_id
  FROM agents
  WHERE eleven_agent_id = 'agent_2701kg2yvease7b89h6nx6p1eqjy'
  LIMIT 1;

  -- If agent with correct ID exists, ensure it's assigned to both Solar and Roofing
  IF selling_soon_agent_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (selling_soon_agent_id, solar_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (selling_soon_agent_id, roofing_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  ELSE
    -- No agent with correct ID exists, find any "I'm Selling Soon" agents
    -- and consolidate them
    -- Find Solar agent
    SELECT id INTO solar_selling_soon_id
    FROM agents
    WHERE name = 'I''m Selling Soon'
      AND EXISTS (
        SELECT 1 FROM agent_industries 
        WHERE agent_id = agents.id 
        AND industry_id = solar_industry_id
      )
    LIMIT 1;

    -- Find Roofing agent
    SELECT id INTO roofing_selling_soon_id
    FROM agents
    WHERE name = 'I''m Selling Soon'
      AND EXISTS (
        SELECT 1 FROM agent_industries 
        WHERE agent_id = agents.id 
        AND industry_id = roofing_industry_id
      )
      AND id != COALESCE(solar_selling_soon_id, '00000000-0000-0000-0000-000000000000'::UUID)
    LIMIT 1;

    -- Use Solar agent if exists, otherwise Roofing, otherwise create new
    IF solar_selling_soon_id IS NOT NULL THEN
      selling_soon_agent_id := solar_selling_soon_id;
      -- Update to correct ID
      UPDATE agents
      SET eleven_agent_id = 'agent_2701kg2yvease7b89h6nx6p1eqjy'
      WHERE id = selling_soon_agent_id;
      -- Ensure assigned to both industries
      INSERT INTO agent_industries (agent_id, industry_id)
      VALUES (selling_soon_agent_id, solar_industry_id)
      ON CONFLICT (agent_id, industry_id) DO NOTHING;
      INSERT INTO agent_industries (agent_id, industry_id)
      VALUES (selling_soon_agent_id, roofing_industry_id)
      ON CONFLICT (agent_id, industry_id) DO NOTHING;
      -- Remove duplicate Roofing agent if different
      IF roofing_selling_soon_id IS NOT NULL AND roofing_selling_soon_id != selling_soon_agent_id THEN
        DELETE FROM agent_industries WHERE agent_id = roofing_selling_soon_id;
        DELETE FROM agents WHERE id = roofing_selling_soon_id;
      END IF;
    ELSIF roofing_selling_soon_id IS NOT NULL THEN
      selling_soon_agent_id := roofing_selling_soon_id;
      -- Update to correct ID
      UPDATE agents
      SET eleven_agent_id = 'agent_2701kg2yvease7b89h6nx6p1eqjy'
      WHERE id = selling_soon_agent_id;
      -- Ensure assigned to both industries
      INSERT INTO agent_industries (agent_id, industry_id)
      VALUES (selling_soon_agent_id, solar_industry_id)
      ON CONFLICT (agent_id, industry_id) DO NOTHING;
      INSERT INTO agent_industries (agent_id, industry_id)
      VALUES (selling_soon_agent_id, roofing_industry_id)
      ON CONFLICT (agent_id, industry_id) DO NOTHING;
    ELSE
      -- Create new agent
      INSERT INTO agents (name, persona, eleven_agent_id, is_active)
      VALUES (
        'I''m Selling Soon',
        'Smokescreen/Real Objection - Moderate (20%+). Sometimes true, often an easy excuse.',
        'agent_2701kg2yvease7b89h6nx6p1eqjy',
        TRUE
      )
      RETURNING id INTO selling_soon_agent_id;
      -- Assign to both industries
      INSERT INTO agent_industries (agent_id, industry_id)
      VALUES (selling_soon_agent_id, solar_industry_id)
      ON CONFLICT (agent_id, industry_id) DO NOTHING;
      INSERT INTO agent_industries (agent_id, industry_id)
      VALUES (selling_soon_agent_id, roofing_industry_id)
      ON CONFLICT (agent_id, industry_id) DO NOTHING;
    END IF;
  END IF;

  -- 2. Terrell Washington - I Don't Qualify (Solar)
  UPDATE agents
  SET eleven_agent_id = 'agent_7401kg2vf3twe1xr9d66asfc43sv'
  WHERE name = 'I Don''t Qualify'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = solar_industry_id
    )
    AND (eleven_agent_id IS NULL 
         OR eleven_agent_id LIKE 'placeholder_%'
         OR eleven_agent_id != 'agent_7401kg2vf3twe1xr9d66asfc43sv');

  -- 3. Linda Morrison - I've Heard Bad Things About Solar (Solar)
  UPDATE agents
  SET eleven_agent_id = 'agent_0901kfgyntt4ekz9xfj3q5srk3sh'
  WHERE name = 'I''ve Heard Bad Things About Solar'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = solar_industry_id
    )
    AND (eleven_agent_id IS NULL 
         OR eleven_agent_id != 'agent_0901kfgyntt4ekz9xfj3q5srk3sh');

  -- 4. Robert Jenkins - My Roof is Too Old (Solar)
  UPDATE agents
  SET eleven_agent_id = 'agent_0201kfgymyrpe6yvb7f0ay8efd72'
  WHERE name = 'My Roof is Too Old'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = solar_industry_id
    )
    AND (eleven_agent_id IS NULL 
         OR eleven_agent_id != 'agent_0201kfgymyrpe6yvb7f0ay8efd72');

  -- 5. David Martinez - What If It Doesn't Work? (Solar)
  UPDATE agents
  SET eleven_agent_id = 'agent_1801kfgyj8hxf4p91mg5tfpwq9pp'
  WHERE name = 'What If It Doesn''t Work?'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = solar_industry_id
    )
    AND (eleven_agent_id IS NULL 
         OR eleven_agent_id != 'agent_1801kfgyj8hxf4p91mg5tfpwq9pp');

  -- 6. Sarah Chen - My Electric Bill is Too Low (Solar)
  UPDATE agents
  SET eleven_agent_id = 'agent_0501kfgyh9vrea4v9sb923t6vtfv'
  WHERE name = 'My Electric Bill is Too Low'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = solar_industry_id
    )
    AND (eleven_agent_id IS NULL 
         OR eleven_agent_id != 'agent_0501kfgyh9vrea4v9sb923t6vtfv');

  -- 7. James Porter - How Much Does It Cost? (Solar)
  UPDATE agents
  SET eleven_agent_id = 'agent_5001kfgygawzf3z9prjqkqv1wj85'
  WHERE name = 'How Much Does It Cost?'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = solar_industry_id
    )
    AND (eleven_agent_id IS NULL 
         OR eleven_agent_id != 'agent_5001kfgygawzf3z9prjqkqv1wj85');

  -- 8. Brian Walsh - Solar is Too Expensive (Solar)
  UPDATE agents
  SET eleven_agent_id = 'agent_1501kfgycw6wff3vd46tnzjr8xkb'
  WHERE name = 'Solar is Too Expensive'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = solar_industry_id
    )
    AND (eleven_agent_id IS NULL 
         OR eleven_agent_id != 'agent_1501kfgycw6wff3vd46tnzjr8xkb');

  -- 9. Gary Thompson - I'm Not Interested in Solar (Solar)
  UPDATE agents
  SET eleven_agent_id = 'agent_2101kfgybvm0fz1shb4msy1q5qxz'
  WHERE name = 'I''m Not Interested in Solar'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = solar_industry_id
    )
    AND (eleven_agent_id IS NULL 
         OR eleven_agent_id != 'agent_2101kfgybvm0fz1shb4msy1q5qxz');

  -- 10. Michelle Torres - I Need to Talk to My Spouse (Solar)
  UPDATE agents
  SET eleven_agent_id = 'agent_9101kfgy6d0jft18a06r0zj19jp1'
  WHERE name = 'I Need to Talk to My Spouse'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = solar_industry_id
    )
    AND (eleven_agent_id IS NULL 
         OR eleven_agent_id != 'agent_9101kfgy6d0jft18a06r0zj19jp1');

  -- ============================================
  -- WINDOWS INDUSTRY AGENTS
  -- ============================================

  -- 1. Steve Harry - Not the Right Time - Maybe Next Year (Windows)
  UPDATE agents
  SET eleven_agent_id = 'agent_2601kg2wcsw2f16sw06e5mxaeras'
  WHERE name = 'Not the Right Time / Maybe Next Year'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = windows_industry_id
    )
    AND (eleven_agent_id IS NULL 
         OR eleven_agent_id != 'agent_2601kg2wcsw2f16sw06e5mxaeras');

  -- 2. Jonathan Wright - I'm Waiting Until... (Windows)
  UPDATE agents
  SET eleven_agent_id = 'agent_7801kg2wc55se38vwwrj6dafec7d'
  WHERE name = 'I''m Waiting Until...'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = windows_industry_id
    )
    AND (eleven_agent_id IS NULL 
         OR eleven_agent_id != 'agent_7801kg2wc55se38vwwrj6dafec7d');

  -- 3. Laura Thompson - What's Wrong With My Windows? (Windows)
  -- Find existing agent
  SELECT id INTO laura_thompson_id
  FROM agents
  WHERE name = 'What''s Wrong With My Current Windows?'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = windows_industry_id
    )
  LIMIT 1;

  -- Update if exists
  IF laura_thompson_id IS NOT NULL THEN
    UPDATE agents
    SET eleven_agent_id = 'agent_7701kg2wbfn0e7mvw4p69wr13rb4'
    WHERE id = laura_thompson_id
      AND (eleven_agent_id IS NULL 
           OR eleven_agent_id != 'agent_7701kg2wbfn0e7mvw4p69wr13rb4');
  ELSE
    -- Create if doesn't exist
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'What''s Wrong With My Current Windows?',
      'Real objection - Common (35%+). Genuinely curious what''s wrong with their windows. What it means: "I don''t see any problems, educate me". Overcome by: Energy loss, drafts, condensation, security, noise reduction, UV damage.',
      'agent_7701kg2wbfn0e7mvw4p69wr13rb4',
      TRUE
    )
    RETURNING id INTO laura_thompson_id;

    -- Assign to Windows industry
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (laura_thompson_id, windows_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 4. Patrick Murphy - I'll Just Do It Myself (Windows)
  UPDATE agents
  SET eleven_agent_id = 'agent_6601kg2wav3hebnvq04zeymzkbhb'
  WHERE name = 'I''ll Just Do It Myself'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = windows_industry_id
    )
    AND (eleven_agent_id IS NULL 
         OR eleven_agent_id != 'agent_6601kg2wav3hebnvq04zeymzkbhb');

  -- 5. Sherry Green - I'm Selling/Moving Soon (Windows)
  UPDATE agents
  SET eleven_agent_id = 'agent_1401kg2w9r2tf13bwqebxrn9m3g0'
  WHERE name = 'I''m Selling/Moving Soon'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = windows_industry_id
    )
    AND (eleven_agent_id IS NULL 
         OR eleven_agent_id != 'agent_1401kg2w9r2tf13bwqebxrn9m3g0');

  -- 6. Maria Gonzalez - I Just Need One or Two Windows (Windows)
  UPDATE agents
  SET eleven_agent_id = 'agent_9901kg2w904weyjv9xjs9sxjzszt'
  WHERE name = 'I Just Need One or Two Windows'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = windows_industry_id
    )
    AND (eleven_agent_id IS NULL 
         OR eleven_agent_id != 'agent_9901kg2w904weyjv9xjs9sxjzszt');

  -- 7. Jeffrey Clark - I'm Going to Get Multiple Quotes (Windows)
  UPDATE agents
  SET eleven_agent_id = 'agent_9801kg2w89tqfy3tht3zwjp5w3qc'
  WHERE name = 'I''m Going to Get Multiple Quotes'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = windows_industry_id
    )
    AND (eleven_agent_id IS NULL 
         OR eleven_agent_id != 'agent_9801kg2w89tqfy3tht3zwjp5w3qc');

  -- 8. Kellie Adams - That's Too Expensive (Windows)
  UPDATE agents
  SET eleven_agent_id = 'agent_0801kg2w6rdpe2jtdpg6s4ge2xct'
  WHERE name = 'That''s Too Expensive'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = windows_industry_id
    )
    AND (eleven_agent_id IS NULL 
         OR eleven_agent_id != 'agent_0801kg2w6rdpe2jtdpg6s4ge2xct');

  -- 9. Robert Lee - My Windows Are Fine (Windows)
  UPDATE agents
  SET eleven_agent_id = 'agent_5901kg2w2pbke0p81575yq1c6spj'
  WHERE name = 'My Windows Are Fine'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = windows_industry_id
    )
    AND (eleven_agent_id IS NULL 
         OR eleven_agent_id != 'agent_5901kg2w2pbke0p81575yq1c6spj');

  -- 10. Angela White - I Need to Talk to My Spouse (Windows)
  UPDATE agents
  SET eleven_agent_id = 'agent_3301kg2vydhnf28s2q2b6thzhfa4'
  WHERE name = 'I Need to Talk to My Spouse'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = windows_industry_id
    )
    AND (eleven_agent_id IS NULL 
         OR eleven_agent_id != 'agent_3301kg2vydhnf28s2q2b6thzhfa4');

  -- ============================================
  -- ROOFING INDUSTRY AGENTS
  -- ============================================

  -- 1. Harold Stevens - I Don't Trust Door-to-Door (Roofing)
  -- Find existing agent
  SELECT id INTO harold_stevens_id
  FROM agents
  WHERE name = 'I Don''t Trust Door-to-Door Roofers'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = roofing_industry_id
    )
  LIMIT 1;

  -- Update if exists
  IF harold_stevens_id IS NOT NULL THEN
    UPDATE agents
    SET eleven_agent_id = 'agent_7201kfgy3kgeexwvkw15c30n3q3n'
    WHERE id = harold_stevens_id
      AND (eleven_agent_id IS NULL 
           OR eleven_agent_id != 'agent_7201kfgy3kgeexwvkw15c30n3q3n');
  ELSE
    -- Create if doesn't exist
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'I Don''t Trust Door-to-Door Roofers',
      'Real objection - Common (25%+). Bad experiences with door-to-door contractors. What it means: "I''ve been burned before, you''re all scammers". Overcome by: Company credentials, insurance, warranties, references, local presence, professional appearance.',
      'agent_7201kfgy3kgeexwvkw15c30n3q3n',
      TRUE
    )
    RETURNING id INTO harold_stevens_id;

    -- Assign to Roofing industry
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (harold_stevens_id, roofing_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- 2. Diane Martinez - I'm Selling Soon (Roofing)
  -- NOTE: This agent shares the same eleven_agent_id as Jennifer Walsh (Solar)
  -- Already handled above - the same agent record is assigned to both industries
  -- No additional action needed here

  -- 3. Lisa Martinez - My Insurance Won't Cover It (Roofing)
  UPDATE agents
  SET eleven_agent_id = 'agent_3801kfgy1qw9eyxa31hxdy66syrm'
  WHERE name = 'My Insurance Won''t Cover It'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = roofing_industry_id
    )
    AND (eleven_agent_id IS NULL 
         OR eleven_agent_id != 'agent_3801kfgy1qw9eyxa31hxdy66syrm');

  -- 4. Kevin Anderson - I Already Have Someone (Roofing)
  UPDATE agents
  SET eleven_agent_id = 'agent_9201kfgy0r49fc09xn6t28bcr7n5'
  WHERE name = 'I Already Have Someone'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = roofing_industry_id
    )
    AND (eleven_agent_id IS NULL 
         OR eleven_agent_id != 'agent_9201kfgy0r49fc09xn6t28bcr7n5');

  -- 5. Tom Bradley - I'll Call You When I Need a Roof (Roofing)
  UPDATE agents
  SET eleven_agent_id = 'agent_3001kfgxy6vfe3wbsjeqpczh4gje'
  WHERE name = 'I''ll Call You When I Need a Roof'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = roofing_industry_id
    )
    AND (eleven_agent_id IS NULL 
         OR eleven_agent_id != 'agent_3001kfgxy6vfe3wbsjeqpczh4gje');

  -- 6. Carlos Mendez - I Just Had My Roof Done (Roofing)
  UPDATE agents
  SET eleven_agent_id = 'agent_6801kfgxt1bxfzvrc1xatssc5f1m'
  WHERE name = 'I Just Had My Roof Done'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = roofing_industry_id
    )
    AND (eleven_agent_id IS NULL 
         OR eleven_agent_id != 'agent_6801kfgxt1bxfzvrc1xatssc5f1m');

  -- 7. David Kim - How Much Does a Roof Cost? (Roofing)
  UPDATE agents
  SET eleven_agent_id = 'agent_3201kfgxs63qf3yrz6spva0xmn76'
  WHERE name = 'How Much Does a Roof Cost?'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = roofing_industry_id
    )
    AND (eleven_agent_id IS NULL 
         OR eleven_agent_id != 'agent_3201kfgxs63qf3yrz6spva0xmn76');

  -- ============================================
  -- PEST CONTROL INDUSTRY AGENTS
  -- ============================================

  -- 1. Vincent "Vinny" Caruso - What's the Price? (Pest Control)
  UPDATE agents
  SET eleven_agent_id = 'agent_4701kg2tk5d9f5ksab7r3e7q9t1b'
  WHERE name = 'What''s the Price?'
    AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = agents.id 
      AND industry_id = pest_industry_id
    )
    AND (eleven_agent_id IS NULL 
         OR eleven_agent_id != 'agent_4701kg2tk5d9f5ksab7r3e7q9t1b');

END $$;

-- Add comment
COMMENT ON TABLE agents IS 'ElevenLabs conversational AI agents for door-to-door sales training. All agent IDs have been verified and updated to match correct ElevenLabs agent IDs.';
