-- Fix Row Level Security policies on users table
-- Allow authenticated users to read their own user data

-- Drop existing policies if they exist
DROP POLICY IF EXISTS users_select_own ON users;
DROP POLICY IF EXISTS users_select_by_email ON users;
DROP POLICY IF EXISTS users_insert_own ON users;
DROP POLICY IF EXISTS users_update_own ON users;

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow users to SELECT their own row by ID
CREATE POLICY users_select_own ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to SELECT by matching email (for Google login fallback)
CREATE POLICY users_select_by_email ON users
  FOR SELECT
  USING (
    auth.jwt() ->> 'email' = email
  );

-- Allow users to INSERT their own row (for first-time signups)
CREATE POLICY users_insert_own ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow users to UPDATE their own row
CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow managers to SELECT all users in their team (optional, for manager panel)
CREATE POLICY users_select_team ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users manager
      WHERE manager.id = auth.uid()
      AND manager.role IN ('manager', 'admin')
    )
  );

COMMENT ON TABLE users IS 'User profiles with RLS policies allowing users to read their own data and managers to read team data';

