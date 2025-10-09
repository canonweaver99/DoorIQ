-- Fix RPC functions to use 'message' column instead of 'message_text'

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
        m.message as message_text,  -- Map 'message' column to 'message_text' output
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_conversation_history(UUID, UUID) TO authenticated;

-- Update get_latest_conversations function
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
        message as last_message,  -- Use 'message' column
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_latest_conversations(UUID) TO authenticated;
