-- Make rep_id optional in users table
-- This allows users to sign up without needing a rep ID

-- First, drop the UNIQUE constraint on rep_id
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_rep_id_key;

-- Make rep_id nullable
ALTER TABLE users ALTER COLUMN rep_id DROP NOT NULL;

-- Add a comment explaining the change
COMMENT ON COLUMN users.rep_id IS 'Optional identifier for sales reps - no longer required for signup';

-- Update any existing NULL values to have a generated ID (optional)
-- Uncomment if you want to give existing users without rep_id a default value
-- UPDATE users SET rep_id = 'REP-' || SUBSTRING(id::text, 1, 8) WHERE rep_id IS NULL;
