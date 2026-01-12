-- Migration: 136_add_post_checkout_onboarding.sql
-- Add columns for post-checkout onboarding flow

-- Add current onboarding step (0 = account setup, 1 = role selection, 2+ = content steps)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS onboarding_current_step INTEGER DEFAULT 0;

-- Add role selected during onboarding ('manager' or 'rep')
ALTER TABLE users
ADD COLUMN IF NOT EXISTS onboarding_role TEXT;

-- Add timestamp for when account was created (password set or Google linked)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS account_setup_completed_at TIMESTAMPTZ;

-- Add timestamp for when role was selected
ALTER TABLE users
ADD COLUMN IF NOT EXISTS role_selected_at TIMESTAMPTZ;

-- Add Stripe session ID for tracking checkout-to-onboarding flow
ALTER TABLE users
ADD COLUMN IF NOT EXISTS checkout_session_id TEXT;

-- Update the onboarding_steps_completed with new steps if needed
-- This will update existing rows to have the new structure
UPDATE users
SET onboarding_steps_completed = jsonb_set(
  COALESCE(onboarding_steps_completed, '{}'::jsonb),
  '{account_setup}',
  'false'::jsonb
)
WHERE onboarding_steps_completed IS NULL 
   OR NOT (onboarding_steps_completed ? 'account_setup');

UPDATE users
SET onboarding_steps_completed = jsonb_set(
  COALESCE(onboarding_steps_completed, '{}'::jsonb),
  '{role_selection}',
  'false'::jsonb
)
WHERE onboarding_steps_completed IS NULL 
   OR NOT (onboarding_steps_completed ? 'role_selection');

UPDATE users
SET onboarding_steps_completed = jsonb_set(
  COALESCE(onboarding_steps_completed, '{}'::jsonb),
  '{welcome}',
  'false'::jsonb
)
WHERE onboarding_steps_completed IS NULL 
   OR NOT (onboarding_steps_completed ? 'welcome');

UPDATE users
SET onboarding_steps_completed = jsonb_set(
  COALESCE(onboarding_steps_completed, '{}'::jsonb),
  '{features}',
  'false'::jsonb
)
WHERE onboarding_steps_completed IS NULL 
   OR NOT (onboarding_steps_completed ? 'features');

UPDATE users
SET onboarding_steps_completed = jsonb_set(
  COALESCE(onboarding_steps_completed, '{}'::jsonb),
  '{team_invite}',
  'false'::jsonb
)
WHERE onboarding_steps_completed IS NULL 
   OR NOT (onboarding_steps_completed ? 'team_invite');

UPDATE users
SET onboarding_steps_completed = jsonb_set(
  COALESCE(onboarding_steps_completed, '{}'::jsonb),
  '{first_session}',
  'false'::jsonb
)
WHERE onboarding_steps_completed IS NULL 
   OR NOT (onboarding_steps_completed ? 'first_session');

UPDATE users
SET onboarding_steps_completed = jsonb_set(
  COALESCE(onboarding_steps_completed, '{}'::jsonb),
  '{pro_tips}',
  'false'::jsonb
)
WHERE onboarding_steps_completed IS NULL 
   OR NOT (onboarding_steps_completed ? 'pro_tips');

-- Create index on checkout_session_id for quick lookups
CREATE INDEX IF NOT EXISTS idx_users_checkout_session_id ON users(checkout_session_id);

-- Create index on onboarding_role for filtering
CREATE INDEX IF NOT EXISTS idx_users_onboarding_role ON users(onboarding_role);

-- Add comments
COMMENT ON COLUMN users.onboarding_current_step IS 'Current step in the post-checkout onboarding flow (0=account, 1=role, 2+=content)';
COMMENT ON COLUMN users.onboarding_role IS 'Role selected during onboarding: manager or rep';
COMMENT ON COLUMN users.account_setup_completed_at IS 'When the user completed account setup (password or Google)';
COMMENT ON COLUMN users.role_selected_at IS 'When the user selected their role during onboarding';
COMMENT ON COLUMN users.checkout_session_id IS 'Stripe checkout session ID for tracking the checkout-to-onboarding flow';

