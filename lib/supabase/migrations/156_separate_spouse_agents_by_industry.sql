-- CRITICAL FIX: Separate "I Need to Talk to My Spouse" agents by industry
-- The problem: One agent record was shared across multiple industries, causing updates to one industry
-- to affect all others. This migration creates separate agent records for each industry.
-- 
-- This migration is idempotent - it checks if industry-specific agents already exist before creating them.

DO $$
DECLARE
  old_agent_id UUID;
  windows_industry_id UUID;
  fiber_industry_id UUID;
  pest_industry_id UUID;
  solar_industry_id UUID;
  roofing_industry_id UUID;
  new_windows_agent_id UUID;
  new_fiber_agent_id UUID;
  new_pest_agent_id UUID;
  new_solar_agent_id UUID;
  new_roofing_agent_id UUID;
  existing_windows_agent_id UUID;
  existing_fiber_agent_id UUID;
  existing_pest_agent_id UUID;
  existing_solar_agent_id UUID;
  existing_roofing_agent_id UUID;
BEGIN
  -- Get industry IDs
  SELECT id INTO windows_industry_id FROM industries WHERE slug = 'windows';
  SELECT id INTO fiber_industry_id FROM industries WHERE slug = 'fiber';
  SELECT id INTO pest_industry_id FROM industries WHERE slug = 'pest';
  SELECT id INTO solar_industry_id FROM industries WHERE slug = 'solar';
  SELECT id INTO roofing_industry_id FROM industries WHERE slug = 'roofing';

  -- Find existing industry-specific agents (check by eleven_agent_id to identify them)
  SELECT id INTO existing_windows_agent_id
  FROM agents
  WHERE name = 'I Need to Talk to My Spouse'
    AND eleven_agent_id = 'agent_9301kg0vggg4em0aqfs72f9r3bp4'
  LIMIT 1;

  SELECT id INTO existing_fiber_agent_id
  FROM agents
  WHERE name = 'I Need to Talk to My Spouse'
    AND eleven_agent_id = 'agent_7201kfgssnt8eb2a8a4kghb421vd'
  LIMIT 1;

  SELECT id INTO existing_pest_agent_id
  FROM agents
  WHERE name = 'I Need to Talk to My Spouse'
    AND eleven_agent_id = 'placeholder_pest_004'
  LIMIT 1;

  SELECT id INTO existing_solar_agent_id
  FROM agents
  WHERE name = 'I Need to Talk to My Spouse'
    AND eleven_agent_id = 'placeholder_solar_004'
  LIMIT 1;

  SELECT id INTO existing_roofing_agent_id
  FROM agents
  WHERE name = 'I Need to Talk to My Spouse'
    AND eleven_agent_id = 'placeholder_roofing_005'
  LIMIT 1;

  -- Find any remaining shared agent record(s) that aren't the industry-specific ones
  SELECT id INTO old_agent_id
  FROM agents
  WHERE name = 'I Need to Talk to My Spouse'
    AND id NOT IN (
      COALESCE(existing_windows_agent_id, '00000000-0000-0000-0000-000000000000'::UUID),
      COALESCE(existing_fiber_agent_id, '00000000-0000-0000-0000-000000000000'::UUID),
      COALESCE(existing_pest_agent_id, '00000000-0000-0000-0000-000000000000'::UUID),
      COALESCE(existing_solar_agent_id, '00000000-0000-0000-0000-000000000000'::UUID),
      COALESCE(existing_roofing_agent_id, '00000000-0000-0000-0000-000000000000'::UUID)
    )
  LIMIT 1;

  -- Create separate agent record for Windows industry (if it doesn't exist)
  IF windows_industry_id IS NOT NULL AND existing_windows_agent_id IS NULL THEN
    IF old_agent_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = old_agent_id AND industry_id = windows_industry_id
    ) THEN
      INSERT INTO agents (name, persona, eleven_agent_id, is_active)
      VALUES (
        'I Need to Talk to My Spouse',
        'Smokescreen/Real objection - Very common (55%+). Major home improvement decision, both must agree, or easy out. What it means: "Too big a decision for me alone" OR "Go away". Overcome by: Only present to both, schedule evening appointments, FaceTime spouse, never one-leg a windows deal.',
        'agent_9301kg0vggg4em0aqfs72f9r3bp4', -- Angela White
        TRUE
      )
      RETURNING id INTO new_windows_agent_id;

      -- Update agent_industries to point to new Windows agent
      UPDATE agent_industries
      SET agent_id = new_windows_agent_id
      WHERE agent_id = old_agent_id AND industry_id = windows_industry_id;
    ELSIF old_agent_id IS NULL THEN
      -- No old agent exists, but we need to create Windows agent
      INSERT INTO agents (name, persona, eleven_agent_id, is_active)
      VALUES (
        'I Need to Talk to My Spouse',
        'Smokescreen/Real objection - Very common (55%+). Major home improvement decision, both must agree, or easy out. What it means: "Too big a decision for me alone" OR "Go away". Overcome by: Only present to both, schedule evening appointments, FaceTime spouse, never one-leg a windows deal.',
        'agent_9301kg0vggg4em0aqfs72f9r3bp4', -- Angela White
        TRUE
      )
      RETURNING id INTO new_windows_agent_id;

      -- Link to Windows industry
      INSERT INTO agent_industries (agent_id, industry_id)
      VALUES (new_windows_agent_id, windows_industry_id)
      ON CONFLICT (agent_id, industry_id) DO NOTHING;
    END IF;
  ELSIF existing_windows_agent_id IS NOT NULL THEN
    -- Ensure existing Windows agent is linked to Windows industry
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (existing_windows_agent_id, windows_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- Create separate agent record for Fiber industry (if it doesn't exist)
  IF fiber_industry_id IS NOT NULL AND existing_fiber_agent_id IS NULL THEN
    IF old_agent_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = old_agent_id AND industry_id = fiber_industry_id
    ) THEN
      INSERT INTO agents (name, persona, eleven_agent_id, is_active)
      VALUES (
        'I Need to Talk to My Spouse',
        'Smokescreen/Real objection - Very common (45%+). Joint decision for household service, or easy exit. What it means: "I can''t decide this alone" OR "I want you to leave". Overcome by: Getting spouse on phone/FaceTime, leaving info with callback time, both-present appointments.',
        'agent_7201kfgssnt8eb2a8a4kghb421vd', -- Jessica Martinez
        TRUE
      )
      RETURNING id INTO new_fiber_agent_id;

      -- Update agent_industries to point to new Fiber agent
      UPDATE agent_industries
      SET agent_id = new_fiber_agent_id
      WHERE agent_id = old_agent_id AND industry_id = fiber_industry_id;
    ELSIF old_agent_id IS NULL THEN
      INSERT INTO agents (name, persona, eleven_agent_id, is_active)
      VALUES (
        'I Need to Talk to My Spouse',
        'Smokescreen/Real objection - Very common (45%+). Joint decision for household service, or easy exit. What it means: "I can''t decide this alone" OR "I want you to leave". Overcome by: Getting spouse on phone/FaceTime, leaving info with callback time, both-present appointments.',
        'agent_7201kfgssnt8eb2a8a4kghb421vd', -- Jessica Martinez
        TRUE
      )
      RETURNING id INTO new_fiber_agent_id;

      INSERT INTO agent_industries (agent_id, industry_id)
      VALUES (new_fiber_agent_id, fiber_industry_id)
      ON CONFLICT (agent_id, industry_id) DO NOTHING;
    END IF;
  ELSIF existing_fiber_agent_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (existing_fiber_agent_id, fiber_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- Create separate agent record for Pest industry (if it doesn't exist)
  IF pest_industry_id IS NOT NULL AND existing_pest_agent_id IS NULL THEN
    IF old_agent_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = old_agent_id AND industry_id = pest_industry_id
    ) THEN
      INSERT INTO agents (name, persona, eleven_agent_id, is_active)
      VALUES (
        'I Need to Talk to My Spouse',
        'Smokescreen/Real objection - Very common (40%+). Sometimes legitimate, often an easy exit strategy. What it means: "I''m not the decision maker" OR "I want you to leave". Overcome by: Getting spouse on phone, leaving info for callback, booking follow-up time.',
        'placeholder_pest_004',
        TRUE
      )
      RETURNING id INTO new_pest_agent_id;

      UPDATE agent_industries
      SET agent_id = new_pest_agent_id
      WHERE agent_id = old_agent_id AND industry_id = pest_industry_id;
    ELSIF old_agent_id IS NULL THEN
      INSERT INTO agents (name, persona, eleven_agent_id, is_active)
      VALUES (
        'I Need to Talk to My Spouse',
        'Smokescreen/Real objection - Very common (40%+). Sometimes legitimate, often an easy exit strategy. What it means: "I''m not the decision maker" OR "I want you to leave". Overcome by: Getting spouse on phone, leaving info for callback, booking follow-up time.',
        'placeholder_pest_004',
        TRUE
      )
      RETURNING id INTO new_pest_agent_id;

      INSERT INTO agent_industries (agent_id, industry_id)
      VALUES (new_pest_agent_id, pest_industry_id)
      ON CONFLICT (agent_id, industry_id) DO NOTHING;
    END IF;
  ELSIF existing_pest_agent_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (existing_pest_agent_id, pest_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- Create separate agent record for Solar industry (if it doesn't exist)
  IF solar_industry_id IS NOT NULL AND existing_solar_agent_id IS NULL THEN
    IF old_agent_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = old_agent_id AND industry_id = solar_industry_id
    ) THEN
      INSERT INTO agents (name, persona, eleven_agent_id, is_active)
      VALUES (
        'I Need to Talk to My Spouse',
        'Smokescreen/Real objection - Very common (60%+). MAJOR household decision, requires both parties, or easy out. What it means: "This is too big for me alone" OR "I want you gone". Overcome by: Only meet with both present, FaceTime spouse, schedule evening appointment, never one-leg a solar deal.',
        'placeholder_solar_004',
        TRUE
      )
      RETURNING id INTO new_solar_agent_id;

      UPDATE agent_industries
      SET agent_id = new_solar_agent_id
      WHERE agent_id = old_agent_id AND industry_id = solar_industry_id;
    ELSIF old_agent_id IS NULL THEN
      INSERT INTO agents (name, persona, eleven_agent_id, is_active)
      VALUES (
        'I Need to Talk to My Spouse',
        'Smokescreen/Real objection - Very common (60%+). MAJOR household decision, requires both parties, or easy out. What it means: "This is too big for me alone" OR "I want you gone". Overcome by: Only meet with both present, FaceTime spouse, schedule evening appointment, never one-leg a solar deal.',
        'placeholder_solar_004',
        TRUE
      )
      RETURNING id INTO new_solar_agent_id;

      INSERT INTO agent_industries (agent_id, industry_id)
      VALUES (new_solar_agent_id, solar_industry_id)
      ON CONFLICT (agent_id, industry_id) DO NOTHING;
    END IF;
  ELSIF existing_solar_agent_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (existing_solar_agent_id, solar_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- Create separate agent record for Roofing industry (if it doesn't exist)
  IF roofing_industry_id IS NOT NULL AND existing_roofing_agent_id IS NULL THEN
    IF old_agent_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM agent_industries 
      WHERE agent_id = old_agent_id AND industry_id = roofing_industry_id
    ) THEN
      INSERT INTO agents (name, persona, eleven_agent_id, is_active)
      VALUES (
        'I Need to Talk to My Spouse',
        'Smokescreen/Real objection - Very common (50%+). Major purchase decision, both need to agree, or easy exit. What it means: "This is a huge decision I can''t make alone" OR "Go away". Overcome by: Getting both present, scheduling appointment when both home, FaceTime spouse, leaving detailed info.',
        'placeholder_roofing_005',
        TRUE
      )
      RETURNING id INTO new_roofing_agent_id;

      UPDATE agent_industries
      SET agent_id = new_roofing_agent_id
      WHERE agent_id = old_agent_id AND industry_id = roofing_industry_id;
    ELSIF old_agent_id IS NULL THEN
      INSERT INTO agents (name, persona, eleven_agent_id, is_active)
      VALUES (
        'I Need to Talk to My Spouse',
        'Smokescreen/Real objection - Very common (50%+). Major purchase decision, both need to agree, or easy exit. What it means: "This is a huge decision I can''t make alone" OR "Go away". Overcome by: Getting both present, scheduling appointment when both home, FaceTime spouse, leaving detailed info.',
        'placeholder_roofing_005',
        TRUE
      )
      RETURNING id INTO new_roofing_agent_id;

      INSERT INTO agent_industries (agent_id, industry_id)
      VALUES (new_roofing_agent_id, roofing_industry_id)
      ON CONFLICT (agent_id, industry_id) DO NOTHING;
    END IF;
  ELSIF existing_roofing_agent_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (existing_roofing_agent_id, roofing_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- Delete the old shared agent record (only if no longer linked to any industries)
  -- This is safe because we've already moved all industry associations to new records
  IF old_agent_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM agent_industries WHERE agent_id = old_agent_id
  ) THEN
    DELETE FROM agents WHERE id = old_agent_id;
  END IF;

END $$;
