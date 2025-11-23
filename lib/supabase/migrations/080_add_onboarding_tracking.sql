-- Migration: 080_add_onboarding_tracking.sql
-- Add onboarding tracking columns to users table

-- Add onboarding_completed column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Add onboarding_completed_at column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Add onboarding_steps_completed JSONB column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS onboarding_steps_completed JSONB DEFAULT '{
  "invite_team": false,
  "configure_settings": false,
  "first_session": false,
  "explore_features": false
}'::jsonb;

-- Add onboarding_dismissed column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS onboarding_dismissed BOOLEAN DEFAULT FALSE;

-- Add onboarding_dismissed_at column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS onboarding_dismissed_at TIMESTAMPTZ;

-- Create index on onboarding_completed for quick queries
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed ON users(onboarding_completed);

-- Create GIN index on onboarding_steps_completed for JSONB queries
CREATE INDEX IF NOT EXISTS idx_users_onboarding_steps_completed ON users USING GIN(onboarding_steps_completed);

-- Add comments
COMMENT ON COLUMN users.onboarding_completed IS 'Whether the user has completed the onboarding flow';
COMMENT ON COLUMN users.onboarding_completed_at IS 'Timestamp when onboarding was completed';
COMMENT ON COLUMN users.onboarding_steps_completed IS 'JSONB tracking individual step completion: {invite_team, configure_settings, first_session, explore_features}';
COMMENT ON COLUMN users.onboarding_dismissed IS 'Whether the user dismissed the onboarding reminder';
COMMENT ON COLUMN users.onboarding_dismissed_at IS 'Timestamp when onboarding was dismissed';

