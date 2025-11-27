-- Add video recording support to live_sessions
-- Migration: 050_add_video_recording_support

-- Add video-related columns to live_sessions
ALTER TABLE live_sessions
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS has_video BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS video_duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS video_key_moments JSONB DEFAULT '[]'::jsonb;

-- Create index for faster video queries
CREATE INDEX IF NOT EXISTS idx_live_sessions_has_video 
ON live_sessions(has_video) 
WHERE has_video = true;

-- Add comment for tracking
COMMENT ON COLUMN live_sessions.video_url IS 'URL to the recorded video file in storage';
COMMENT ON COLUMN live_sessions.has_video IS 'Whether this session has a video recording';
COMMENT ON COLUMN live_sessions.video_duration_seconds IS 'Duration of the video recording in seconds';
COMMENT ON COLUMN live_sessions.video_key_moments IS 'Array of key moments with timestamps for video navigation';
