-- Create storage bucket for session video recordings
-- Migration: 051_create_video_storage_bucket

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'session-videos',
  'session-videos',
  true, -- Public access for playback
  104857600, -- 100MB max file size
  ARRAY['video/webm', 'video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['video/webm', 'video/mp4', 'video/quicktime'];

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can upload their own video recordings" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all video recordings" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own video recordings" ON storage.objects;

-- Storage policies for video recordings
-- Upload: Users can only upload to their own folder (sessions/{user_id}/...)
CREATE POLICY "Users can upload their own video recordings" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'session-videos' AND 
    auth.uid()::text = (string_to_array(name, '/'))[2]
  );

-- Select: Users can view all videos (public bucket)
CREATE POLICY "Users can view all video recordings" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'session-videos');

-- Delete: Users can only delete their own videos
CREATE POLICY "Users can delete their own video recordings" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'session-videos' AND 
    auth.uid()::text = (string_to_array(name, '/'))[2]
  );

-- Add comment for tracking
COMMENT ON COLUMN live_sessions.video_url IS 'Public URL to the video recording stored in session-videos bucket';

