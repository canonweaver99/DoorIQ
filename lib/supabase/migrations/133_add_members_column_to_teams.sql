-- Migration: Add members column to teams table
-- This column stores an array of user names (full_name) for each team
-- It is automatically maintained via triggers when users join/leave teams or change their names

-- Add members column as TEXT[] array
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS members TEXT[] DEFAULT '{}';

-- Function to update members column for a specific team
CREATE OR REPLACE FUNCTION update_team_members(team_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE teams
  SET members = (
    SELECT COALESCE(ARRAY_AGG(full_name ORDER BY full_name), '{}')
    FROM users
    WHERE team_id = team_uuid
      AND full_name IS NOT NULL
  )
  WHERE id = team_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to update members for all teams (for backfill)
CREATE OR REPLACE FUNCTION update_all_team_members()
RETURNS void AS $$
BEGIN
  UPDATE teams t
  SET members = (
    SELECT COALESCE(ARRAY_AGG(u.full_name ORDER BY u.full_name), '{}')
    FROM users u
    WHERE u.team_id = t.id
      AND u.full_name IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger function: Update team members when user's team_id changes
CREATE OR REPLACE FUNCTION trigger_update_team_members_on_team_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update old team if team_id changed
  IF OLD.team_id IS NOT NULL AND (OLD.team_id IS DISTINCT FROM NEW.team_id) THEN
    PERFORM update_team_members(OLD.team_id);
  END IF;
  
  -- Update new team if team_id changed or was set
  IF NEW.team_id IS NOT NULL AND (OLD.team_id IS DISTINCT FROM NEW.team_id) THEN
    PERFORM update_team_members(NEW.team_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function: Update team members when user's full_name changes
CREATE OR REPLACE FUNCTION trigger_update_team_members_on_name_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if name changed and user is in a team
  IF OLD.full_name IS DISTINCT FROM NEW.full_name AND NEW.team_id IS NOT NULL THEN
    PERFORM update_team_members(NEW.team_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function: Update team members when user is deleted
CREATE OR REPLACE FUNCTION trigger_update_team_members_on_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Update team members when a user is deleted
  IF OLD.team_id IS NOT NULL THEN
    PERFORM update_team_members(OLD.team_id);
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist (for idempotency)
DROP TRIGGER IF EXISTS update_team_members_on_team_change ON users;
DROP TRIGGER IF EXISTS update_team_members_on_name_change ON users;
DROP TRIGGER IF EXISTS update_team_members_on_user_delete ON users;

-- Create trigger: Update team members when user's team_id changes
CREATE TRIGGER update_team_members_on_team_change
  AFTER INSERT OR UPDATE OF team_id ON users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_team_members_on_team_change();

-- Create trigger: Update team members when user's full_name changes
CREATE TRIGGER update_team_members_on_name_change
  AFTER UPDATE OF full_name ON users
  FOR EACH ROW
  WHEN (OLD.full_name IS DISTINCT FROM NEW.full_name)
  EXECUTE FUNCTION trigger_update_team_members_on_name_change();

-- Create trigger: Update team members when user is deleted
CREATE TRIGGER update_team_members_on_user_delete
  AFTER DELETE ON users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_team_members_on_user_delete();

-- Backfill existing data
SELECT update_all_team_members();

-- Add comment
COMMENT ON COLUMN teams.members IS 'Array of full names of users in this team. Automatically maintained via triggers when users join/leave teams or change their names.';

