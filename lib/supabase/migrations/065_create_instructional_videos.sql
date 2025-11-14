-- Create instructional_videos table for company-created "How to Use DoorIQ" videos
-- Migration: 065_create_instructional_videos

CREATE TABLE IF NOT EXISTS instructional_videos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Video metadata
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  
  -- Ordering for top 4 display (1-4)
  display_order INTEGER NOT NULL DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_instructional_videos_team_id ON instructional_videos(team_id);
CREATE INDEX IF NOT EXISTS idx_instructional_videos_display_order ON instructional_videos(team_id, display_order);
CREATE INDEX IF NOT EXISTS idx_instructional_videos_created_at ON instructional_videos(created_at DESC);

-- Constraint: display_order should be between 1 and 4
ALTER TABLE instructional_videos ADD CONSTRAINT check_display_order CHECK (display_order >= 1 AND display_order <= 4);

-- Constraint: Ensure unique display_order per team (or NULL for company-wide)
CREATE UNIQUE INDEX IF NOT EXISTS idx_instructional_videos_unique_order 
ON instructional_videos(COALESCE(team_id, '00000000-0000-0000-0000-000000000000'::uuid), display_order);

-- Enable RLS
ALTER TABLE instructional_videos ENABLE ROW LEVEL SECURITY;

-- Policy: Team members can view instructional videos for their team
CREATE POLICY "Team members can view their team instructional videos" ON instructional_videos
  FOR SELECT
  USING (
    team_id IS NULL OR team_id IN (
      SELECT team_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy: Admins can insert instructional videos
CREATE POLICY "Admins can upload instructional videos" ON instructional_videos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Policy: Admins can update instructional videos
CREATE POLICY "Admins can update instructional videos" ON instructional_videos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Policy: Admins can delete instructional videos
CREATE POLICY "Admins can delete instructional videos" ON instructional_videos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Comment
COMMENT ON TABLE instructional_videos IS 'Company-created instructional videos showing how to use DoorIQ, displayed at top of learning page';

