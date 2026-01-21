-- Assign agents to proper industries based on business requirements
-- Agents that apply to ALL industries: Average Austin, Not Interested Nick, Too Expensive Tim, Spouse Check Susan
-- Renter Randy applies to ALL industries EXCEPT windows and doors

-- First, clear existing assignments for these specific agents to avoid duplicates
DELETE FROM agent_industries
WHERE agent_id IN (
  SELECT id FROM agents 
  WHERE name IN ('Average Austin', 'Not Interested Nick', 'Too Expensive Tim', 'Spouse Check Susan', 'Renter Randy')
);

-- Assign Average Austin, Not Interested Nick, Too Expensive Tim, Spouse Check Susan to ALL industries
INSERT INTO agent_industries (agent_id, industry_id)
SELECT a.id, i.id
FROM agents a
CROSS JOIN industries i
WHERE a.name IN ('Average Austin', 'Not Interested Nick', 'Too Expensive Tim', 'Spouse Check Susan')
  AND a.is_active = true
ON CONFLICT (agent_id, industry_id) DO NOTHING;

-- Assign Renter Randy to ALL industries EXCEPT windows
INSERT INTO agent_industries (agent_id, industry_id)
SELECT a.id, i.id
FROM agents a
CROSS JOIN industries i
WHERE a.name = 'Renter Randy'
  AND a.is_active = true
  AND i.slug != 'windows'
ON CONFLICT (agent_id, industry_id) DO NOTHING;
