-- Create knowledge-base storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('knowledge-base', 'knowledge-base', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for knowledge-base bucket
-- Allow authenticated users to upload files to their team folder
CREATE POLICY "Team members can upload knowledge docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'knowledge-base' AND
  (storage.foldername(name))[1] LIKE 'team-%'
);

-- Allow authenticated users to view files from their team folder
CREATE POLICY "Team members can view their team knowledge docs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'knowledge-base' AND
  (storage.foldername(name))[1] LIKE 'team-%'
);

-- Allow managers to delete files from their team folder  
CREATE POLICY "Managers can delete their team knowledge docs"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'knowledge-base' AND
  (storage.foldername(name))[1] LIKE 'team-%'
);

