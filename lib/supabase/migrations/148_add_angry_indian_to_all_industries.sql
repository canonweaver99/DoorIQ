-- Add Angry Indian agent to all specific industries (pest, fiber, roofing, solar, windows)

INSERT INTO agent_industries (agent_id, industry_id)
SELECT a.id, i.id
FROM agents a
CROSS JOIN industries i
WHERE a.name = 'Angry Indian'
  AND i.slug IN ('pest', 'fiber', 'roofing', 'solar', 'windows')
  AND a.is_active = true
ON CONFLICT (agent_id, industry_id) DO NOTHING;
