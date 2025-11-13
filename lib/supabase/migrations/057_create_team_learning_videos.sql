-- Create team_learning_videos table for manager-uploaded training videos
-- Migration: 057_create_team_learning_videos

CREATE TABLE IF NOT EXISTS team_learning_videos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  
  -- Video metadata
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_learning_videos_team_id ON team_learning_videos(team_id);
CREATE INDEX IF NOT EXISTS idx_team_learning_videos_uploaded_by ON team_learning_videos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_team_learning_videos_created_at ON team_learning_videos(created_at DESC);

-- Enable RLS
ALTER TABLE team_learning_videos ENABLE ROW LEVEL SECURITY;

-- Policy: Team members (reps) can view videos from their team
CREATE POLICY "Team members can view their team videos" ON team_learning_videos
  FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy: Managers can insert videos for their team
CREATE POLICY "Managers can upload videos for their team" ON team_learning_videos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND team_id = team_learning_videos.team_id
      AND role IN ('manager', 'admin')
    )
  );

-- Policy: Managers can update videos for their team
CREATE POLICY "Managers can update their team videos" ON team_learning_videos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND team_id = team_learning_videos.team_id
      AND role IN ('manager', 'admin')
    )
  );

-- Policy: Managers can delete videos for their team
CREATE POLICY "Managers can delete their team videos" ON team_learning_videos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND team_id = team_learning_videos.team_id
      AND role IN ('manager', 'admin')
    )
  );

-- Comment
COMMENT ON TABLE team_learning_videos IS 'Training videos uploaded by managers for their team reps to view';

