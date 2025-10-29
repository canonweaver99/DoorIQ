-- ============================================
-- FIX ALL STORAGE RLS POLICIES
-- ============================================
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================

-- Fix audio-recordings bucket policies
DROP POLICY IF EXISTS "Users can upload audio recordings" ON storage.objects;
DROP POLICY IF EXISTS "Users can view audio recordings" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete audio recordings" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload audio" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete audio" ON storage.objects;

CREATE POLICY "Authenticated users can upload audio" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'audio-recordings');

CREATE POLICY "Anyone can view audio" 
ON storage.objects 
FOR SELECT
USING (bucket_id = 'audio-recordings');

CREATE POLICY "Authenticated users can delete audio" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'audio-recordings');

-- Fix session-videos bucket policies
DROP POLICY IF EXISTS "Users can upload their own video recordings" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all video recordings" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own video recordings" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload to session-videos" ON storage.objects;
DROP POLICY IF EXISTS "Public can read session-videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete videos" ON storage.objects;

CREATE POLICY "Authenticated users can upload videos" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'session-videos');

CREATE POLICY "Anyone can view videos" 
ON storage.objects 
FOR SELECT
USING (bucket_id = 'session-videos');

CREATE POLICY "Authenticated users can delete videos" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'session-videos');

-- Verify all policies were created
SELECT 
  policyname, 
  cmd as operation,
  CASE 
    WHEN policyname LIKE '%audio%' THEN 'audio-recordings'
    WHEN policyname LIKE '%video%' THEN 'session-videos'
    ELSE 'other'
  END as bucket
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects' 
  AND (policyname LIKE '%audio%' OR policyname LIKE '%video%')
ORDER BY bucket, policyname;

