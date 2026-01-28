-- Add Travis "T-Bone" Hendricks (The Crackhead) agent for safety training sessions
-- Expert/Safety Training difficulty - Tests reps' ability to handle dangerous situations
-- Voice: Daniel (onwK4e9ZLuTAKqWW03F9)
-- Character: 38 but looks 50, clearly under the influence, paranoid, aggressive, erratic

DO $$
BEGIN
  -- Check if agent already exists
  IF EXISTS (SELECT 1 FROM agents WHERE name = 'Travis "T-Bone" Hendricks') THEN
    -- Update existing agent
    UPDATE agents 
    SET 
      persona = 'Expert/Safety Training - 38 but looks 50, clearly under the influence, paranoid, aggressive, erratic. Tests your ability to recognize dangerous situations and exit safely while maintaining professionalism.',
      eleven_agent_id = 'agent_2601kg2zz82zf2mst4mrdj9mjr76',
      is_active = TRUE
    WHERE name = 'Travis "T-Bone" Hendricks';
  ELSE
    -- Insert new agent
    INSERT INTO agents (name, persona, eleven_agent_id, is_active) 
    VALUES (
      'Travis "T-Bone" Hendricks',
      'Expert/Safety Training - 38 but looks 50, clearly under the influence, paranoid, aggressive, erratic. Tests your ability to recognize dangerous situations and exit safely while maintaining professionalism.',
      'agent_2601kg2zz82zf2mst4mrdj9mjr76',
      TRUE
    );
  END IF;
END $$;

-- Assign Travis "T-Bone" Hendricks to all industries (pest, fiber, roofing, solar, windows)
INSERT INTO agent_industries (agent_id, industry_id)
SELECT a.id, i.id
FROM agents a
CROSS JOIN industries i
WHERE a.name = 'Travis "T-Bone" Hendricks'
  AND i.slug IN ('pest', 'fiber', 'roofing', 'solar', 'windows')
  AND a.is_active = true
ON CONFLICT (agent_id, industry_id) DO NOTHING;

-- Add comment
COMMENT ON TABLE agents IS 'ElevenLabs conversational AI agents for door-to-door sales training';
