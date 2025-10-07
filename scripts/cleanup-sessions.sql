-- Cleanup script to remove all past sessions and start fresh
-- Run this in your Supabase SQL editor

-- 1. Delete all session events (if table exists)
DELETE FROM session_events WHERE true;

-- 2. Delete all line sessions (if table exists)
-- Note: This table may not exist yet if migration 023 hasn't been run
-- DELETE FROM line_sessions WHERE true;

-- 3. Delete all live sessions
DELETE FROM live_sessions WHERE true;

-- 4. Delete all training sessions (if using the newer table)
DELETE FROM training_sessions WHERE true;

-- 5. Reset any user stats if needed (optional)
-- UPDATE users SET virtual_earnings = 0 WHERE true;

-- Verification: Check counts after deletion
SELECT 'live_sessions' as table_name, COUNT(*) as record_count FROM live_sessions
UNION ALL
SELECT 'training_sessions', COUNT(*) FROM training_sessions
UNION ALL  
SELECT 'session_events', COUNT(*) FROM session_events;

-- Note: After running this, you'll have a clean slate for testing!
