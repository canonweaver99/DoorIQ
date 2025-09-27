-- Create storage bucket for audio recordings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-recordings',
  'audio-recordings',
  true, -- Public access for playback
  52428800, -- 50MB max file size
  ARRAY['audio/webm', 'audio/mp3', 'audio/wav', 'audio/mpeg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['audio/webm', 'audio/mp3', 'audio/wav', 'audio/mpeg'];

-- Storage policies for audio recordings
CREATE POLICY "Users can upload their own audio recordings" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'audio-recordings' AND auth.uid()::text = (string_to_array(name, '/'))[2]);

CREATE POLICY "Users can view all audio recordings" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'audio-recordings');

CREATE POLICY "Users can delete their own audio recordings" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'audio-recordings' AND auth.uid()::text = (string_to_array(name, '/'))[2]);
