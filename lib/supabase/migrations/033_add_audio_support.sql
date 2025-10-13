-- Add audio support to live_sessions table
-- This migration adds columns for storing audio recordings and file uploads

-- Add audio-related columns to live_sessions if they don't exist
ALTER TABLE live_sessions 
ADD COLUMN IF NOT EXISTS audio_url TEXT,
ADD COLUMN IF NOT EXISTS audio_duration INTEGER,
ADD COLUMN IF NOT EXISTS audio_file_size INTEGER,
ADD COLUMN IF NOT EXISTS upload_type TEXT CHECK (upload_type IN ('live_recording', 'file_upload'));

-- Add index for upload_type to filter uploaded vs live sessions
CREATE INDEX IF NOT EXISTS idx_live_sessions_upload_type ON live_sessions(upload_type);

-- Create audio_recordings storage bucket via Supabase dashboard:
-- 1. Go to Storage in Supabase dashboard
-- 2. Create new bucket called "audio-recordings"
-- 3. Set to private (authenticated users only)
-- 4. Enable RLS policies for user access

-- Add comment for documentation
COMMENT ON COLUMN live_sessions.audio_url IS 'URL to the audio recording (either live or uploaded)';
COMMENT ON COLUMN live_sessions.audio_duration IS 'Duration of the audio recording in seconds';
COMMENT ON COLUMN live_sessions.audio_file_size IS 'Size of the audio file in bytes';
COMMENT ON COLUMN live_sessions.upload_type IS 'Type of session: live_recording for ElevenLabs sessions, file_upload for uploaded audio/video';
