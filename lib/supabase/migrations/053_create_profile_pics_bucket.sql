-- Create profile pics bucket for user profile photos
-- This replaces the avatars bucket

-- Create profile pics bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile pics', 'profile pics', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Profile pics are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own profile pics" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile pics" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile pics" ON storage.objects;

-- Create new policies
CREATE POLICY "Profile pics are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile pics');

CREATE POLICY "Users can upload own profile pics"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profile pics' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own profile pics"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'profile pics' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own profile pics"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'profile pics' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Note: avatar_url column should already exist from previous migrations
-- If not, it will be added by the component or other migrations

