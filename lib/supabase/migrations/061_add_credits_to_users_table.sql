-- Migration: 061_add_credits_to_users_table
-- Add credits column directly to users table for simpler credit management

-- Add credits column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0;

-- Initialize credits for existing users based on their current subscription status and session limits
UPDATE users u
SET credits = COALESCE(
  CASE 
    -- Paid/trialing users: monthly_credits + purchased_credits - sessions_this_month
    WHEN u.subscription_status IN ('active', 'trialing') THEN
      COALESCE(usl.monthly_credits, 50) + COALESCE(usl.purchased_credits, 0) - COALESCE(usl.sessions_this_month, 0)
    -- Free users: sessions_limit - sessions_this_month
    ELSE
      COALESCE(usl.sessions_limit, 5) - COALESCE(usl.sessions_this_month, 0)
  END,
  CASE 
    WHEN u.subscription_status IN ('active', 'trialing') THEN 50
    ELSE 5
  END
)
FROM user_session_limits usl
WHERE u.id = usl.user_id;

-- Set default credits for users without session limits records
UPDATE users
SET credits = CASE 
  WHEN subscription_status IN ('active', 'trialing') THEN 50
  ELSE 5
END
WHERE credits IS NULL OR credits = 0
  AND id NOT IN (SELECT user_id FROM user_session_limits);

-- Update check_user_session_limit function to use users.credits
CREATE OR REPLACE FUNCTION check_user_session_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_credits INTEGER;
BEGIN
  -- Get user's credits directly from users table
  SELECT COALESCE(credits, 
    CASE 
      WHEN subscription_status IN ('active', 'trialing') THEN 50
      ELSE 5
    END
  ) INTO v_user_credits
  FROM users
  WHERE id = p_user_id;

  -- Ensure user has credits record
  IF v_user_credits IS NULL THEN
    UPDATE users
    SET credits = CASE 
      WHEN subscription_status IN ('active', 'trialing') THEN 50
      ELSE 5
    END
    WHERE id = p_user_id;
    
    SELECT credits INTO v_user_credits
    FROM users
    WHERE id = p_user_id;
  END IF;

  -- Check if user has credits available
  RETURN v_user_credits > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update increment function to decrement credits directly
CREATE OR REPLACE FUNCTION increment_user_session_count(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_current_credits INTEGER;
BEGIN
  -- Get current credits
  SELECT COALESCE(credits, 0) INTO v_current_credits
  FROM users
  WHERE id = p_user_id;

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

-- Update grant_subscription_credits to set credits directly
CREATE OR REPLACE FUNCTION grant_subscription_credits(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_current_credits INTEGER;
BEGIN
  -- Get current credits
  SELECT COALESCE(credits, 0) INTO v_current_credits
  FROM users
  WHERE id = p_user_id;

  -- Set credits to 50 (monthly subscription credits) plus any existing credits
  -- This preserves any credits they already had
  UPDATE users
  SET credits = 50 + v_current_credits,
      updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update purchase_extra_credits to add to users.credits
CREATE OR REPLACE FUNCTION purchase_extra_credits(p_user_id UUID, p_credits INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_new_total INTEGER;
BEGIN
  -- Add credits directly to users table
  UPDATE users
  SET credits = COALESCE(credits, 0) + p_credits,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Return new total
  SELECT credits INTO v_new_total
  FROM users
  WHERE id = p_user_id;

  RETURN v_new_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to grant credits directly (for admin use)
CREATE OR REPLACE FUNCTION grant_credits(p_user_id UUID, p_credits INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_new_total INTEGER;
BEGIN
  -- Add credits directly to users table
  UPDATE users
  SET credits = COALESCE(credits, 0) + p_credits,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Return new total
  SELECT credits INTO v_new_total
  FROM users
  WHERE id = p_user_id;

  RETURN v_new_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON COLUMN users.credits IS 'Direct credit balance for user. Used for session limits. Can be modified directly.';
COMMENT ON FUNCTION grant_credits(UUID, INTEGER) IS 'Grant credits directly to user - for admin use';

