-- Count total unique agents in the database
SELECT 
  COUNT(*) as total_agents,
  COUNT(*) FILTER (WHERE is_active = true) as active_agents,
  COUNT(*) FILTER (WHERE is_active = false) as inactive_agents
FROM agents;

-- List all unique agent names
SELECT name, is_active, created_at
FROM agents
ORDER BY name;
