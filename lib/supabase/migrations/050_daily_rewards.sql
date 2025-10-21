-- Daily Rewards System
-- Track daily login rewards and streaks

-- Create daily_rewards table
CREATE TABLE IF NOT EXISTS daily_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_claim_date DATE NOT NULL,
  current_streak INTEGER DEFAULT 1,
  longest_streak INTEGER DEFAULT 1,
  total_rewards_claimed INTEGER DEFAULT 1,
  total_virtual_earnings DECIMAL(10, 2) DEFAULT 25.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One record per user
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_daily_rewards_user_id ON daily_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_rewards_last_claim ON daily_rewards(last_claim_date);

-- Enable RLS
ALTER TABLE daily_rewards ENABLE ROW LEVEL SECURITY;

-- Users can view their own rewards
CREATE POLICY "Users can view own daily rewards"
  ON daily_rewards FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own rewards
CREATE POLICY "Users can insert own daily rewards"
  ON daily_rewards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own rewards
CREATE POLICY "Users can update own daily rewards"
  ON daily_rewards FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to check if user can claim daily reward
CREATE OR REPLACE FUNCTION can_claim_daily_reward(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_last_claim_date DATE;
BEGIN
  SELECT last_claim_date INTO v_last_claim_date
  FROM daily_rewards
  WHERE user_id = p_user_id;
  
  -- If no record exists, user can claim
  IF v_last_claim_date IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- If last claim was before today, user can claim
  RETURN v_last_claim_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to claim daily reward
CREATE OR REPLACE FUNCTION claim_daily_reward(p_user_id UUID)
RETURNS TABLE(
  success BOOLEAN,
  reward_amount DECIMAL,
  new_streak INTEGER,
  is_streak_bonus BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_last_claim_date DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_total_rewards INTEGER;
  v_total_earnings DECIMAL;
  v_reward_amount DECIMAL;
  v_new_streak INTEGER;
  v_is_streak_bonus BOOLEAN := FALSE;
  v_days_since_last_claim INTEGER;
BEGIN
  -- Get existing reward data
  SELECT 
    dr.last_claim_date,
    dr.current_streak,
    dr.longest_streak,
    dr.total_rewards_claimed,
    dr.total_virtual_earnings
  INTO 
    v_last_claim_date,
    v_current_streak,
    v_longest_streak,
    v_total_rewards,
    v_total_earnings
  FROM daily_rewards dr
  WHERE dr.user_id = p_user_id;
  
  -- Check if already claimed today
  IF v_last_claim_date = CURRENT_DATE THEN
    RETURN QUERY SELECT FALSE, 0.00::DECIMAL, v_current_streak, FALSE, 'Already claimed today'::TEXT;
    RETURN;
  END IF;
  
  -- Calculate base reward
  v_reward_amount := 25.00;
  
  -- Calculate streak
  IF v_last_claim_date IS NULL THEN
    -- First time claiming
    v_new_streak := 1;
  ELSE
    v_days_since_last_claim := CURRENT_DATE - v_last_claim_date;
    
    IF v_days_since_last_claim = 1 THEN
      -- Continuing streak
      v_new_streak := v_current_streak + 1;
    ELSE
      -- Streak broken, reset
      v_new_streak := 1;
    END IF;
  END IF;
  
  -- Apply streak bonuses
  IF v_new_streak >= 7 THEN
    v_reward_amount := v_reward_amount + 50.00; -- Week streak bonus
    v_is_streak_bonus := TRUE;
  ELSIF v_new_streak >= 3 THEN
    v_reward_amount := v_reward_amount + 10.00; -- 3-day streak bonus
  END IF;
  
  -- Update longest streak if applicable
  IF v_longest_streak IS NULL OR v_new_streak > v_longest_streak THEN
    v_longest_streak := v_new_streak;
  END IF;
  
  -- Update virtual earnings in users table
  UPDATE users
  SET virtual_earnings = COALESCE(virtual_earnings, 0) + v_reward_amount
  WHERE id = p_user_id;
  
  -- Insert or update daily_rewards record
  INSERT INTO daily_rewards (
    user_id,
    last_claim_date,
    current_streak,
    longest_streak,
    total_rewards_claimed,
    total_virtual_earnings,
    updated_at
  )
  VALUES (
    p_user_id,
    CURRENT_DATE,
    v_new_streak,
    v_longest_streak,
    1,
    v_reward_amount,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    last_claim_date = CURRENT_DATE,
    current_streak = v_new_streak,
    longest_streak = GREATEST(daily_rewards.longest_streak, v_new_streak),
    total_rewards_claimed = daily_rewards.total_rewards_claimed + 1,
    total_virtual_earnings = daily_rewards.total_virtual_earnings + v_reward_amount,
    updated_at = NOW();
  
  -- Return success with reward details
  RETURN QUERY SELECT 
    TRUE, 
    v_reward_amount, 
    v_new_streak, 
    v_is_streak_bonus,
    CASE 
      WHEN v_is_streak_bonus THEN 'Week streak bonus! +$50'
      WHEN v_new_streak >= 3 THEN '3-day streak bonus! +$10'
      ELSE 'Daily reward claimed!'
    END::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add virtual_earnings column to users if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS virtual_earnings DECIMAL(10, 2) DEFAULT 0.00;

-- Create index for virtual earnings
CREATE INDEX IF NOT EXISTS idx_users_virtual_earnings ON users(virtual_earnings);

