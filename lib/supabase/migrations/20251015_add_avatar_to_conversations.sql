-- Add avatar_url to get_latest_conversations function

CREATE OR REPLACE FUNCTION get_latest_conversations(user_id UUID)
RETURNS TABLE (
    contact_id UUID,
    contact_name TEXT,
    contact_role TEXT,
    last_message TEXT,
    last_message_time TIMESTAMP WITH TIME ZONE,
    unread_count BIGINT,
    is_online BOOLEAN,
    avatar_url TEXT
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
        message as last_message,
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
        END as is_online,
        u.avatar_url
    FROM latest_messages lm
    JOIN public.users u ON lm.contact_id = u.id
    LEFT JOIN public.unread_message_counts umc 
        ON umc.recipient_id = user_id AND umc.sender_id = lm.contact_id
    ORDER BY lm.last_message_time DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_latest_conversations(UUID) TO authenticated;


