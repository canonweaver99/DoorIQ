-- Migration: 071_migrate_all_teams_to_orgs.sql
-- Force migrate all teams to organizations immediately
-- Only runs if organizations table exists (migration 068 must be run first)

DO $$
BEGIN
  -- Only proceed if organizations table exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'organizations'
  ) THEN
    -- Create organizations for all teams that don't have one yet
    INSERT INTO organizations (id, name, plan_tier, seat_limit, seats_used, created_at)
    SELECT 
      t.id,
      t.name,
      'team'::TEXT as plan_tier,
      COALESCE(
        (SELECT COUNT(DISTINCT u.id) FROM users u WHERE u.team_id = t.id AND COALESCE(u.is_active, true) = true),
        0
      ) as seat_limit,
      COALESCE(
        (SELECT COUNT(DISTINCT u.id) FROM users u WHERE u.team_id = t.id AND COALESCE(u.is_active, true) = true),
        0
      ) as seats_used,
      COALESCE(t.created_at, NOW())
    FROM teams t
    WHERE NOT EXISTS (
      SELECT 1 FROM organizations WHERE id = t.id
    );
  END IF;
END $$;

-- Update all users with team_id to have matching organization_id
-- Only if organizations table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'organizations'
  ) AND EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'organization_id'
  ) THEN
    UPDATE users u
    SET organization_id = u.team_id
    WHERE u.team_id IS NOT NULL 
      AND u.organization_id IS NULL
      AND EXISTS (SELECT 1 FROM organizations WHERE id = u.team_id);
  END IF;
END $$;

-- Ensure all team_invites have organization_id set
-- Only if organizations table and column exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'organizations'
  ) AND EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'team_invites' 
    AND column_name = 'organization_id'
  ) THEN
    UPDATE team_invites ti
    SET organization_id = ti.team_id
    WHERE ti.team_id IS NOT NULL 
      AND ti.organization_id IS NULL
      AND EXISTS (SELECT 1 FROM organizations WHERE id = ti.team_id);
  END IF;
END $$;

-- Update RLS policies for team_invites to work with organizations
-- Only if organizations table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'organizations'
  ) AND EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'team_invites' 
    AND column_name = 'organization_id'
  ) THEN
    -- Drop old policies if they exist
    DROP POLICY IF EXISTS "Users can view team invites" ON team_invites;
    DROP POLICY IF EXISTS "Managers can create team invites" ON team_invites;
    DROP POLICY IF EXISTS "Users can view organization invites" ON team_invites;
    DROP POLICY IF EXISTS "Managers can create organization invites" ON team_invites;

    -- Users can view invites for their organization
    CREATE POLICY "Users can view organization invites" ON team_invites
      FOR SELECT
      USING (
        organization_id IN (
          SELECT organization_id FROM users WHERE id = auth.uid() AND organization_id IS NOT NULL
        )
        OR team_id IN (
          SELECT team_id FROM users WHERE id = auth.uid() AND team_id IS NOT NULL
        )
      );

    -- Managers and admins can create invites for their organization
    CREATE POLICY "Managers can create organization invites" ON team_invites
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() 
          AND (
            (organization_id = team_invites.organization_id AND organization_id IS NOT NULL)
            OR (team_id = team_invites.team_id AND team_id IS NOT NULL)
          )
          AND role IN ('manager', 'admin')
        )
      );
  END IF;
END $$;

-- Add comment
COMMENT ON TABLE team_invites IS 'Invitations for team members. Supports both team_id (legacy) and organization_id (new).';

