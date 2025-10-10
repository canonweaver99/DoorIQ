-- Create groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  last_read_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(group_id, user_id)
);

-- Add group_id to messages table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'messages' 
    AND column_name = 'group_id'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update messages constraint to allow either recipient_id OR group_id
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_recipient_or_group_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_recipient_or_group_check 
  CHECK ((recipient_id IS NOT NULL AND group_id IS NULL) OR (recipient_id IS NULL AND group_id IS NOT NULL));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON public.groups(created_by);
CREATE INDEX IF NOT EXISTS idx_groups_is_active ON public.groups(is_active);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_group_id ON public.messages(group_id);

-- RLS Policies for groups table
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;
CREATE POLICY "Users can view groups they are members of" ON public.groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_members.group_id = groups.id 
      AND group_members.user_id = auth.uid() 
      AND group_members.is_active = TRUE
    )
  );

DROP POLICY IF EXISTS "Users can create groups" ON public.groups;
CREATE POLICY "Users can create groups" ON public.groups
  FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Group admins can update groups" ON public.groups;
CREATE POLICY "Group admins can update groups" ON public.groups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_members.group_id = groups.id 
      AND group_members.user_id = auth.uid() 
      AND group_members.role = 'admin'
      AND group_members.is_active = TRUE
    )
  );

-- RLS Policies for group_members table
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view group members of their groups" ON public.group_members;
CREATE POLICY "Users can view group members of their groups" ON public.group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id 
      AND gm.user_id = auth.uid() 
      AND gm.is_active = TRUE
    )
  );

DROP POLICY IF EXISTS "Group admins can manage members" ON public.group_members;
CREATE POLICY "Group admins can manage members" ON public.group_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id 
      AND gm.user_id = auth.uid() 
      AND gm.role = 'admin'
      AND gm.is_active = TRUE
    )
  );

-- Update messages RLS policies to include group messages
DROP POLICY IF EXISTS "Users can view their messages" ON public.messages;
CREATE POLICY "Users can view their messages" ON public.messages
  FOR SELECT USING (
    sender_id = auth.uid() 
    OR recipient_id = auth.uid()
    OR (
      group_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.group_members 
        WHERE group_members.group_id = messages.group_id 
        AND group_members.user_id = auth.uid() 
        AND group_members.is_active = TRUE
      )
    )
  );

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND (
      recipient_id IS NOT NULL 
      OR (
        group_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.group_members 
          WHERE group_members.group_id = messages.group_id 
          AND group_members.user_id = auth.uid() 
          AND group_members.is_active = TRUE
        )
      )
    )
  );

-- Create helper functions for group chats
CREATE OR REPLACE FUNCTION get_user_groups(p_user_id UUID)
RETURNS TABLE (
  group_id UUID,
  group_name TEXT,
  group_description TEXT,
  group_avatar_url TEXT,
  member_count BIGINT,
  unread_count BIGINT,
  last_message TEXT,
  last_message_time TIMESTAMPTZ,
  last_message_sender_name TEXT,
  user_role TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id as group_id,
    g.name as group_name,
    g.description as group_description,
    g.avatar_url as group_avatar_url,
    (SELECT COUNT(*) FROM public.group_members WHERE group_id = g.id AND is_active = TRUE) as member_count,
    (
      SELECT COUNT(*) 
      FROM public.messages m 
      WHERE m.group_id = g.id 
      AND m.created_at > COALESCE(gm.last_read_at, '1970-01-01'::timestamptz)
      AND m.sender_id != p_user_id
    ) as unread_count,
    (
      SELECT m.message 
      FROM public.messages m 
      WHERE m.group_id = g.id 
      ORDER BY m.created_at DESC 
      LIMIT 1
    ) as last_message,
    (
      SELECT m.created_at 
      FROM public.messages m 
      WHERE m.group_id = g.id 
      ORDER BY m.created_at DESC 
      LIMIT 1
    ) as last_message_time,
    (
      SELECT u.full_name 
      FROM public.messages m 
      JOIN public.users u ON u.id = m.sender_id
      WHERE m.group_id = g.id 
      ORDER BY m.created_at DESC 
      LIMIT 1
    ) as last_message_sender_name,
    gm.role as user_role
  FROM public.groups g
  JOIN public.group_members gm ON gm.group_id = g.id
  WHERE gm.user_id = p_user_id 
  AND gm.is_active = TRUE
  AND g.is_active = TRUE
  ORDER BY last_message_time DESC NULLS LAST;
END;
$$;

-- Grant permissions
GRANT ALL ON public.groups TO authenticated;
GRANT ALL ON public.group_members TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_groups TO authenticated;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.groups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
