-- Migration: 067_daily_free_credits_for_new_users
-- Add daily credit reset system for new users (5 credits per day, doesn't stack)
-- Only applies to users created after this migration date

-- Add column to track last daily credit reset date
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_daily_credit_reset DATE DEFAULT NULL;

-- Create a function to get the daily credits cutoff date
-- This allows easy updating of the cutoff date if needed
CREATE OR REPLACE FUNCTION get_daily_credits_cutoff_date()
RETURNS DATE AS $$
BEGIN
  -- IMPORTANT: Set this to the EXACT deployment date when running this migration
  -- Users created on or after this date will get daily credit resets (5 credits per day, doesn't stack)
  -- Users created before this date will NOT get daily resets (existing behavior)
  -- 
  -- EXAMPLE: If deploying on January 15, 2025, change to:
  -- RETURN '2025-01-15'::DATE;
  --
  -- DO NOT use CURRENT_DATE here - it will change every day!
  -- You want a FIXED date that represents when this feature was deployed.
  RETURN '2025-01-15'::DATE; -- CHANGE THIS to your actual deployment date!
END;
$$ LANGUAGE plpgsql STABLE;

-- Update check_user_session_limit function to handle daily credit resets for new free users
CREATE OR REPLACE FUNCTION check_user_session_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_credits INTEGER;
  v_subscription_status TEXT;
  v_user_created_at TIMESTAMPTZ;
  v_last_reset_date DATE;
  -- Get cutoff date from function (set in get_daily_credits_cutoff_date function above)
  v_cutoff_date DATE := get_daily_credits_cutoff_date();
  v_is_new_user BOOLEAN;
BEGIN
  -- Get user's subscription status and created_at
  SELECT 
    COALESCE(credits, 0),
    subscription_status,
    created_at,
    last_daily_credit_reset
  INTO 
    v_user_credits,
    v_subscription_status,
    v_user_created_at,
    v_last_reset_date
  FROM users
  WHERE id = p_user_id;

  -- Determine if this is a "new user" (created after cutoff date)
  v_is_new_user := v_user_created_at::DATE >= v_cutoff_date;

  -- For new free users: reset credits to 5 daily (doesn't stack)
  IF v_is_new_user 
     AND v_subscription_status NOT IN ('active', 'trialing')
     AND v_last_reset_date IS DISTINCT FROM CURRENT_DATE THEN
    
    -- Reset credits to 5 (not adding, just setting to 5)
    UPDATE users
    SET credits = 5,
        last_daily_credit_reset = CURRENT_DATE,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    v_user_credits := 5;
    
    -- Log the reset (optional, for debugging)
    RAISE NOTICE 'Daily credit reset for new user %: credits set to 5', p_user_id;
  END IF;

  -- For existing users or paid users, use existing logic
  IF v_user_credits IS NULL OR v_user_credits = 0 THEN
    -- Initialize credits if not set
    UPDATE users
    SET credits = CASE 
      WHEN subscription_status IN ('active', 'trialing') THEN 50
      ELSE 5
    END
    WHERE id = p_user_id;
    
    SELECT COALESCE(credits, 
      CASE 
        WHEN subscription_status IN ('active', 'trialing') THEN 50
        ELSE 5
      END
    ) INTO v_user_credits
    FROM users
    WHERE id = p_user_id;
  END IF;

  -- Check if user has credits available
  RETURN v_user_credits > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update increment function to also check for daily reset before decrementing
CREATE OR REPLACE FUNCTION increment_user_session_count(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_current_credits INTEGER;
  v_subscription_status TEXT;
  v_user_created_at TIMESTAMPTZ;
  v_last_reset_date DATE;
  -- Get cutoff date from function (set in get_daily_credits_cutoff_date function above)
  v_cutoff_date DATE := get_daily_credits_cutoff_date();
  v_is_new_user BOOLEAN;
BEGIN
  -- Get user info
  SELECT 
    COALESCE(credits, 0),
    subscription_status,
    created_at,
    last_daily_credit_reset
  INTO 
    v_current_credits,
    v_subscription_status,
    v_user_created_at,
    v_last_reset_date
  FROM users
  WHERE id = p_user_id;

  -- Determine if this is a "new user"
  v_is_new_user := v_user_created_at::DATE >= v_cutoff_date;

  -- For new free users: reset credits to 5 daily before decrementing if needed
  IF v_is_new_user 
     AND v_subscription_status NOT IN ('active', 'trialing')
     AND v_last_reset_date IS DISTINCT FROM CURRENT_DATE THEN
    
    -- Reset credits to 5 first
    UPDATE users
    SET credits = 5,
        last_daily_credit_reset = CURRENT_DATE,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    v_current_credits := 5;
  END IF;

  -- Decrement credits if available
  IF v_current_credits > 0 THEN
    UPDATE users
    SET credits = credits - 1,
        updated_at = NOW()
    WHERE id = p_user_id;
  END IF;

  -- Also update session count for tracking (but credits are the source of truth)
  INSERT INTO user_session_limits (user_id, sessions_this_month, sessions_limit)
  VALUES (p_user_id, 1, 
    CASE 
      WHEN (SELECT subscription_status FROM users WHERE id = p_user_id) IN ('active', 'trialing') THEN 50 
      ELSE 5 
    END
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    sessions_this_month = user_session_limits.sessions_this_month + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update user creation to set initial daily reset date for new users
-- This will be handled in the API route, but we can add a default here too
COMMENT ON COLUMN users.last_daily_credit_reset IS 'Last date when daily credits were reset. Used for new users (created after cutoff date from get_daily_credits_cutoff_date()) to reset to 5 credits daily.';
COMMENT ON FUNCTION get_daily_credits_cutoff_date() IS 'Returns the cutoff date for daily credit resets. Users created on or after this date get daily resets. Update the return value to set the deployment date.';

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_last_daily_credit_reset ON users(last_daily_credit_reset) WHERE last_daily_credit_reset IS NOT NULL;

