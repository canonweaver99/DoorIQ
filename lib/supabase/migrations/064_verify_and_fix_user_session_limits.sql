-- Migration: 064_verify_and_fix_user_session_limits
-- Verify and fix user_session_limits records for all users

-- First, let's see how many users don't have records
SELECT 
  COUNT(*) as total_users,
  COUNT(usl.user_id) as users_with_limits,
  COUNT(*) - COUNT(usl.user_id) as users_without_limits
FROM users u
LEFT JOIN user_session_limits usl ON u.id = usl.user_id;

-- Show which users are missing records
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.subscription_status
FROM users u
WHERE NOT EXISTS (
  SELECT 1 
  FROM user_session_limits usl 
  WHERE usl.user_id = u.id
)
ORDER BY u.full_name;

-- Create records for ALL users (including those that might have been missed)
INSERT INTO user_session_limits (user_id, sessions_this_month, sessions_limit, monthly_credits, purchased_credits, last_reset_date, user_name)
SELECT 
  u.id as user_id,
  0 as sessions_this_month,
  CASE 
    WHEN u.subscription_status IN ('active', 'trialing') THEN 50
    ELSE 5
  END as sessions_limit,
  CASE 
    WHEN u.subscription_status IN ('active', 'trialing') THEN 50
    ELSE NULL
  END as monthly_credits,
  0 as purchased_credits,
  CURRENT_DATE as last_reset_date,
  u.full_name as user_name
FROM users u
WHERE NOT EXISTS (
  SELECT 1 
  FROM user_session_limits usl 
  WHERE usl.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Update user_name for all existing records
UPDATE user_session_limits usl
SET user_name = u.full_name
FROM users u
WHERE usl.user_id = u.id
  AND (usl.user_name IS NULL OR usl.user_name != u.full_name);

-- Final verification - show all records
SELECT 
  COUNT(*) as total_records_in_user_session_limits
FROM user_session_limits;

-- Show all users with their limits (for verification)
SELECT 
  u.id,
  u.email,
  COALESCE(usl.user_name, u.full_name) as user_name,
  u.subscription_status,
  COALESCE(usl.sessions_this_month, 0) as sessions_used,
  COALESCE(usl.sessions_limit, 
    CASE 
      WHEN u.subscription_status IN ('active', 'trialing') THEN 50
      ELSE 5
    END
  ) as sessions_limit,
  (COALESCE(usl.sessions_limit, 
    CASE 
      WHEN u.subscription_status IN ('active', 'trialing') THEN 50
      ELSE 5
    END
  ) - COALESCE(usl.sessions_this_month, 0)) as credits_remaining
FROM users u
LEFT JOIN user_session_limits usl ON u.id = usl.user_id
ORDER BY COALESCE(usl.user_name, u.full_name);

