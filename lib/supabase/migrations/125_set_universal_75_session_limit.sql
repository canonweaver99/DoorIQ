-- Set universal 75 session limit for all users (anti-spam measure)
-- Migration: 125_set_universal_75_session_limit.sql
-- Date: 2025-01-XX
-- Purpose: Simplify session limits - everyone gets 75 calls per month to prevent bots/spam

-- ============================================
-- 1. Update all existing users to 75 credits
-- ============================================

-- Set all users to 75 credits (monthly limit)
UPDATE users
SET credits = 75
WHERE credits IS NULL OR credits < 75;

-- Reset credits to 75 for users who have used all their credits
-- (This gives them a fresh start with the new limit)
UPDATE users
SET credits = 75
WHERE credits = 0;

-- ============================================
-- 2. Update all user_session_limits to 75
-- ============================================

-- Update existing records
UPDATE user_session_limits
SET sessions_limit = 75
WHERE sessions_limit != 75;

-- Create records for users who don't have one
INSERT INTO user_session_limits (user_id, sessions_this_month, sessions_limit, last_reset_date)
SELECT 
  id,
  0,
  75,
  CURRENT_DATE
FROM users
WHERE id NOT IN (SELECT user_id FROM user_session_limits)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- 3. Simplify check_user_session_limit function
-- ============================================
-- Everyone gets 75 calls per month, regardless of subscription status

CREATE OR REPLACE FUNCTION check_user_session_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_credits INTEGER;
  v_limit_record RECORD;
BEGIN
  -- Get user's credits (default to 75 if NULL)
  SELECT COALESCE(credits, 75) INTO v_user_credits
  FROM users
  WHERE id = p_user_id;

  -- If user doesn't exist, return false
  IF v_user_credits IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Ensure user has credits record (set to 75 if missing)
  IF v_user_credits IS NULL OR v_user_credits = 0 THEN
    UPDATE users
    SET credits = 75
    WHERE id = p_user_id;
    v_user_credits := 75;
  END IF;

  -- Get or create limit record for tracking
  INSERT INTO user_session_limits (user_id, sessions_this_month, sessions_limit, last_reset_date)
  VALUES (p_user_id, 0, 75, CURRENT_DATE)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_limit_record
  FROM user_session_limits
  WHERE user_id = p_user_id;

  -- Reset if new month (monthly reset)
  IF v_limit_record.last_reset_date < DATE_TRUNC('month', CURRENT_DATE)::DATE THEN
    UPDATE user_session_limits
    SET sessions_this_month = 0,
        last_reset_date = CURRENT_DATE
    WHERE user_id = p_user_id;
    
    -- Also reset credits to 75 for the new month
    UPDATE users
    SET credits = 75
    WHERE id = p_user_id;
    
    RETURN TRUE;
  END IF;

  -- Check if user has credits available
  RETURN v_user_credits > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. Simplify increment_user_session_count function
-- ============================================
-- Decrement credits and update session count tracking

CREATE OR REPLACE FUNCTION increment_user_session_count(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_current_credits INTEGER;
BEGIN
  -- Get current credits
  SELECT COALESCE(credits, 75) INTO v_current_credits
  FROM users
  WHERE id = p_user_id;

  -- Decrement credits if available
  IF v_current_credits > 0 THEN
    UPDATE users
    SET credits = credits - 1,
        updated_at = NOW()
    WHERE id = p_user_id;
  END IF;

  -- Update session count for tracking (always use 75 as limit)
  INSERT INTO user_session_limits (user_id, sessions_this_month, sessions_limit, last_reset_date)
  VALUES (p_user_id, 1, 75, CURRENT_DATE)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    sessions_this_month = user_session_limits.sessions_this_month + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. Update grant_subscription_credits function
-- ============================================
-- Everyone gets 75 credits monthly (no subscription-based differences)

CREATE OR REPLACE FUNCTION grant_subscription_credits(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Set credits to 75 for everyone (monthly reset)
  UPDATE users
  SET credits = 75,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Reset session count tracking
  INSERT INTO user_session_limits (user_id, sessions_this_month, sessions_limit, last_reset_date)
  VALUES (p_user_id, 0, 75, CURRENT_DATE)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    sessions_this_month = 0,
    last_reset_date = CURRENT_DATE,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. Add comments
-- ============================================

COMMENT ON FUNCTION check_user_session_limit(UUID) IS 'Universal 75 session limit for all users. Monthly reset. Anti-spam measure.';
COMMENT ON FUNCTION increment_user_session_count(UUID) IS 'Decrements user credits and tracks session count. Universal 75 limit for all users.';
COMMENT ON FUNCTION grant_subscription_credits(UUID) IS 'Grants 75 credits to user (monthly reset). Universal limit for all users.';

-- ============================================
-- 7. Update default for new users
-- ============================================
-- Set default credits to 75 for new users

ALTER TABLE users 
ALTER COLUMN credits SET DEFAULT 75;

-- ============================================
-- Migration Complete
-- ============================================
-- Summary:
-- ✅ All users set to 75 credits
-- ✅ All user_session_limits set to 75
-- ✅ Functions simplified (no subscription-based logic)
-- ✅ Monthly reset to 75 credits
-- ✅ Anti-spam protection maintained




