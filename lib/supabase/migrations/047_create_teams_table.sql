-- Create minimal teams table and wire existing references

-- Enable extension for uuid_generate_v4 if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1) Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) Backfill teams from existing users.team_id values (idempotent)
INSERT INTO teams (id, name)
SELECT DISTINCT ON (u.team_id)
       u.team_id,
       COALESCE(
         NULLIF(split_part(u.email, '@', 1), ''),
         'Team'
       ) || ' Team' AS name
FROM users u
WHERE u.team_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM teams WHERE id = u.team_id)
ORDER BY u.team_id, u.created_at ASC;

-- 3) Add owner_id after backfill (set to first user who had this team_id)
ALTER TABLE teams ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id) ON DELETE SET NULL;

UPDATE teams t
SET owner_id = (
  SELECT u.id
  FROM users u
  WHERE u.team_id = t.id
    AND u.role IN ('manager', 'admin')
  ORDER BY u.created_at ASC
  LIMIT 1
)
WHERE owner_id IS NULL;

-- 4) Add FK constraint from users.team_id -> teams.id (if not present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_users_team'
      AND table_name = 'users'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT fk_users_team
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 5) Enable RLS and basic policies
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Teams are readable by members" ON teams;
DROP POLICY IF EXISTS "Teams are manageable by managers" ON teams;

-- Allow members of a team (users.team_id = teams.id) to read their team row
CREATE POLICY "Teams are readable by members" ON teams
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND team_id = teams.id
    )
  );

-- Allow managers/admins of the team to update team metadata
CREATE POLICY "Teams are manageable by managers" ON teams
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND team_id = teams.id
        AND role IN ('manager','admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND team_id = teams.id
        AND role IN ('manager','admin')
    )
  );

-- Notes:
-- - team_grading_configs and team_knowledge_documents already reference teams(id) in prior migrations.
-- - This migration creates missing teams so those FKs become valid.
-- - Current APIs can keep using knowledge_base; after this migration
--   you can switch back to team_knowledge_documents if desired.


