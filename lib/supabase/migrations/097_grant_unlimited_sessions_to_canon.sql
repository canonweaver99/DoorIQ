-- Migration: Grant unlimited sessions to canonweaver@loopline.design
-- This ensures the admin user has unlimited session access

-- Set subscription status to 'active' for unlimited sessions
-- The check_user_session_limit function returns TRUE for active/trialing users
UPDATE users
SET subscription_status = 'active',
    credits = 999999, -- Set very high credits as backup
    updated_at = NOW()
WHERE email = 'canonweaver@loopline.design';

-- Also update user_session_limits to ensure unlimited access
UPDATE user_session_limits
SET sessions_limit = 999999,
    monthly_credits = 999999,
    sessions_this_month = 0,
    updated_at = NOW()
WHERE user_id = (SELECT id FROM users WHERE email = 'canonweaver@loopline.design');

-- Create user_session_limits record if it doesn't exist
INSERT INTO user_session_limits (user_id, sessions_this_month, sessions_limit, monthly_credits, purchased_credits, last_reset_date)
SELECT 
  id,
  0,
  999999,
  999999,
  0,
  CURRENT_DATE
FROM users
WHERE email = 'canonweaver@loopline.design'
  AND id NOT IN (SELECT user_id FROM user_session_limits WHERE user_id = (SELECT id FROM users WHERE email = 'canonweaver@loopline.design'));

-- Verify the update
DO $$
DECLARE
  v_user_id UUID;
  v_subscription_status TEXT;
  v_credits INTEGER;
  v_sessions_limit INTEGER;
BEGIN
  SELECT id, subscription_status, credits INTO v_user_id, v_subscription_status, v_credits
  FROM users
  WHERE email = 'canonweaver@loopline.design';
  
  SELECT sessions_limit INTO v_sessions_limit
  FROM user_session_limits
  WHERE user_id = v_user_id;
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE '⚠️ User canonweaver@loopline.design not found';
  ELSE
    RAISE NOTICE '✅ User found: %', v_user_id;
    RAISE NOTICE '✅ Subscription status: %', v_subscription_status;
    RAISE NOTICE '✅ Credits: %', v_credits;
    RAISE NOTICE '✅ Session limit: %', v_sessions_limit;
  END IF;
END $$;

COMMENT ON FUNCTION check_user_session_limit(UUID) IS 'Returns TRUE for active/trialing users (unlimited sessions). For canonweaver@loopline.design, subscription_status is set to active for unlimited access.';

