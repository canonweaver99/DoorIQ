-- Add The Karen agent for all industries
-- This agent tests reps' ability to handle demanding and entitled customers

DO $$
BEGIN
  -- Check if agent already exists
  IF EXISTS (SELECT 1 FROM agents WHERE name = 'The Karen') THEN
    -- Update existing agent
    UPDATE agents 
    SET 
      persona = 'Demanding, entitled, and difficult homeowner. Tests your patience and ability to handle unreasonable requests while maintaining professionalism.',
      eleven_agent_id = 'placeholder_karen_001',
      is_active = TRUE
    WHERE name = 'The Karen';
  ELSE
    -- Insert new agent
    INSERT INTO agents (name, persona, eleven_agent_id, is_active) 
    VALUES (
      'The Karen',
      'Demanding, entitled, and difficult homeowner. Tests your patience and ability to handle unreasonable requests while maintaining professionalism.',
      'placeholder_karen_001',
      TRUE
    );
  END IF;
END $$;

-- Assign The Karen to all industries
INSERT INTO agent_industries (agent_id, industry_id)
SELECT a.id, i.id
FROM agents a
CROSS JOIN industries i
WHERE a.name = 'The Karen'
  AND a.is_active = true
ON CONFLICT (agent_id, industry_id) DO NOTHING;
