-- Migration: 075_create_user_preferences.sql
-- Add preferences column to users table (using JSONB for flexibility)

-- Add preferences column as JSONB
ALTER TABLE users
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- Create index for preferences queries (GIN index for JSONB)
CREATE INDEX IF NOT EXISTS idx_users_preferences ON users USING GIN (preferences);

-- Add comment
COMMENT ON COLUMN users.preferences IS 'User preferences stored as JSON: {notifications: {email: true, inApp: true}, sessionDefaults: {duration: 30}, autoSaveTranscripts: true}';

-- Example structure:
-- {
--   "notifications": {
--     "email": true,
--     "inApp": true
--   },
--   "sessionDefaults": {
--     "duration": 30
--   },
--   "autoSaveTranscripts": true
-- }

