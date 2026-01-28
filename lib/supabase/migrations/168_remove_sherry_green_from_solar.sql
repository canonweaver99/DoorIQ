-- Remove "I'm Selling/Moving Soon" (Sherry Green) from Solar industry
-- Replace Robert Williams with Diane Martinez for Solar's "I'm Selling Soon"
-- Sherry Green should only be in Windows & Doors
-- Robert Williams should only be in Roofing

DO $$
DECLARE
  solar_industry_id UUID;
  windows_industry_id UUID;
  sherry_agent_ids UUID[];
  robert_williams_agent_id UUID;
BEGIN
  -- Get industry IDs
  SELECT id INTO solar_industry_id FROM industries WHERE slug = 'solar';
  SELECT id INTO windows_industry_id FROM industries WHERE slug = 'windows';
  
  IF solar_industry_id IS NULL THEN
    RAISE EXCEPTION 'Solar industry not found';
  END IF;

  -- Find all "I'm Selling/Moving Soon" agents linked to Solar
  SELECT ARRAY_AGG(DISTINCT a.id) INTO sherry_agent_ids
  FROM agents a
  INNER JOIN agent_industries ai ON ai.agent_id = a.id
  WHERE a.name = 'I''m Selling/Moving Soon'
    AND ai.industry_id = solar_industry_id;

  -- Remove Solar industry links from "I'm Selling/Moving Soon" agents
  IF sherry_agent_ids IS NOT NULL AND array_length(sherry_agent_ids, 1) > 0 THEN
    DELETE FROM agent_industries
    WHERE agent_id = ANY(sherry_agent_ids)
      AND industry_id = solar_industry_id;
  END IF;

  -- Remove Robert Williams (agent_9701kfgy2ptff7x8je2fcca13jp1) from Solar
  DELETE FROM agent_industries
  WHERE agent_id IN (
    SELECT id FROM agents 
    WHERE name = 'I''m Selling Soon' 
      AND eleven_agent_id = 'agent_9701kfgy2ptff7x8je2fcca13jp1'
  )
  AND industry_id = solar_industry_id;

  -- Ensure "I'm Selling Soon" (Diane Martinez) is linked to Solar
  -- Find or create Diane Martinez agent with the correct ID for Solar
  SELECT id INTO robert_williams_agent_id
  FROM agents
  WHERE name = 'I''m Selling Soon'
    AND eleven_agent_id = 'agent_2701kg2yvease7b89h6nx6p1eqjy'
  LIMIT 1;

  -- If Diane Martinez agent doesn't exist, create it
  IF robert_williams_agent_id IS NULL THEN
    INSERT INTO agents (name, persona, eleven_agent_id, is_active)
    VALUES (
      'I''m Selling Soon',
      'Smokescreen/Real Objection - Moderate (20%+). Sometimes true, often an easy excuse.',
      'agent_2701kg2yvease7b89h6nx6p1eqjy',
      TRUE
    )
    RETURNING id INTO robert_williams_agent_id;
  END IF;

  -- Link Diane Martinez to Solar if not already linked
  IF robert_williams_agent_id IS NOT NULL THEN
    INSERT INTO agent_industries (agent_id, industry_id)
    VALUES (robert_williams_agent_id, solar_industry_id)
    ON CONFLICT (agent_id, industry_id) DO NOTHING;
  END IF;

  -- Ensure "I'm Selling/Moving Soon" (Sherry Green) is linked to Windows
  IF windows_industry_id IS NOT NULL AND sherry_agent_ids IS NOT NULL AND array_length(sherry_agent_ids, 1) > 0 THEN
    -- Link each Sherry Green agent to Windows
    FOR i IN 1..array_length(sherry_agent_ids, 1) LOOP
      INSERT INTO agent_industries (agent_id, industry_id)
      VALUES (sherry_agent_ids[i], windows_industry_id)
      ON CONFLICT (agent_id, industry_id) DO NOTHING;
    END LOOP;
  END IF;

END $$;
