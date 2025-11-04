-- Migration: 055_add_company_to_users
-- Add company field to users table for profile information

ALTER TABLE users
ADD COLUMN IF NOT EXISTS company TEXT;

-- Add comment for documentation
COMMENT ON COLUMN users.company IS 'User company name for profile display';

