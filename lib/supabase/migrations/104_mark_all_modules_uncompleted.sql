-- Mark all learning modules as uncompleted
-- This clears the completed_at timestamp for all user module progress

UPDATE user_module_progress
SET completed_at = NULL,
    updated_at = NOW()
WHERE completed_at IS NOT NULL;

