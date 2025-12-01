-- Rename "Already Got It Alan" to "Switchover Steve"
-- This updates the agent name in the database

UPDATE agents
SET name = 'Switchover Steve'
WHERE name = 'Already Got It Alan';

-- Also update any references in live_sessions if they exist
UPDATE live_sessions
SET agent_name = 'Switchover Steve'
WHERE agent_name = 'Already Got It Alan';

