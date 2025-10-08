-- Enable Realtime for Leaderboard Updates
-- This migration enables Supabase Realtime on the users table so the leaderboard
-- can subscribe to changes and update automatically when virtual_earnings change

-- 1) Enable realtime publication for the users table
-- Note: In Supabase, you may need to enable this via the Dashboard as well:
-- Database > Publications > supabase_realtime > Add tables > users

-- First, ensure the users table has RLS enabled (if not already)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2) Create a policy that allows users to read all rep profiles for the leaderboard
-- This is safe because leaderboard data is meant to be public within the organization
DROP POLICY IF EXISTS users_leaderboard_read_policy ON users;
CREATE POLICY users_leaderboard_read_policy ON users
  FOR SELECT
  USING (role = 'rep');

-- 3) Create a policy for admins to read all users
DROP POLICY IF EXISTS users_admin_read_policy ON users;
CREATE POLICY users_admin_read_policy ON users
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
    )
  );

-- 4) Allow authenticated users to read their own profile
DROP POLICY IF EXISTS users_read_own_profile ON users;
CREATE POLICY users_read_own_profile ON users
  FOR SELECT
  USING (auth.uid() = id);

-- 5) Add comment explaining the setup
COMMENT ON TABLE users IS 'Users table with realtime enabled for leaderboard updates. Trigger from migration 011 automatically updates virtual_earnings when sessions complete.';

-- 6) Verify the trigger exists (informational only)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_user_earnings_from_live_sessions_trigger'
  ) THEN
    RAISE NOTICE '✅ Virtual earnings trigger is active';
  ELSE
    RAISE WARNING '⚠️ Virtual earnings trigger not found - run migration 011 first';
  END IF;
END $$;

-- IMPORTANT: After running this migration, you MUST enable realtime in Supabase Dashboard:
-- 1. Go to Database > Replication
-- 2. Add the 'users' table to the publication
-- 3. OR run this SQL: ALTER PUBLICATION supabase_realtime ADD TABLE users;
