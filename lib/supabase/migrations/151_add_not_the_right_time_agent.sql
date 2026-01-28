-- Add "Not the Right Time / Maybe Next Year" agent for Windows industry only
-- This agent represents homeowners who use timing objections

DO $$
BEGIN
  -- Check if agent already exists
  IF EXISTS (SELECT 1 FROM agents WHERE name = 'Not the Right Time / Maybe Next Year') THEN
    -- Update existing agent
    UPDATE agents 
    SET 
      persona = 'Common (30%+). Says it''s not the right time or maybe next year. Often a smokescreen for other concerns. Uses timing as excuse, avoids commitment. Responds to urgency and immediate benefits.',
      eleven_agent_id = 'placeholder_timing_001',
      is_active = TRUE
    WHERE name = 'Not the Right Time / Maybe Next Year';
  ELSE
    -- Insert new agent
    INSERT INTO agents (name, persona, eleven_agent_id, is_active) 
    VALUES (
      'Not the Right Time / Maybe Next Year',
      'Common (30%+). Says it''s not the right time or maybe next year. Often a smokescreen for other concerns. Uses timing as excuse, avoids commitment. Responds to urgency and immediate benefits.',
      'placeholder_timing_001',
      TRUE
    );
  END IF;
END $$;

-- Assign "Not the Right Time / Maybe Next Year" to Windows industry only
INSERT INTO agent_industries (agent_id, industry_id)
SELECT a.id, i.id
FROM agents a
CROSS JOIN industries i
WHERE a.name = 'Not the Right Time / Maybe Next Year'
  AND i.slug = 'windows'
  AND a.is_active = true
ON CONFLICT (agent_id, industry_id) DO NOTHING;

-- Remove "Not the Right Time / Maybe Next Year" from all other industries
DELETE FROM agent_industries
WHERE agent_id IN (SELECT id FROM agents WHERE name = 'Not the Right Time / Maybe Next Year')
  AND industry_id NOT IN (SELECT id FROM industries WHERE slug = 'windows');
