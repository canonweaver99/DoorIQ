-- Add voice_url column to messages table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'messages' 
    AND column_name = 'voice_url'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN voice_url TEXT;
  END IF;
END $$;

-- Add file_attachments column to messages table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'messages' 
    AND column_name = 'file_attachments'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN file_attachments JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Create pinned_sessions table
CREATE TABLE IF NOT EXISTS public.pinned_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  note TEXT,
  pinned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, session_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_messages_voice_url ON public.messages(voice_url) WHERE voice_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pinned_sessions_user_id ON public.pinned_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pinned_sessions_session_id ON public.pinned_sessions(session_id);

-- RLS Policies for pinned_sessions
ALTER TABLE public.pinned_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own pinned sessions" ON public.pinned_sessions;
CREATE POLICY "Users can view their own pinned sessions" ON public.pinned_sessions
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can pin their own sessions" ON public.pinned_sessions;
CREATE POLICY "Users can pin their own sessions" ON public.pinned_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own pins" ON public.pinned_sessions;
CREATE POLICY "Users can update their own pins" ON public.pinned_sessions
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can unpin their own sessions" ON public.pinned_sessions;
CREATE POLICY "Users can unpin their own sessions" ON public.pinned_sessions
  FOR DELETE USING (user_id = auth.uid());

-- Update get_conversation_history to include voice and attachments
CREATE OR REPLACE FUNCTION get_conversation_history(
  p_user1_id UUID,
  p_user2_id UUID,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  message_id UUID,
  message_text TEXT,
  voice_url TEXT,
  file_attachments JSONB,
  sender_id UUID,
  sender_name TEXT,
  sender_role TEXT,
  created_at TIMESTAMPTZ,
  is_read BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id as message_id,
    m.message as message_text,
    m.voice_url,
    m.file_attachments,
    m.sender_id,
    u.full_name as sender_name,
    u.role as sender_role,
    m.created_at,
    m.is_read
  FROM public.messages m
  JOIN public.users u ON u.id = m.sender_id
  WHERE (
    (m.sender_id = p_user1_id AND m.recipient_id = p_user2_id) OR
    (m.sender_id = p_user2_id AND m.recipient_id = p_user1_id)
  )
  ORDER BY m.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Create storage buckets for voice messages and attachments
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES 
  ('voice-messages', 'voice-messages', false, false, 10485760, ARRAY['audio/webm', 'audio/mp3', 'audio/wav', 'audio/ogg']),
  ('message-attachments', 'message-attachments', false, false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage buckets
DROP POLICY IF EXISTS "Users can upload voice messages" ON storage.objects;
CREATE POLICY "Users can upload voice messages" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'voice-messages' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can view voice messages in their conversations" ON storage.objects;
CREATE POLICY "Users can view voice messages in their conversations" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'voice-messages' AND
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.voice_url = storage.objects.name
      AND (m.sender_id = auth.uid() OR m.recipient_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can upload message attachments" ON storage.objects;
CREATE POLICY "Users can upload message attachments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'message-attachments' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can view attachments in their conversations" ON storage.objects;
CREATE POLICY "Users can view attachments in their conversations" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'message-attachments' AND
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.file_attachments::text LIKE '%' || storage.objects.name || '%'
      AND (m.sender_id = auth.uid() OR m.recipient_id = auth.uid())
    )
  );

-- Grant permissions
GRANT ALL ON public.pinned_sessions TO authenticated;

-- Enable realtime for pinned sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.pinned_sessions;
