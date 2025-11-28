-- Comprehensive fix for infinite recursion in users RLS policies
-- This migration fixes ALL policies that query the users table, causing infinite recursion
-- Solution: Use a SECURITY DEFINER function that bypasses RLS to check user roles

-- Step 1: Drop ALL problematic policies that query the users table
DROP POLICY IF EXISTS users_select_team ON users;
DROP POLICY IF EXISTS users_admin_read_policy ON users;
DROP POLICY IF EXISTS users_leaderboard_read_policy ON users;
DROP POLICY IF EXISTS users_read_own_profile ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS users_select_own ON users;
DROP POLICY IF EXISTS users_select_by_email ON users;
DROP POLICY IF EXISTS users_insert_own ON users;
DROP POLICY IF EXISTS users_update_own ON users;

-- Step 2: Create/update the helper function that bypasses RLS
CREATE OR REPLACE FUNCTION is_manager_or_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Use SECURITY DEFINER to bypass RLS when checking roles
  SELECT role INTO v_role
  FROM users
  WHERE id = p_user_id;
  
  RETURN COALESCE(v_role IN ('manager', 'admin'), false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create a function to check if user is a rep (for leaderboard)
CREATE OR REPLACE FUNCTION is_rep(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM users
  WHERE id = p_user_id;
  
  RETURN COALESCE(v_role = 'rep', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Recreate policies WITHOUT querying the users table directly
-- Drop existing policies first to avoid conflicts

DROP POLICY IF EXISTS users_select_own ON users;
DROP POLICY IF EXISTS users_select_by_email ON users;
DROP POLICY IF EXISTS users_insert_own ON users;
DROP POLICY IF EXISTS users_update_own ON users;

-- Policy: Users can read their own profile
CREATE POLICY users_select_own ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can read by email (for Google login fallback)
CREATE POLICY users_select_by_email ON users
  FOR SELECT
  USING (
    auth.jwt() ->> 'email' = email
  );

-- Policy: Managers and admins can read all users (using function to avoid recursion)
-- Note: Already dropped in Step 1, but ensuring it's dropped here too
DROP POLICY IF EXISTS users_select_team ON users;
CREATE POLICY users_select_team ON users
  FOR SELECT
  USING (
    is_manager_or_admin(auth.uid())
  );

-- Policy: Allow reading rep profiles for leaderboard (authenticated users can see reps)
-- This is safe because leaderboard data is meant to be public within the organization
-- Note: Already dropped in Step 1, but ensuring it's dropped here too
DROP POLICY IF EXISTS users_leaderboard_read_policy ON users;
CREATE POLICY users_leaderboard_read_policy ON users
  FOR SELECT
  USING (
    role = 'rep' AND auth.uid() IS NOT NULL
  );

-- Policy: Users can insert their own row
CREATE POLICY users_insert_own ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own row
CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 5: Fix policies on other tables that query users table (for consistency)
-- Note: These don't cause infinite recursion, but using the function is cleaner
-- Only fix policies for tables that exist

-- Fix live_sessions admin policies (for consistency, though they don't cause recursion)
DROP POLICY IF EXISTS live_sessions_select_admin ON public.live_sessions;
CREATE POLICY live_sessions_select_admin ON public.live_sessions
  FOR SELECT USING (is_manager_or_admin(auth.uid()));

DROP POLICY IF EXISTS live_sessions_insert_admin ON public.live_sessions;
CREATE POLICY live_sessions_insert_admin ON public.live_sessions
  FOR INSERT WITH CHECK (is_manager_or_admin(auth.uid()));

DROP POLICY IF EXISTS live_sessions_update_admin ON public.live_sessions;
CREATE POLICY live_sessions_update_admin ON public.live_sessions
  FOR UPDATE USING (is_manager_or_admin(auth.uid()))
  WITH CHECK (is_manager_or_admin(auth.uid()));

DROP POLICY IF EXISTS live_sessions_delete_admin ON public.live_sessions;
CREATE POLICY live_sessions_delete_admin ON public.live_sessions
  FOR DELETE USING (is_manager_or_admin(auth.uid()));

-- Add comments
COMMENT ON FUNCTION is_manager_or_admin(UUID) IS 'Helper function to check if user is manager/admin. Uses SECURITY DEFINER to bypass RLS and avoid infinite recursion.';
COMMENT ON FUNCTION is_rep(UUID) IS 'Helper function to check if user is a rep. Uses SECURITY DEFINER to bypass RLS.';
COMMENT ON POLICY users_select_team ON users IS 'Allows managers and admins to view all users. Uses helper function to avoid infinite recursion.';
COMMENT ON POLICY users_leaderboard_read_policy ON users IS 'Allows authenticated users to view rep profiles for leaderboard. Does not query users table.';

