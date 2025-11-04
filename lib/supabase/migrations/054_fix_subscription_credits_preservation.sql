-- Migration: 054_fix_subscription_credits_preservation
-- Fix grant_subscription_credits to preserve existing free credits when user subscribes

-- Function to grant credits when subscription activates
-- This now preserves any remaining credits the user had before subscribing
CREATE OR REPLACE FUNCTION grant_subscription_credits(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_current_limit RECORD;
  v_remaining_credits INTEGER;
BEGIN
  -- Get current limit record to check for existing credits
  SELECT * INTO v_current_limit
  FROM user_session_limits
  WHERE user_id = p_user_id;

  -- Calculate remaining credits from old limit (if any)
  IF v_current_limit IS NOT NULL THEN
    -- Calculate: remaining = limit - used
    -- If they were a free user, their limit was 5, so we preserve any unused credits
    v_remaining_credits := GREATEST(0, 
      COALESCE(v_current_limit.sessions_limit, 0) - COALESCE(v_current_limit.sessions_this_month, 0)
    );
    
    -- If they had monthly_credits (paid user upgrading), use purchased_credits
    -- Otherwise, convert remaining free credits to purchased_credits
    IF v_current_limit.monthly_credits IS NOT NULL THEN
      -- Already a paid user - just preserve their purchased credits
      v_remaining_credits := COALESCE(v_current_limit.purchased_credits, 0);
    ELSE
      -- Free user subscribing - convert remaining free credits to purchased credits
      -- This preserves their unused credits (e.g., if they had 5 free and used 0, they get 5 + 50 = 55)
      v_remaining_credits := v_remaining_credits + COALESCE(v_current_limit.purchased_credits, 0);
    END IF;
  ELSE
    -- No existing record, start fresh
    v_remaining_credits := 0;
  END IF;

  -- Ensure record exists and update with subscription credits
  INSERT INTO user_session_limits (user_id, sessions_this_month, sessions_limit, monthly_credits, purchased_credits)
  VALUES (p_user_id, COALESCE(v_current_limit.sessions_this_month, 0), 50 + v_remaining_credits, 50, v_remaining_credits)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    monthly_credits = 50,
    purchased_credits = v_remaining_credits,
    sessions_limit = 50 + v_remaining_credits,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

