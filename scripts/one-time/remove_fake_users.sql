-- SQL Script to Remove All Fake/Mock Users and Reps
-- This script removes:
-- 1. Test accounts (@test.dooriq.ai)
-- 2. AI agent accounts (@dooriq-agent.ai)
-- 3. Related data (sessions, limits, etc.)
-- 4. Empty test teams

-- ============================================================
-- STEP 1: PREVIEW - See what will be deleted (RUN THIS FIRST!)
-- ============================================================
-- Uncomment the section below to preview what will be deleted:

/*
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.organization_id,
  o.name as organization_name,
  COUNT(DISTINCT ls.id) as session_count,
  COUNT(DISTINCT ts.id) as training_session_count
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
LEFT JOIN live_sessions ls ON ls.user_id = u.id
LEFT JOIN training_sessions ts ON ts.user_id = u.id
WHERE 
  u.email LIKE '%@test.dooriq.ai' OR
  u.email LIKE '%@dooriq-agent.ai' OR
  u.email LIKE '%@example.com' OR
  u.email LIKE '%@test.com' OR
  u.email LIKE '%@mock.com' OR
  u.email LIKE '%@fake.com' OR
  u.full_name ILIKE '%test%' OR
  u.full_name ILIKE '%demo%' OR
  u.full_name ILIKE '%mock%' OR
  u.full_name ILIKE '%fake%'
GROUP BY u.id, u.email, u.full_name, u.role, u.organization_id, o.name
ORDER BY u.email;
*/

-- ============================================================
-- STEP 2: ACTUAL DELETION (Run after reviewing preview)
-- ============================================================

DO $$
DECLARE
  v_deleted_users INTEGER := 0;
  v_deleted_session_limits INTEGER := 0;
  v_deleted_teams INTEGER := 0;
  v_deleted_organizations INTEGER := 0;
BEGIN
  RAISE NOTICE '🚀 Starting cleanup of fake/mock users...';
  RAISE NOTICE '';

  -- Delete user_session_limits for fake/mock users
  DELETE FROM user_session_limits
  WHERE user_id IN (
    SELECT id FROM users
    WHERE 
      email LIKE '%@test.dooriq.ai' OR
      email LIKE '%@dooriq-agent.ai' OR
      email LIKE '%@example.com' OR
      email LIKE '%@test.com' OR
      email LIKE '%@mock.com' OR
      email LIKE '%@fake.com' OR
      full_name ILIKE '%test%' OR
      full_name ILIKE '%demo%' OR
      full_name ILIKE '%mock%' OR
      full_name ILIKE '%fake%'
  );

  GET DIAGNOSTICS v_deleted_session_limits = ROW_COUNT;
  RAISE NOTICE '✅ Deleted % user_session_limits records', v_deleted_session_limits;

  -- Delete users (this will CASCADE delete related records like sessions, etc.)
  -- Related tables that will be cleaned up automatically:
  -- - live_sessions (CASCADE)
  -- - training_sessions (CASCADE)
  -- - user_video_watches (CASCADE)
  -- - pinned_sessions (CASCADE)
  -- - messages (CASCADE)
  -- - testimonials (SET NULL)
  -- - invoices (SET NULL)
  -- - etc.
  
  DELETE FROM users
  WHERE 
    email LIKE '%@test.dooriq.ai' OR
    email LIKE '%@dooriq-agent.ai' OR
    email LIKE '%@example.com' OR
    email LIKE '%@test.com' OR
    email LIKE '%@mock.com' OR
    email LIKE '%@fake.com' OR
    full_name ILIKE '%test%' OR
    full_name ILIKE '%demo%' OR
    full_name ILIKE '%mock%' OR
    full_name ILIKE '%fake%';

  GET DIAGNOSTICS v_deleted_users = ROW_COUNT;
  RAISE NOTICE '✅ Deleted % fake/mock user accounts', v_deleted_users;

  -- Delete empty test teams (only if they have no users)
  DELETE FROM teams
  WHERE name IN ('Team Alpha', 'Team Beta', 'Team Gamma')
    AND id NOT IN (
      SELECT DISTINCT team_id 
      FROM users 
      WHERE team_id IS NOT NULL
    );

  GET DIAGNOSTICS v_deleted_teams = ROW_COUNT;
  RAISE NOTICE '✅ Deleted % empty test teams', v_deleted_teams;

  -- Delete empty test organizations (only if they have no users)
  DELETE FROM organizations
  WHERE name ILIKE '%test%' 
     OR name ILIKE '%demo%'
     OR name ILIKE '%mock%'
     OR name ILIKE '%fake%'
     OR name IN ('Team Alpha', 'Team Beta', 'Team Gamma')
    AND id NOT IN (
      SELECT DISTINCT organization_id 
      FROM users 
      WHERE organization_id IS NOT NULL
    );

  GET DIAGNOSTICS v_deleted_organizations = ROW_COUNT;
  RAISE NOTICE '✅ Deleted % empty test organizations', v_deleted_organizations;

  RAISE NOTICE '';
  RAISE NOTICE '🎉 Cleanup complete!';
  RAISE NOTICE '   - Users deleted: %', v_deleted_users;
  RAISE NOTICE '   - Session limits deleted: %', v_deleted_session_limits;
  RAISE NOTICE '   - Teams deleted: %', v_deleted_teams;
  RAISE NOTICE '   - Organizations deleted: %', v_deleted_organizations;
END $$;

-- ============================================================
-- STEP 3: VERIFY - Check remaining fake users (should be 0)
-- ============================================================

SELECT 
  COUNT(*) as remaining_fake_users,
  COUNT(CASE WHEN email LIKE '%@test.dooriq.ai' THEN 1 END) as test_dooriq_users,
  COUNT(CASE WHEN email LIKE '%@dooriq-agent.ai' THEN 1 END) as ai_agent_users,
  COUNT(CASE WHEN email LIKE '%@example.com' OR email LIKE '%@test.com' OR email LIKE '%@mock.com' OR email LIKE '%@fake.com' THEN 1 END) as other_test_users
FROM users
WHERE 
  email LIKE '%@test.dooriq.ai' OR
  email LIKE '%@dooriq-agent.ai' OR
  email LIKE '%@example.com' OR
  email LIKE '%@test.com' OR
  email LIKE '%@mock.com' OR
  email LIKE '%@fake.com' OR
  full_name ILIKE '%test%' OR
  full_name ILIKE '%demo%' OR
  full_name ILIKE '%mock%' OR
  full_name ILIKE '%fake%';

-- ============================================================
-- OPTIONAL: Show summary of remaining users
-- ============================================================

SELECT 
  role,
  COUNT(*) as user_count,
  COUNT(DISTINCT organization_id) as organization_count
FROM users
GROUP BY role
ORDER BY role;

