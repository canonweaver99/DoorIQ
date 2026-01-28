-- Rename agents assigned to all industries with the provided names
-- Use these names for all industry agents:
-- AUSTIN RODRIGUEZ, TINA PATEL, NICK PATTERSON, SAM O'BRIEN, TIM ROBERTSON, 
-- RANDY WALLACE, JERRY MARTINEZ, BETH ANDERSON, NANCY WILLIAMS, DAVE "DAVO" MILLER, 
-- STEVE MITCHELL, VICTOR MARTINEZ

DO $$
DECLARE
  all_industries_count INTEGER;
BEGIN
  -- Get count of all industries (should be 5: pest, fiber, roofing, solar, windows)
  SELECT COUNT(*) INTO all_industries_count FROM industries WHERE slug IN ('pest', 'fiber', 'roofing', 'solar', 'windows');
  
  -- 1. Update Average Austin -> Austin Rodriguez
  UPDATE agents
  SET name = 'Austin Rodriguez'
  WHERE name = 'Average Austin'
    AND (
      SELECT COUNT(DISTINCT ai.industry_id)
      FROM agent_industries ai
      INNER JOIN industries i ON ai.industry_id = i.id
      WHERE ai.agent_id = agents.id
        AND i.slug IN ('pest', 'fiber', 'roofing', 'solar', 'windows')
    ) = all_industries_count;

  -- 2. Update Think About It Tina -> Tina Patel and assign to all industries
  UPDATE agents
  SET name = 'Tina Patel'
  WHERE name = 'Think About It Tina';
  
  INSERT INTO agent_industries (agent_id, industry_id)
  SELECT a.id, i.id
  FROM agents a
  CROSS JOIN industries i
  WHERE a.name = 'Tina Patel'
    AND i.slug IN ('pest', 'fiber', 'roofing', 'solar', 'windows')
    AND a.is_active = true
  ON CONFLICT (agent_id, industry_id) DO NOTHING;

  -- 3. Update Not Interested Nick -> Nick Patterson
  UPDATE agents
  SET name = 'Nick Patterson'
  WHERE name = 'Not Interested Nick'
    AND (
      SELECT COUNT(DISTINCT ai.industry_id)
      FROM agent_industries ai
      INNER JOIN industries i ON ai.industry_id = i.id
      WHERE ai.agent_id = agents.id
        AND i.slug IN ('pest', 'fiber', 'roofing', 'solar', 'windows')
    ) = all_industries_count;

  -- 4. Update Skeptical Sam -> Sam O'Brien and assign to all industries
  UPDATE agents
  SET name = 'Sam O''Brien'
  WHERE name = 'Skeptical Sam';
  
  INSERT INTO agent_industries (agent_id, industry_id)
  SELECT a.id, i.id
  FROM agents a
  CROSS JOIN industries i
  WHERE a.name = 'Sam O''Brien'
    AND i.slug IN ('pest', 'fiber', 'roofing', 'solar', 'windows')
    AND a.is_active = true
  ON CONFLICT (agent_id, industry_id) DO NOTHING;

  -- 5. Update Too Expensive Tim -> Tim Robertson
  UPDATE agents
  SET name = 'Tim Robertson'
  WHERE name = 'Too Expensive Tim'
    AND (
      SELECT COUNT(DISTINCT ai.industry_id)
      FROM agent_industries ai
      INNER JOIN industries i ON ai.industry_id = i.id
      WHERE ai.agent_id = agents.id
        AND i.slug IN ('pest', 'fiber', 'roofing', 'solar', 'windows')
    ) = all_industries_count;

  -- 6. Update Renter Randy -> Randy Wallace (assigned to all industries EXCEPT windows)
  UPDATE agents
  SET name = 'Randy Wallace'
  WHERE name = 'Renter Randy'
    AND (
      SELECT COUNT(DISTINCT ai.industry_id)
      FROM agent_industries ai
      INNER JOIN industries i ON ai.industry_id = i.id
      WHERE ai.agent_id = agents.id
        AND i.slug IN ('pest', 'fiber', 'roofing', 'solar')
    ) = 4;

  -- 7. Update Just Treated Jerry -> Jerry Martinez and assign to all industries
  UPDATE agents
  SET name = 'Jerry Martinez'
  WHERE name = 'Just Treated Jerry';
  
  INSERT INTO agent_industries (agent_id, industry_id)
  SELECT a.id, i.id
  FROM agents a
  CROSS JOIN industries i
  WHERE a.name = 'Jerry Martinez'
    AND i.slug IN ('pest', 'fiber', 'roofing', 'solar', 'windows')
    AND a.is_active = true
  ON CONFLICT (agent_id, industry_id) DO NOTHING;

  -- 8. Update Busy Beth -> Beth Anderson and assign to all industries
  UPDATE agents
  SET name = 'Beth Anderson'
  WHERE name = 'Busy Beth';
  
  INSERT INTO agent_industries (agent_id, industry_id)
  SELECT a.id, i.id
  FROM agents a
  CROSS JOIN industries i
  WHERE a.name = 'Beth Anderson'
    AND i.slug IN ('pest', 'fiber', 'roofing', 'solar', 'windows')
    AND a.is_active = true
  ON CONFLICT (agent_id, industry_id) DO NOTHING;

  -- 9. Update No Problem Nancy -> Nancy Williams and assign to all industries
  UPDATE agents
  SET name = 'Nancy Williams'
  WHERE name = 'No Problem Nancy';
  
  INSERT INTO agent_industries (agent_id, industry_id)
  SELECT a.id, i.id
  FROM agents a
  CROSS JOIN industries i
  WHERE a.name = 'Nancy Williams'
    AND i.slug IN ('pest', 'fiber', 'roofing', 'solar', 'windows')
    AND a.is_active = true
  ON CONFLICT (agent_id, industry_id) DO NOTHING;

  -- 10. Update DIY Dave -> Dave "Davo" Miller and assign to all industries
  UPDATE agents
  SET name = 'Dave "Davo" Miller'
  WHERE name = 'DIY Dave';
  
  INSERT INTO agent_industries (agent_id, industry_id)
  SELECT a.id, i.id
  FROM agents a
  CROSS JOIN industries i
  WHERE a.name = 'Dave "Davo" Miller'
    AND i.slug IN ('pest', 'fiber', 'roofing', 'solar', 'windows')
    AND a.is_active = true
  ON CONFLICT (agent_id, industry_id) DO NOTHING;

  -- 11. Update Switchover Steve -> Steve Mitchell and assign to all industries
  UPDATE agents
  SET name = 'Steve Mitchell'
  WHERE name = 'Switchover Steve';
  
  INSERT INTO agent_industries (agent_id, industry_id)
  SELECT a.id, i.id
  FROM agents a
  CROSS JOIN industries i
  WHERE a.name = 'Steve Mitchell'
    AND i.slug IN ('pest', 'fiber', 'roofing', 'solar', 'windows')
    AND a.is_active = true
  ON CONFLICT (agent_id, industry_id) DO NOTHING;

  -- 12. Update Veteran Victor -> Victor Martinez and assign to all industries
  UPDATE agents
  SET name = 'Victor Martinez'
  WHERE name = 'Veteran Victor';
  
  INSERT INTO agent_industries (agent_id, industry_id)
  SELECT a.id, i.id
  FROM agents a
  CROSS JOIN industries i
  WHERE a.name = 'Victor Martinez'
    AND i.slug IN ('pest', 'fiber', 'roofing', 'solar', 'windows')
    AND a.is_active = true
  ON CONFLICT (agent_id, industry_id) DO NOTHING;

  -- Ensure Spouse Check Susan is assigned to all industries (keeping original name)
  INSERT INTO agent_industries (agent_id, industry_id)
  SELECT a.id, i.id
  FROM agents a
  CROSS JOIN industries i
  WHERE a.name = 'Spouse Check Susan'
    AND i.slug IN ('pest', 'fiber', 'roofing', 'solar', 'windows')
    AND a.is_active = true
  ON CONFLICT (agent_id, industry_id) DO NOTHING;

END $$;

-- Add comment
COMMENT ON TABLE agents IS 'ElevenLabs conversational AI agents for door-to-door sales training. All industry agents have been renamed with real names.';
