-- Migration: 088_add_free_demo_tracking.sql
-- Add free demo tracking column to users table

-- Add used_free_demo column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS used_free_demo BOOLEAN DEFAULT FALSE;

-- Add free_demo_used_at column to track when they used it
ALTER TABLE users
ADD COLUMN IF NOT EXISTS free_demo_used_at TIMESTAMPTZ;

-- Create index on used_free_demo for quick queries
CREATE INDEX IF NOT EXISTS idx_users_used_free_demo ON users(used_free_demo);

-- Add comments
COMMENT ON COLUMN users.used_free_demo IS 'Whether the user has used their free demo session';
COMMENT ON COLUMN users.free_demo_used_at IS 'Timestamp when the free demo session was used';

