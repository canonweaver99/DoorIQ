-- Fix messages table by adding missing columns and updating structure

-- First, check if messages table exists and add missing columns
DO $$ 
BEGIN
    -- Add thread_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'thread_id') THEN
        ALTER TABLE public.messages ADD COLUMN thread_id UUID;
    END IF;

    -- Add parent_message_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'parent_message_id') THEN
        ALTER TABLE public.messages ADD COLUMN parent_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL;
    END IF;

    -- Add attachments column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'attachments') THEN
        ALTER TABLE public.messages ADD COLUMN attachments JSONB;
    END IF;

    -- Add message_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'message_type') THEN
        ALTER TABLE public.messages ADD COLUMN message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'system'));
    END IF;

    -- Add metadata column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'metadata') THEN
        ALTER TABLE public.messages ADD COLUMN metadata JSONB;
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'updated_at') THEN
        ALTER TABLE public.messages ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Add read_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'read_at') THEN
        ALTER TABLE public.messages ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add is_read column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'is_read') THEN
        ALTER TABLE public.messages ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Now create the indexes (they should work now that all columns exist)
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON public.messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_sender_recipient ON public.messages(sender_id, recipient_id);

-- Enable Row Level Security if not already enabled
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Recipients can mark messages as read" ON public.messages;

-- Create policies for messages
CREATE POLICY "Users can view their own messages" ON public.messages
    FOR SELECT
    USING (
        auth.uid() = sender_id OR 
        auth.uid() = recipient_id
    );

CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages" ON public.messages
    FOR UPDATE
    USING (auth.uid() = sender_id)
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can mark messages as read" ON public.messages
    FOR UPDATE
    USING (auth.uid() = recipient_id)
    WITH CHECK (auth.uid() = recipient_id);

-- Create or replace the update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a view for unread message counts
CREATE OR REPLACE VIEW public.unread_message_counts AS
SELECT 
    recipient_id,
    sender_id,
    COUNT(*) as unread_count
FROM public.messages
WHERE is_read = FALSE
GROUP BY recipient_id, sender_id;

-- Grant permissions on the view
GRANT SELECT ON public.unread_message_counts TO authenticated;

-- Create helper functions
CREATE OR REPLACE FUNCTION get_conversation_history(user1_id UUID, user2_id UUID)
RETURNS TABLE (
    id UUID,
    sender_id UUID,
    recipient_id UUID,
    message_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    is_read BOOLEAN,
    sender_name TEXT,
    sender_role TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.sender_id,
        m.recipient_id,
        m.message_text,
        m.created_at,
        m.is_read,
        u.full_name as sender_name,
        u.role as sender_role
    FROM public.messages m
    JOIN public.users u ON m.sender_id = u.id
    WHERE 
        (m.sender_id = user1_id AND m.recipient_id = user2_id) OR
        (m.sender_id = user2_id AND m.recipient_id = user1_id)
    ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_conversation_history(UUID, UUID) TO authenticated;

-- Create function to get latest conversations
CREATE OR REPLACE FUNCTION get_latest_conversations(user_id UUID)
RETURNS TABLE (
    contact_id UUID,
    contact_name TEXT,
    contact_role TEXT,
    last_message TEXT,
    last_message_time TIMESTAMP WITH TIME ZONE,
    unread_count BIGINT,
    is_online BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH latest_messages AS (
        SELECT DISTINCT ON (
            CASE 
                WHEN sender_id = user_id THEN recipient_id 
                ELSE sender_id 
            END
        )
        CASE 
            WHEN sender_id = user_id THEN recipient_id 
            ELSE sender_id 
        END as contact_id,
        message_text as last_message,
        created_at as last_message_time
        FROM public.messages
        WHERE sender_id = user_id OR recipient_id = user_id
        ORDER BY 
            CASE 
                WHEN sender_id = user_id THEN recipient_id 
                ELSE sender_id 
            END,
            created_at DESC
    )
    SELECT 
        lm.contact_id,
        u.full_name as contact_name,
        u.role as contact_role,
        lm.last_message,
        lm.last_message_time,
        COALESCE(umc.unread_count, 0) as unread_count,
        CASE 
            WHEN u.last_seen_at > NOW() - INTERVAL '5 minutes' THEN TRUE 
            ELSE FALSE 
        END as is_online
    FROM latest_messages lm
    JOIN public.users u ON lm.contact_id = u.id
    LEFT JOIN public.unread_message_counts umc 
        ON umc.recipient_id = user_id AND umc.sender_id = lm.contact_id
    ORDER BY lm.last_message_time DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_latest_conversations(UUID) TO authenticated;

-- Add last_seen_at column to users table if not exists
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create function to update user's last seen timestamp
CREATE OR REPLACE FUNCTION update_user_last_seen()
RETURNS VOID AS $$
BEGIN
    UPDATE public.users 
    SET last_seen_at = NOW()
    WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION update_user_last_seen() TO authenticated;
