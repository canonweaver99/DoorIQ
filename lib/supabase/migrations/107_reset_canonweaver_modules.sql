-- Reset all module progress for canonweaver@loopline.design
-- This marks all modules and objections as uncompleted for this specific user

-- First, get the user ID for canonweaver@loopline.design
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Find the user by email
  SELECT id INTO target_user_id
  FROM users
  WHERE email = 'canonweaver@loopline.design'
  LIMIT 1;

  -- If user found, reset their module progress
  IF target_user_id IS NOT NULL THEN
    -- Reset module progress
    UPDATE user_module_progress
    SET completed_at = NULL,
        time_spent_seconds = 0,
        updated_at = NOW()
    WHERE user_id = target_user_id;

    -- Reset objection progress
    UPDATE user_objection_progress
    SET completed_at = NULL,
        time_spent_seconds = 0,
        updated_at = NOW()
    WHERE user_id = target_user_id;

    RAISE NOTICE 'Reset progress for user: % (ID: %)', 'canonweaver@loopline.design', target_user_id;
  ELSE
    RAISE NOTICE 'User not found: canonweaver@loopline.design';
  END IF;
END $$;

