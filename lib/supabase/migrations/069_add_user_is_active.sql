-- Migration: 069_add_user_is_active.sql
-- Add is_active column to users table for tracking active/inactive reps

-- Add is_active column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Create composite index for organization_id + is_active if organization_id column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'organization_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_users_org_active ON users(organization_id, is_active) WHERE organization_id IS NOT NULL;
  END IF;
END $$;

-- Update existing users to be active by default (if column was just added)
UPDATE users SET is_active = true WHERE is_active IS NULL;

-- Add comment
COMMENT ON COLUMN users.is_active IS 'Whether the user is currently active in their organization. Inactive users do not count toward seat usage.';

