-- Migration: 063_populate_user_session_limits_for_all_users
-- Create user_session_limits records for all users who don't have one
-- Also populate user_name column and set appropriate limits based on subscription status

-- Create user_session_limits records for all users who don't have one
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

-- Update user_name for existing records that don't have it
UPDATE user_session_limits usl
SET user_name = u.full_name
FROM users u
WHERE usl.user_id = u.id
  AND (usl.user_name IS NULL OR usl.user_name = '');

-- Update limits for existing records based on subscription status
UPDATE user_session_limits usl
SET 
  sessions_limit = CASE 
    WHEN u.subscription_status IN ('active', 'trialing') THEN 50
    ELSE 5
  END,
  monthly_credits = CASE 
    WHEN u.subscription_status IN ('active', 'trialing') THEN 50
    ELSE NULL
  END
FROM users u
WHERE usl.user_id = u.id
  AND (
    -- Update if limit doesn't match subscription status
    (u.subscription_status IN ('active', 'trialing') AND usl.sessions_limit != 50)
    OR
    (u.subscription_status NOT IN ('active', 'trialing') AND usl.sessions_limit != 5)
  );

-- Show summary
SELECT 
  COUNT(*) as total_users,
  COUNT(usl.user_id) as users_with_limits,
  COUNT(*) - COUNT(usl.user_id) as users_without_limits
FROM users u
LEFT JOIN user_session_limits usl ON u.id = usl.user_id;

-- Show all users with their limits (useful query for viewing)
-- This query works without the credits column in users table
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.subscription_status,
  COALESCE(usl.user_name, u.full_name) as user_name,
  COALESCE(usl.sessions_this_month, 0) as sessions_used,
  COALESCE(usl.sessions_limit, 
    CASE 
      WHEN u.subscription_status IN ('active', 'trialing') THEN 50
      ELSE 5
    END
  ) as sessions_limit,
  COALESCE(usl.monthly_credits, 
    CASE 
      WHEN u.subscription_status IN ('active', 'trialing') THEN 50
      ELSE NULL
    END
  ) as monthly_credits,
  COALESCE(usl.purchased_credits, 0) as purchased_credits,
  (COALESCE(usl.sessions_limit, 
    CASE 
      WHEN u.subscription_status IN ('active', 'trialing') THEN 50
      ELSE 5
    END
  ) - COALESCE(usl.sessions_this_month, 0)) as credits_remaining
FROM users u
LEFT JOIN user_session_limits usl ON u.id = usl.user_id
ORDER BY u.full_name;

