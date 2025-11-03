-- Migration: 052_credit_based_pricing
-- Change from unlimited to credit-based pricing for paid users
-- Paid users get 50 credits per month, can purchase extra credits

-- Add columns to track purchased credits and monthly credits
ALTER TABLE user_session_limits
ADD COLUMN IF NOT EXISTS monthly_credits INTEGER DEFAULT NULL, -- NULL = free user, 50 = paid user
ADD COLUMN IF NOT EXISTS purchased_credits INTEGER DEFAULT 0; -- Extra credits bought

-- Update existing paid users to have 50 monthly credits
UPDATE user_session_limits
SET monthly_credits = 50,
    sessions_limit = 50
WHERE user_id IN (
  SELECT id FROM users 
  WHERE subscription_status IN ('active', 'trialing')
);

-- Update check_user_session_limit function to handle credit-based system
CREATE OR REPLACE FUNCTION check_user_session_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_limit_record RECORD;
  v_subscription_status TEXT;
  v_total_credits INTEGER;
  v_monthly_credits INTEGER;
  v_purchased_credits INTEGER;
  v_credits_used INTEGER;
BEGIN
  -- Get subscription status
  SELECT subscription_status INTO v_subscription_status
  FROM users WHERE id = p_user_id;

  -- Get or create limit record
  INSERT INTO user_session_limits (user_id, sessions_this_month, sessions_limit, monthly_credits, purchased_credits)
  VALUES (p_user_id, 0, 
    CASE 
      WHEN v_subscription_status IN ('active', 'trialing') THEN 50 
      ELSE 5 
    END,
    CASE 
      WHEN v_subscription_status IN ('active', 'trialing') THEN 50 
      ELSE NULL 
    END,
    0
  )
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_limit_record
  FROM user_session_limits
  WHERE user_id = p_user_id;

  -- Reset monthly credits if new month (for paid users)
  IF v_limit_record.last_reset_date < DATE_TRUNC('month', CURRENT_DATE)::DATE THEN
    IF v_limit_record.monthly_credits IS NOT NULL THEN
      -- Reset monthly credits and reset purchased credits to 0
      UPDATE user_session_limits
      SET sessions_this_month = 0,
          sessions_limit = COALESCE(monthly_credits, 5) + purchased_credits,
          purchased_credits = 0, -- Reset purchased credits at start of new month
          last_reset_date = CURRENT_DATE
      WHERE user_id = p_user_id;
      
      -- Refresh the record
      SELECT * INTO v_limit_record
      FROM user_session_limits
      WHERE user_id = p_user_id;
    ELSE
      -- Free user - just reset monthly count
      UPDATE user_session_limits
      SET sessions_this_month = 0,
          last_reset_date = CURRENT_DATE
      WHERE user_id = p_user_id;
      
      SELECT * INTO v_limit_record
      FROM user_session_limits
      WHERE user_id = p_user_id;
    END IF;
  END IF;

  -- Calculate total available credits
  v_monthly_credits := COALESCE(v_limit_record.monthly_credits, v_limit_record.sessions_limit);
  v_purchased_credits := COALESCE(v_limit_record.purchased_credits, 0);
  v_total_credits := v_monthly_credits + v_purchased_credits;
  v_credits_used := v_limit_record.sessions_this_month;

  -- Check if under limit
  RETURN v_credits_used < v_total_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update increment function to properly handle credits
CREATE OR REPLACE FUNCTION increment_user_session_count(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_subscription_status TEXT;
  v_monthly_credits INTEGER;
BEGIN
  -- Get subscription status
  SELECT subscription_status INTO v_subscription_status
  FROM users WHERE id = p_user_id;

  -- Determine monthly credits based on subscription
  v_monthly_credits := CASE 
    WHEN v_subscription_status IN ('active', 'trialing') THEN 50 
    ELSE 5 
  END;

  -- Insert or update session count
  INSERT INTO user_session_limits (user_id, sessions_this_month, sessions_limit, monthly_credits)
  VALUES (p_user_id, 1, v_monthly_credits, 
    CASE WHEN v_subscription_status IN ('active', 'trialing') THEN 50 ELSE NULL END
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    sessions_this_month = user_session_limits.sessions_this_month + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to grant credits when subscription activates
CREATE OR REPLACE FUNCTION grant_subscription_credits(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Ensure record exists
  INSERT INTO user_session_limits (user_id, sessions_this_month, sessions_limit, monthly_credits, purchased_credits)
  VALUES (p_user_id, 0, 50, 50, 0)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    monthly_credits = 50,
    sessions_limit = 50 + COALESCE(user_session_limits.purchased_credits, 0),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to purchase extra credits
CREATE OR REPLACE FUNCTION purchase_extra_credits(p_user_id UUID, p_credits INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_current_purchased INTEGER;
  v_new_limit INTEGER;
BEGIN
  -- Get current purchased credits
  SELECT COALESCE(purchased_credits, 0) INTO v_current_purchased
  FROM user_session_limits
  WHERE user_id = p_user_id;

  -- Update purchased credits
  UPDATE user_session_limits
  SET purchased_credits = v_current_purchased + p_credits,
      sessions_limit = COALESCE(monthly_credits, sessions_limit) + v_current_purchased + p_credits,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Return new total purchased credits
  RETURN v_current_purchased + p_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for tracking
COMMENT ON FUNCTION check_user_session_limit(UUID) IS 'Updated to credit-based system - paid users get 50/month, can purchase extra - Migration 052';
COMMENT ON FUNCTION purchase_extra_credits(UUID, INTEGER) IS 'Adds purchased credits to user account - Migration 052';
COMMENT ON COLUMN user_session_limits.monthly_credits IS 'Monthly credits from subscription (50 for paid, NULL for free)';
COMMENT ON COLUMN user_session_limits.purchased_credits IS 'Extra credits purchased by user, resets monthly';

