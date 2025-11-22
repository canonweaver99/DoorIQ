-- Create organizations table for team management with seat-based billing
-- Migration: 068_create_organizations_table.sql

-- Enable UUID extension if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  stripe_subscription_item_id TEXT,
  plan_tier TEXT CHECK (plan_tier IN ('starter', 'team', 'enterprise')),
  seat_limit INTEGER DEFAULT 0,
  seats_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer_id ON organizations(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_subscription_id ON organizations(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_organizations_plan_tier ON organizations(plan_tier);

-- Add organization_id to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Create index for organization_id
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);

-- Migrate existing teams to organizations
-- Create organizations from existing teams
INSERT INTO organizations (id, name, plan_tier, seat_limit, seats_used, created_at)
SELECT 
  t.id,
  t.name,
  'team'::TEXT as plan_tier,
  COALESCE(COUNT(DISTINCT u.id), 0) as seat_limit,
  COALESCE(COUNT(DISTINCT u.id), 0) as seats_used,
  t.created_at
FROM teams t
LEFT JOIN users u ON u.team_id = t.id
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE id = t.id)
GROUP BY t.id, t.name, t.created_at;

-- Backfill organization_id in users table from team_id
UPDATE users u
SET organization_id = u.team_id
WHERE u.team_id IS NOT NULL 
  AND u.organization_id IS NULL
  AND EXISTS (SELECT 1 FROM organizations WHERE id = u.team_id);

-- Update team_invites to support organization_id (add column if needed)
ALTER TABLE team_invites ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Backfill organization_id in team_invites from team_id
UPDATE team_invites ti
SET organization_id = ti.team_id
WHERE ti.team_id IS NOT NULL 
  AND ti.organization_id IS NULL
  AND EXISTS (SELECT 1 FROM organizations WHERE id = ti.team_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_organizations_updated_at ON organizations;
CREATE TRIGGER trigger_update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_organizations_updated_at();

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all organizations" ON organizations;
DROP POLICY IF EXISTS "Organization members can view their organization" ON organizations;
DROP POLICY IF EXISTS "Admins can manage all organizations" ON organizations;
DROP POLICY IF EXISTS "Organization managers can update their organization" ON organizations;

-- Admins can view all organizations
CREATE POLICY "Admins can view all organizations" ON organizations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Organization members can view their organization
CREATE POLICY "Organization members can view their organization" ON organizations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND organization_id = organizations.id
    )
  );

-- Admins can manage all organizations
CREATE POLICY "Admins can manage all organizations" ON organizations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Organization managers/admins can update their organization
CREATE POLICY "Organization managers can update their organization" ON organizations
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() 
        AND organization_id = organizations.id
        AND role IN ('manager', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() 
        AND organization_id = organizations.id
        AND role IN ('manager', 'admin')
    )
  );

-- Create function to increment organization seats
CREATE OR REPLACE FUNCTION increment_organization_seats(org_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE organizations
  SET seats_used = seats_used + 1
  WHERE id = org_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to decrement organization seats
CREATE OR REPLACE FUNCTION decrement_organization_seats(org_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE organizations
  SET seats_used = GREATEST(0, seats_used - 1)
  WHERE id = org_id;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON TABLE organizations IS 'Organizations/companies using DoorIQ with seat-based billing';
COMMENT ON COLUMN organizations.seat_limit IS 'Maximum number of seats allowed (billed)';
COMMENT ON COLUMN organizations.seats_used IS 'Current number of active seats in use';
COMMENT ON FUNCTION increment_organization_seats IS 'Increments seats_used when a member joins';
COMMENT ON FUNCTION decrement_organization_seats IS 'Decrements seats_used when a member leaves';

