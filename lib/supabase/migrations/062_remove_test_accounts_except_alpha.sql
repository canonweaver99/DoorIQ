-- Migration: 062_remove_test_accounts_except_alpha
-- Remove all test accounts except those in Team Alpha
-- Test accounts are identified by emails ending in @test.dooriq.ai

-- First, let's see what we're about to delete (for safety - comment out when ready)
-- Uncomment to preview what will be deleted:
/*
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  t.name as team_name
FROM users u
LEFT JOIN teams t ON u.team_id = t.id
WHERE u.email LIKE '%@test.dooriq.ai'
  AND (t.name != 'Team Alpha' OR t.name IS NULL)
ORDER BY t.name, u.role, u.email;
*/

-- Get Team Alpha's ID
DO $$
DECLARE
  v_alpha_team_id UUID;
  v_deleted_count INTEGER;
BEGIN
  -- Find Team Alpha
  SELECT id INTO v_alpha_team_id
  FROM teams
  WHERE name = 'Team Alpha'
  LIMIT 1;

  IF v_alpha_team_id IS NULL THEN
    RAISE EXCEPTION 'Team Alpha not found! Aborting deletion.';
  END IF;

  RAISE NOTICE 'Team Alpha ID: %', v_alpha_team_id;

  -- Delete user_session_limits for test users NOT in Team Alpha
  DELETE FROM user_session_limits
  WHERE user_id IN (
    SELECT u.id
    FROM users u
    LEFT JOIN teams t ON u.team_id = t.id
    WHERE u.email LIKE '%@test.dooriq.ai'
      AND (t.id != v_alpha_team_id OR t.id IS NULL)
  );

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % user_session_limits records', v_deleted_count;

  -- Delete users NOT in Team Alpha (this will cascade delete related records)
  -- Note: This will also delete their live_sessions, training_sessions, etc. due to CASCADE
  DELETE FROM users
  WHERE email LIKE '%@test.dooriq.ai'
    AND (team_id != v_alpha_team_id OR team_id IS NULL);

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % test user accounts (not in Team Alpha)', v_deleted_count;

  -- Delete teams that are not Team Alpha (if they have no remaining users)
  -- This will only delete teams if they have no users left
  DELETE FROM teams
  WHERE name IN ('Team Beta', 'Team Gamma')
    AND id NOT IN (
      SELECT DISTINCT team_id 
      FROM users 
      WHERE team_id IS NOT NULL
    );

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % test teams (Beta, Gamma)', v_deleted_count;

  RAISE NOTICE '✅ Cleanup complete! Only Team Alpha test accounts remain.';
END $$;

-- Verify remaining test accounts (should only be Team Alpha)
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  t.name as team_name
FROM users u
LEFT JOIN teams t ON u.team_id = t.id
WHERE u.email LIKE '%@test.dooriq.ai'
ORDER BY t.name, u.role, u.email;

