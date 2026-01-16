-- Migration: Clear checkout_session_id for all users with existing roles
-- This ensures existing users are never forced through onboarding again
-- Date: 2025-01-16

-- Clear checkout_session_id for ANY user who has a role set
-- Simplified: if they have a role, they don't need onboarding
UPDATE users
SET checkout_session_id = NULL
WHERE role IN ('manager', 'rep', 'admin')
  AND checkout_session_id IS NOT NULL;

-- Also mark onboarding as complete for users with roles
UPDATE users
SET onboarding_completed = true,
    onboarding_completed_at = COALESCE(onboarding_completed_at, NOW())
WHERE role IN ('manager', 'rep', 'admin')
  AND (onboarding_completed IS NULL OR onboarding_completed = false);

