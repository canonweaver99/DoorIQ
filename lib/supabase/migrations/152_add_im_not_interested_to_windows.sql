-- Add "I'm Not Interested" agent to Windows industry
-- This agent represents homeowners who dismiss window companies due to industry reputation

DO $$
BEGIN
  -- Check if agent already exists
  IF EXISTS (SELECT 1 FROM agents WHERE name = 'I''m Not Interested' AND eleven_agent_id = 'placeholder_windows_012') THEN
    -- Update existing agent
    UPDATE agents 
    SET 
      persona = 'Smokescreen - Very common (60%+). Window companies have bad reputation, they assume you''re pushy/scammy. What it means: "I hate door-to-door window companies" OR "Don''t waste my time". Overcome by: Pattern interrupt ("Not selling anything today"), energy savings angle, neighbor social proof.',
      eleven_agent_id = 'placeholder_windows_012',
      is_active = TRUE
    WHERE name = 'I''m Not Interested' AND eleven_agent_id = 'placeholder_windows_012';
  ELSE
    -- Insert new Windows-specific agent (different from Roofing version)
    INSERT INTO agents (name, persona, eleven_agent_id, is_active) 
    VALUES (
      'I''m Not Interested',
      'Smokescreen - Very common (60%+). Window companies have bad reputation, they assume you''re pushy/scammy. What it means: "I hate door-to-door window companies" OR "Don''t waste my time". Overcome by: Pattern interrupt ("Not selling anything today"), energy savings angle, neighbor social proof.',
      'placeholder_windows_012',
      TRUE
    );
  END IF;
END $$;

-- Assign "I'm Not Interested" (Windows version) to windows industry
INSERT INTO agent_industries (agent_id, industry_id)
SELECT a.id, i.id
FROM agents a
CROSS JOIN industries i
WHERE a.name = 'I''m Not Interested'
  AND a.eleven_agent_id = 'placeholder_windows_012'
  AND i.slug = 'windows'
  AND a.is_active = true
ON CONFLICT (agent_id, industry_id) DO NOTHING;
