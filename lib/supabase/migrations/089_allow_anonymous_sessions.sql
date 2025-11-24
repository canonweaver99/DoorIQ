-- Migration: 089_allow_anonymous_sessions.sql
-- Allow anonymous free demo sessions by making user_id nullable

-- First, drop the foreign key constraint if it exists (we'll recreate it to allow NULL)
DO $$
BEGIN
  -- Drop foreign key constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'live_sessions_user_id_fkey' 
    AND table_name = 'live_sessions'
  ) THEN
    ALTER TABLE live_sessions DROP CONSTRAINT live_sessions_user_id_fkey;
  END IF;
END $$;

-- Make user_id nullable to support anonymous free demo sessions
ALTER TABLE live_sessions
ALTER COLUMN user_id DROP NOT NULL;

-- Recreate foreign key constraint that allows NULL
ALTER TABLE live_sessions
ADD CONSTRAINT live_sessions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add is_free_demo column to track free demo sessions
ALTER TABLE live_sessions
ADD COLUMN IF NOT EXISTS is_free_demo BOOLEAN DEFAULT FALSE;

-- Create index on is_free_demo for queries
CREATE INDEX IF NOT EXISTS idx_live_sessions_is_free_demo ON live_sessions(is_free_demo);

-- Update RLS policies to allow anonymous free demo sessions
-- The existing policies use auth.uid() = user_id, which won't work for anonymous sessions
-- Since we're using service role for inserts, RLS is bypassed anyway
-- For reads, we'll handle access control at the application level for anonymous sessions

-- Add a policy to allow reading free demo sessions by session ID (for anonymous access)
-- This will be handled at the application level, but we ensure the column exists

-- Add comments
COMMENT ON COLUMN live_sessions.user_id IS 'User ID for authenticated sessions, NULL for anonymous free demo sessions';
COMMENT ON COLUMN live_sessions.is_free_demo IS 'Whether this is a free demo session (can be anonymous)';

