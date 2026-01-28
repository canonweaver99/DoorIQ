-- Remove "How Much Does It Cost?" agent from solar industry
-- This agent is Windows-specific (Kai Shin) and shouldn't be in solar
-- Solar already has "Solar is Too Expensive" which covers price concerns

DELETE FROM agent_industries
WHERE industry_id = (SELECT id FROM industries WHERE slug = 'solar')
  AND agent_id = (SELECT id FROM agents WHERE name = 'How Much Does It Cost?');
