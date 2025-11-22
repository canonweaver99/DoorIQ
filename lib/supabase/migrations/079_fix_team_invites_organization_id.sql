-- Migration: 079_fix_team_invites_organization_id.sql
-- Fix team_invites table to properly support organization_id
-- Make team_id nullable and ensure organization_id column exists

-- Ensure organization_id column exists (should have been added in migration 068)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'team_invites' 
    AND column_name = 'organization_id'
  ) THEN
    -- Add organization_id column if it doesn't exist
    ALTER TABLE team_invites 
    ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    
    -- Create index for organization_id
    CREATE INDEX IF NOT EXISTS idx_team_invites_organization_id ON team_invites(organization_id);
  END IF;
END $$;

-- Make team_id nullable (it was created as NOT NULL in migration 040)
-- This allows invites to use organization_id instead of team_id
DO $$
BEGIN
  -- Check if team_id is currently NOT NULL
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'team_invites' 
    AND column_name = 'team_id'
    AND is_nullable = 'NO'
  ) THEN
    -- Drop the NOT NULL constraint by altering the column
    ALTER TABLE team_invites 
    ALTER COLUMN team_id DROP NOT NULL;
  END IF;
END $$;

-- Add a check constraint to ensure at least one of team_id or organization_id is set
DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE team_invites 
  DROP CONSTRAINT IF EXISTS team_invites_team_or_org_check;
  
  -- Add new constraint
  ALTER TABLE team_invites 
  ADD CONSTRAINT team_invites_team_or_org_check 
  CHECK (team_id IS NOT NULL OR organization_id IS NOT NULL);
END $$;

-- Backfill organization_id from team_id for existing invites
DO $$
BEGIN
  IF EXISTS (
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

-- Add comment
COMMENT ON COLUMN team_invites.organization_id IS 'Organization ID for the invite (new system). Either team_id or organization_id must be set.';
COMMENT ON COLUMN team_invites.team_id IS 'Team ID for the invite (legacy). Can be NULL if organization_id is set.';

