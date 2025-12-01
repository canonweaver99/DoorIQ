-- Allow managers to upload instructional videos for their team
-- Migration: 117_allow_managers_upload_instructional_videos
-- Note: This migration requires migration 065_create_instructional_videos.sql to be run first

DO $$
BEGIN
  -- Check if the instructional_videos table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'instructional_videos'
  ) THEN
    -- Drop the existing admin-only INSERT policy
    DROP POLICY IF EXISTS "Admins can upload instructional videos" ON instructional_videos;

    -- Create new policy that allows both admins and managers to insert
    -- Managers can only insert videos for their own team
    CREATE POLICY "Admins and managers can upload instructional videos" ON instructional_videos
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() 
          AND (
            role = 'admin'
            OR (
              role = 'manager' 
              AND team_id = instructional_videos.team_id
            )
          )
        )
      );

    -- Also update UPDATE and DELETE policies to allow managers to manage their team's videos
    DROP POLICY IF EXISTS "Admins can update instructional videos" ON instructional_videos;
    CREATE POLICY "Admins and managers can update instructional videos" ON instructional_videos
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() 
          AND (
            role = 'admin'
            OR (
              role = 'manager' 
              AND team_id = instructional_videos.team_id
            )
          )
        )
      );

    DROP POLICY IF EXISTS "Admins can delete instructional videos" ON instructional_videos;
    CREATE POLICY "Admins and managers can delete instructional videos" ON instructional_videos
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() 
          AND (
            role = 'admin'
            OR (
              role = 'manager' 
              AND team_id = instructional_videos.team_id
            )
          )
        )
      );
  ELSE
    RAISE NOTICE 'Table instructional_videos does not exist. Please run migration 065_create_instructional_videos.sql first.';
  END IF;
END $$;

