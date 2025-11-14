-- Create user_video_watches table to track which videos users have watched
-- Migration: 066_create_user_video_watches

CREATE TABLE IF NOT EXISTS user_video_watches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL,
  video_type TEXT NOT NULL CHECK (video_type IN ('instructional', 'team')),
  watched_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Ensure a user can only have one watch record per video
  UNIQUE(user_id, video_id, video_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_video_watches_user_id ON user_video_watches(user_id);
CREATE INDEX IF NOT EXISTS idx_user_video_watches_video_id ON user_video_watches(video_id, video_type);
CREATE INDEX IF NOT EXISTS idx_user_video_watches_watched_at ON user_video_watches(watched_at DESC);

-- Enable RLS
ALTER TABLE user_video_watches ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own watch records
CREATE POLICY "Users can view their own watch records" ON user_video_watches
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users can insert their own watch records
CREATE POLICY "Users can mark videos as watched" ON user_video_watches
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own watch records
CREATE POLICY "Users can update their own watch records" ON user_video_watches
  FOR UPDATE
  USING (user_id = auth.uid());

-- Comment
COMMENT ON TABLE user_video_watches IS 'Tracks which videos users have watched for showing "New" badges';

