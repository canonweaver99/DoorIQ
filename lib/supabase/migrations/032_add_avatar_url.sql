-- Add avatar_url column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create storage bucket for avatars if it doesn't exist
-- This needs to be run manually in Supabase dashboard:
-- 1. Go to Storage
-- 2. Create new bucket called "avatars"
-- 3. Set it to public
-- 4. Add RLS policy: Users can upload to their own folder

-- RLS policies for avatar uploads will be:
-- INSERT: Users can upload to avatars/{user_id}/*
-- SELECT: Public read access
-- UPDATE: Users can update their own avatars
-- DELETE: Users can delete their own avatars

