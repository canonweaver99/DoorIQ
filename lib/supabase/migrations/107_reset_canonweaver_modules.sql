-- Reset all module progress for canonweaver@loopline.design
-- This deletes all progress records for this specific user to ensure clean reset
-- NOTE: After running this, you may need to wait up to 5 minutes for API cache to expire,
-- or hard refresh the browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

DO $$
DECLARE
  target_user_id UUID;
  module_count INTEGER := 0;
  objection_count INTEGER := 0;
BEGIN
  -- Find the user by email in auth.users table
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'canonweaver@loopline.design'
  LIMIT 1;

  -- If user found, delete all their progress records
  IF target_user_id IS NOT NULL THEN
    -- Delete all module progress records
    DELETE FROM user_module_progress
    WHERE user_id = target_user_id;
    
    GET DIAGNOSTICS module_count = ROW_COUNT;

    -- Delete all objection progress records
    DELETE FROM user_objection_progress
    WHERE user_id = target_user_id;
    
    GET DIAGNOSTICS objection_count = ROW_COUNT;

    RAISE NOTICE '✅ Successfully reset progress for user: canonweaver@loopline.design (ID: %)', target_user_id;
    RAISE NOTICE '   Deleted % module progress records', module_count;
    RAISE NOTICE '   Deleted % objection progress records', objection_count;
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Note: API responses are cached for 5 minutes.';
    RAISE NOTICE '   - Hard refresh your browser (Cmd+Shift+R / Ctrl+Shift+R)';
    RAISE NOTICE '   - Or wait up to 5 minutes for cache to expire';
  ELSE
    RAISE NOTICE '❌ User not found: canonweaver@loopline.design';
    RAISE NOTICE '';
    RAISE NOTICE 'Checking for similar emails...';
    
    -- Show similar emails
    FOR target_user_id IN 
      SELECT id FROM auth.users 
      WHERE email LIKE '%canon%' OR email LIKE '%loopline%'
      LIMIT 10
    LOOP
      RAISE NOTICE '  Found user ID: %', target_user_id;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'If the email is different, update the migration with the correct email.';
  END IF;
END $$;

