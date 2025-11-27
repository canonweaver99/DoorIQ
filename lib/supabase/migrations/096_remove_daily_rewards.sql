-- Migration: Remove Daily Rewards System
-- Drops the daily_rewards table and related functions

-- Drop functions first (they depend on the table)
DROP FUNCTION IF EXISTS claim_daily_reward(UUID);
DROP FUNCTION IF EXISTS can_claim_daily_reward(UUID);

-- Drop indexes
DROP INDEX IF EXISTS idx_daily_rewards_user_id;
DROP INDEX IF EXISTS idx_daily_rewards_last_claim;

-- Drop RLS policies
DROP POLICY IF EXISTS "Users can view own daily rewards" ON daily_rewards;
DROP POLICY IF EXISTS "Users can insert own daily rewards" ON daily_rewards;
DROP POLICY IF EXISTS "Users can update own daily rewards" ON daily_rewards;

-- Drop the table
DROP TABLE IF EXISTS daily_rewards CASCADE;

-- Note: We keep virtual_earnings column in users table as it's used elsewhere
-- Note: We keep idx_users_virtual_earnings index as it's still useful

COMMENT ON TABLE users IS 'User profiles. Daily rewards system has been removed.';

