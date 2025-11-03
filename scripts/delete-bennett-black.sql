-- Delete Bennett Black's account
-- Run this in Supabase SQL Editor

-- First, find the user ID (replace with actual email if known)
DO $$
DECLARE
  user_uuid UUID;
  user_email TEXT;
BEGIN
  -- Find user by email (update email if needed)
  SELECT id, email INTO user_uuid, user_email
  FROM users
  WHERE email ILIKE '%bennett%' OR full_name ILIKE '%bennett%'
  LIMIT 1;

  IF user_uuid IS NULL THEN
    RAISE NOTICE 'User not found in users table';
  ELSE
    RAISE NOTICE 'Found user: % (ID: %)', user_email, user_uuid;
    
    -- Delete from user_session_limits
    DELETE FROM user_session_limits WHERE user_id = user_uuid;
    RAISE NOTICE 'Deleted from user_session_limits';
    
    -- Delete from users table
    DELETE FROM users WHERE id = user_uuid;
    RAISE NOTICE 'Deleted from users table';
    
    RAISE NOTICE 'User deleted from database. Now delete from Auth manually:';
    RAISE NOTICE '1. Go to Supabase Dashboard > Authentication > Users';
    RAISE NOTICE '2. Search for: %', user_email;
    RAISE NOTICE '3. Click the user and delete';
  END IF;
END $$;

-- Alternative: If you know the exact email, use this:
-- DELETE FROM user_session_limits WHERE user_id IN (SELECT id FROM users WHERE email = 'bennett@example.com');
-- DELETE FROM users WHERE email = 'bennett@example.com';
-- Then delete from Auth dashboard manually

