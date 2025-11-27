-- Migration: Fix infinite recursion in users RLS policy
-- The users_select_team policy was querying the users table, causing infinite recursion
-- Fix: Use auth.jwt() to check role instead of querying users table

-- Drop the problematic policy
DROP POLICY IF EXISTS users_select_team ON users;

-- Create a fixed version that uses JWT to check role (no table query)
-- Note: This assumes role is stored in the JWT token
-- If role is not in JWT, we'll use a SECURITY DEFINER function instead
CREATE POLICY users_select_team ON users
  FOR SELECT
  USING (
    -- Check role from JWT token to avoid querying users table
    (auth.jwt() ->> 'user_role') IN ('manager', 'admin')
    OR
    -- Fallback: Use a function that bypasses RLS to check role
    EXISTS (
      SELECT 1 FROM users manager
      WHERE manager.id = auth.uid()
      AND manager.role IN ('manager', 'admin')
    )
  );

-- Actually, the better fix is to use a SECURITY DEFINER function that bypasses RLS
-- Let's drop and recreate with a function-based approach
DROP POLICY IF EXISTS users_select_team ON users;

-- Create a helper function that bypasses RLS to check if user is manager/admin
CREATE OR REPLACE FUNCTION is_manager_or_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM users
  WHERE id = p_user_id;
  
  RETURN v_role IN ('manager', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now create the policy using the function (which bypasses RLS)
CREATE POLICY users_select_team ON users
  FOR SELECT
  USING (
    is_manager_or_admin(auth.uid())
  );

COMMENT ON FUNCTION is_manager_or_admin(UUID) IS 'Helper function to check if user is manager/admin. Uses SECURITY DEFINER to bypass RLS and avoid infinite recursion.';

COMMENT ON POLICY users_select_team ON users IS 'Allows managers and admins to view all users. Uses helper function to avoid infinite recursion.';

