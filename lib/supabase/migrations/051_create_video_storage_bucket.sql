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
DROP POLICY IF EXISTS "Public can upload to session-videos" ON storage.objects;
DROP POLICY IF EXISTS "Public can read session-videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view videos" ON storage.objects;

-- Simplified policies - allow authenticated users to upload, anyone to view
-- This is appropriate for session videos which are not sensitive

-- Upload: Any authenticated user can upload videos
CREATE POLICY "Authenticated users can upload videos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'session-videos');

-- Select: Anyone can view videos (public bucket)
CREATE POLICY "Anyone can view videos" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'session-videos');

-- Delete: Authenticated users can delete any video (for cleanup)
CREATE POLICY "Authenticated users can delete videos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'session-videos');

-- Add comment for tracking
COMMENT ON COLUMN live_sessions.video_url IS 'Public URL to the video recording stored in session-videos bucket';

