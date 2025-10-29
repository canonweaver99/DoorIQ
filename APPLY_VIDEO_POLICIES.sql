-- ============================================
-- APPLY THIS SQL IN SUPABASE DASHBOARD
-- ============================================
-- Go to: Supabase Dashboard → SQL Editor → New Query
-- Paste this entire file and click "Run"
-- ============================================

-- Drop all existing policies on session-videos bucket
DROP POLICY IF EXISTS "Users can upload their own video recordings" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all video recordings" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own video recordings" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload to session-videos" ON storage.objects;
DROP POLICY IF EXISTS "Public can read session-videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete videos" ON storage.objects;

-- Create new simplified policies
-- These allow authenticated users to upload and everyone to view

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

-- Verify policies were created
SELECT 
  policyname, 
  cmd as operation,
  qual as using_expression,
  with_check as check_expression
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects' 
  AND policyname LIKE '%video%'
ORDER BY policyname;

