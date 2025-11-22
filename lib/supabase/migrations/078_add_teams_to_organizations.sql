-- Migration: 078_add_teams_to_organizations.sql
-- Adds organization_id to teams table to support teams within organizations
-- Creates Canon's team under Loopline organization

-- Enable UUID extension if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add organization_id column to teams table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teams' 
    AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE teams ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_teams_organization_id ON teams(organization_id);
  END IF;
END $$;

-- Update RLS policies for teams to consider organization membership
DO $$
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Teams are readable by members" ON teams;
  DROP POLICY IF EXISTS "Teams are manageable by managers" ON teams;
  DROP POLICY IF EXISTS "Teams are readable by organization members" ON teams;
  DROP POLICY IF EXISTS "Teams are manageable by organization managers" ON teams;
  
  -- Allow members of a team to read their team row
  -- Also allow members of the organization to read teams within their organization
  CREATE POLICY "Teams are readable by organization members" ON teams
    FOR SELECT TO authenticated
    USING (
      -- User is a member of this team
      EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND team_id = teams.id
      )
      OR
      -- User is a member of the organization that owns this team
      EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() 
        AND organization_id = teams.organization_id
        AND teams.organization_id IS NOT NULL
      )
    );
  
  -- Allow managers/admins of the team or organization to update team metadata
  CREATE POLICY "Teams are manageable by organization managers" ON teams
    FOR UPDATE TO authenticated
    USING (
      -- User is a manager/admin of this team
      EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND team_id = teams.id
        AND role IN ('manager', 'admin')
      )
      OR
      -- User is a manager/admin of the organization that owns this team
      EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND organization_id = teams.organization_id
        AND teams.organization_id IS NOT NULL
        AND role IN ('manager', 'admin')
      )
    )
    WITH CHECK (
      -- Same conditions for updates
      EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND team_id = teams.id
        AND role IN ('manager', 'admin')
      )
      OR
      EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND organization_id = teams.organization_id
        AND teams.organization_id IS NOT NULL
        AND role IN ('manager', 'admin')
      )
    );
  
  -- Allow managers/admins to insert new teams within their organization
  CREATE POLICY "Managers can create teams in organization" ON teams
    FOR INSERT TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND organization_id = teams.organization_id
        AND teams.organization_id IS NOT NULL
        AND role IN ('manager', 'admin')
      )
    );
END $$;

-- Create Canon's team under Loopline organization
DO $$
DECLARE
  loopline_org_id UUID;
  canon_user_id UUID;
  canon_team_id UUID;
BEGIN
  -- Find Loopline organization
  SELECT id INTO loopline_org_id 
  FROM organizations 
  WHERE name = 'Loopline' 
  LIMIT 1;
  
  IF loopline_org_id IS NULL THEN
    RAISE EXCEPTION 'Loopline organization not found. Please run migration 077 first.';
  END IF;
  
  -- Find Canon's user account
  SELECT id INTO canon_user_id 
  FROM users 
  WHERE email = 'canonweaver@loopline.design'
  LIMIT 1;
  
  IF canon_user_id IS NULL THEN
    RAISE EXCEPTION 'Canon user not found with email: canonweaver@loopline.design';
  END IF;
  
  -- Check if Canon's team already exists
  SELECT id INTO canon_team_id
  FROM teams
  WHERE organization_id = loopline_org_id
  AND name = 'Canon''s Team'
  LIMIT 1;
  
  IF canon_team_id IS NULL THEN
    -- Create Canon's team
    INSERT INTO teams (name, organization_id, owner_id)
    VALUES ('Canon''s Team', loopline_org_id, canon_user_id)
    RETURNING id INTO canon_team_id;
    
    RAISE NOTICE 'Created Canon''s Team with ID: %', canon_team_id;
  ELSE
    RAISE NOTICE 'Canon''s Team already exists with ID: %', canon_team_id;
  END IF;
  
  -- Update Canon's user to be part of this team
  UPDATE users
  SET team_id = canon_team_id
  WHERE id = canon_user_id
  AND (team_id IS NULL OR team_id != canon_team_id);
  
  RAISE NOTICE 'Updated Canon user to be part of Canon''s Team';
  
END $$;

-- Add comment
COMMENT ON COLUMN teams.organization_id IS 'The organization this team belongs to. Teams can exist within organizations.';

