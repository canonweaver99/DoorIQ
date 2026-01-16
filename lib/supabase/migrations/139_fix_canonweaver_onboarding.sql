-- Migration: Fix canonweaver@loopline.design onboarding issue
-- Migration: 139_fix_canonweaver_onboarding.sql
-- Date: 2025-01-XX
-- Purpose: Clear checkout_session_id for existing users who have roles set

-- Clear checkout_session_id for users who already have a role set
-- This prevents them from being forced through onboarding again
UPDATE users
SET checkout_session_id = NULL
WHERE role IN ('manager', 'rep', 'admin')
  AND checkout_session_id IS NOT NULL
  AND onboarding_completed = true;

-- Also ensure onboarding_completed is set for users with roles
UPDATE users
SET onboarding_completed = true,
    onboarding_completed_at = COALESCE(onboarding_completed_at, NOW())
WHERE role IN ('manager', 'rep', 'admin')
  AND (onboarding_completed IS NULL OR onboarding_completed = false);

