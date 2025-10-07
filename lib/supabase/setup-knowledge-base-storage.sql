-- Create storage bucket for knowledge base files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'knowledge-base',
  'knowledge-base',
  true, -- Public bucket for easier access
  52428800, -- 50MB limit
  ARRAY[
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for knowledge base storage
CREATE POLICY "Users can upload their own knowledge base files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'knowledge-base' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view all knowledge base files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'knowledge-base');

CREATE POLICY "Users can update their own knowledge base files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'knowledge-base' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own knowledge base files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'knowledge-base' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
