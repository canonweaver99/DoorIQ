-- Ensure UUID extension exists (required for UUID defaults)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Recreate minimal teams table if it was dropped in earlier migrations
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Ensure users.team_id exists (some earlier migrations dropped it)
ALTER TABLE users ADD COLUMN IF NOT EXISTS team_id UUID;

-- Team invites table for inviting teammates
CREATE TABLE IF NOT EXISTS team_invites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'rep' CHECK (role IN ('rep', 'manager', 'admin')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  used_at TIMESTAMP WITH TIME ZONE,
  used_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_team_invites_token ON team_invites(token);
CREATE INDEX IF NOT EXISTS idx_team_invites_email ON team_invites(email);
CREATE INDEX IF NOT EXISTS idx_team_invites_team_id ON team_invites(team_id);

-- RLS policies
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

-- Users can view invites for their team
CREATE POLICY "Users can view team invites" ON team_invites
  FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM users WHERE id = auth.uid()
    )
  );

-- Managers and admins can create invites for their team
CREATE POLICY "Managers can create team invites" ON team_invites
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND team_id = team_invites.team_id
      AND role IN ('manager', 'admin')
    )
  );

-- Allow invites to be updated (for accepting/expiring)
CREATE POLICY "System can update invites" ON team_invites
  FOR UPDATE
  USING (true);

