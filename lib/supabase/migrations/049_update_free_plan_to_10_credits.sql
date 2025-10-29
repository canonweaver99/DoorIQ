-- Update free plan from 5 to 10 credits per month
-- Migration: 049_update_free_plan_to_10_credits

-- Update the default session limit for all existing free users
UPDATE user_session_limits
SET sessions_limit = 10
WHERE sessions_limit = 5;

-- Update the check_user_session_limit function to use 10 as default
CREATE OR REPLACE FUNCTION check_user_session_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_limit_record RECORD;
  v_subscription_status TEXT;
BEGIN
  -- Get subscription status
  SELECT subscription_status INTO v_subscription_status
  FROM users WHERE id = p_user_id;

  -- Active or trialing users have unlimited access
  IF v_subscription_status IN ('active', 'trialing') THEN
    RETURN TRUE;
  END IF;

  -- Get or create limit record with 10 credits default
  INSERT INTO user_session_limits (user_id, sessions_this_month, sessions_limit)
  VALUES (p_user_id, 0, 10)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_limit_record
  FROM user_session_limits
  WHERE user_id = p_user_id;

  -- Reset if new month
  IF v_limit_record.last_reset_date < DATE_TRUNC('month', CURRENT_DATE)::DATE THEN
    UPDATE user_session_limits
    SET sessions_this_month = 0,
        last_reset_date = CURRENT_DATE
    WHERE user_id = p_user_id;
    RETURN TRUE;
  END IF;

  -- Check if under limit
  RETURN v_limit_record.sessions_this_month < v_limit_record.sessions_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the increment_user_session_count function to use 10 as default
CREATE OR REPLACE FUNCTION increment_user_session_count(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_session_limits (user_id, sessions_this_month, sessions_limit)
  VALUES (p_user_id, 1, 10)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    sessions_this_month = user_session_limits.sessions_this_month + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for tracking
COMMENT ON FUNCTION check_user_session_limit(UUID) IS 'Updated to 10 credits per month for free users - Migration 049';

