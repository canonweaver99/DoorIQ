-- Create RLS policies for knowledge-base storage bucket
-- 
-- NOTE: The bucket itself must be created via Supabase Dashboard first!
-- Go to: Storage > Create Bucket > Set ID to "knowledge-base"
-- Settings:
--   - Public: Yes
--   - File size limit: 52428800 (50MB)
--   - Allowed MIME types: PDF, TXT, MD, DOC, DOCX, XLS, XLSX
--
-- This migration only creates the RLS policies for the bucket.
-- It consolidates storage policies for both legacy (user-based) and new (team-based) knowledge systems.

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can upload their own knowledge base files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all knowledge base files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own knowledge base files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own knowledge base files" ON storage.objects;
DROP POLICY IF EXISTS "Team members can upload knowledge docs" ON storage.objects;
DROP POLICY IF EXISTS "Team members can view their team knowledge docs" ON storage.objects;
DROP POLICY IF EXISTS "Managers can delete their team knowledge docs" ON storage.objects;

-- Create unified policies that support BOTH user-based and team-based folders

-- UPLOAD: Allow users to upload to their own folder OR their team's folder
CREATE POLICY "Users can upload knowledge base files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'knowledge-base' AND
  (
    -- Allow upload to user's own folder (legacy system)
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Allow upload to team folder (new system)
    (storage.foldername(name))[1] LIKE 'team-%'
  )
);

-- SELECT: Allow viewing all knowledge base files (public bucket)
CREATE POLICY "Users can view knowledge base files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'knowledge-base');

-- UPDATE: Allow users to update their own files or team files
CREATE POLICY "Users can update knowledge base files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'knowledge-base' AND
  (
    -- Allow update of user's own files (legacy system)
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Allow update of team files (new system)
    (storage.foldername(name))[1] LIKE 'team-%'
  )
);

-- DELETE: Allow users to delete their own files or team files
CREATE POLICY "Users can delete knowledge base files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'knowledge-base' AND
  (
    -- Allow delete of user's own files (legacy system)
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Allow delete of team files (new system)
    (storage.foldername(name))[1] LIKE 'team-%'
  )
);

-- Note: If you get errors about the bucket not existing, create it first via:
-- Supabase Dashboard → Storage → New Bucket → "knowledge-base"

