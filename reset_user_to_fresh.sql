-- Reset canonweaver@loopline.design account to fresh user state
-- This makes them appear as if they just signed up for the first time

-- Step 1: Reset user subscription and billing fields
UPDATE users
SET 
  -- Subscription fields
  subscription_status = NULL,
  subscription_id = NULL,
  stripe_customer_id = NULL,
  subscription_plan = NULL,
  subscription_current_period_end = NULL,
  trial_ends_at = NULL,
  subscription_cancel_at_period_end = FALSE,
  trial_start_date = NULL,
  stripe_price_id = NULL,
  subscription_features = '[]'::jsonb,
  last_payment_date = NULL,
  
  -- Credits and limits (fresh user gets 5 credits)
  credits = 5,
  last_daily_credit_reset = CURRENT_DATE,
  
  -- Organization (remove from any organization)
  organization_id = NULL,
  
  -- Reset earnings
  virtual_earnings = 0,
  
  -- Update timestamp
  updated_at = NOW()
WHERE email = 'canonweaver@loopline.design';

-- Step 2: Reset user_session_limits to free tier defaults
UPDATE user_session_limits
SET 
  sessions_this_month = 0,
  sessions_limit = 5,  -- Free tier limit
  monthly_credits = NULL,  -- NULL = free user (not paid)
  purchased_credits = 0,
  last_reset_date = CURRENT_DATE,
  updated_at = NOW()
WHERE user_id = (SELECT id FROM users WHERE email = 'canonweaver@loopline.design');

-- If user_session_limits doesn't exist, create it
INSERT INTO user_session_limits (
  user_id,
  sessions_this_month,
  sessions_limit,
  monthly_credits,
  purchased_credits,
  last_reset_date
)
SELECT 
  id,
  0,
  5,
  NULL,
  0,
  CURRENT_DATE
FROM users
WHERE email = 'canonweaver@loopline.design'
  AND id NOT IN (SELECT user_id FROM user_session_limits WHERE user_id = (SELECT id FROM users WHERE email = 'canonweaver@loopline.design'))
ON CONFLICT (user_id) DO NOTHING;

-- Step 3: Delete all subscription events for this user (if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'subscription_events'
  ) THEN
    DELETE FROM subscription_events
    WHERE user_id = (SELECT id FROM users WHERE email = 'canonweaver@loopline.design');
  END IF;
END $$;

-- Step 4: Verify the reset (optional - shows what was changed)
SELECT 
  id,
  email,
  full_name,
  subscription_status,
  stripe_customer_id,
  credits,
  organization_id,
  virtual_earnings,
  last_daily_credit_reset
FROM users
WHERE email = 'canonweaver@loopline.design';

-- Also verify session limits
SELECT 
  user_id,
  sessions_this_month,
  sessions_limit,
  monthly_credits,
  purchased_credits,
  last_reset_date
FROM user_session_limits
WHERE user_id = (SELECT id FROM users WHERE email = 'canonweaver@loopline.design');

