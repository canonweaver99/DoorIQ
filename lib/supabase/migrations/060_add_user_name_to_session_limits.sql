-- Migration: 060_add_user_name_to_session_limits
-- Add user_name column to user_session_limits table for easier identification when granting credits

-- Add user_name column
ALTER TABLE user_session_limits
ADD COLUMN IF NOT EXISTS user_name TEXT;

-- Populate user_name from users table for existing records
UPDATE user_session_limits usl
SET user_name = u.full_name
FROM users u
WHERE usl.user_id = u.id
  AND usl.user_name IS NULL;

-- Create function to update user_name when user's full_name changes
CREATE OR REPLACE FUNCTION update_user_session_limits_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user_name in user_session_limits when user's full_name changes
  UPDATE user_session_limits
  SET user_name = NEW.full_name
  WHERE user_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update user_name when user's full_name is updated
DROP TRIGGER IF EXISTS trigger_update_user_session_limits_name ON users;
CREATE TRIGGER trigger_update_user_session_limits_name
  AFTER UPDATE OF full_name ON users
  FOR EACH ROW
  WHEN (OLD.full_name IS DISTINCT FROM NEW.full_name)
  EXECUTE FUNCTION update_user_session_limits_name();

-- Create function to automatically set user_name when new user_session_limits record is created
CREATE OR REPLACE FUNCTION set_user_session_limits_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Set user_name from users table when new record is inserted
  SELECT full_name INTO NEW.user_name
  FROM users
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set user_name when new user_session_limits record is created
DROP TRIGGER IF EXISTS trigger_set_user_session_limits_name ON user_session_limits;
CREATE TRIGGER trigger_set_user_session_limits_name
  BEFORE INSERT ON user_session_limits
  FOR EACH ROW
  EXECUTE FUNCTION set_user_session_limits_name();

-- Add comment
COMMENT ON COLUMN user_session_limits.user_name IS 'User full name for easy identification when managing credits';

