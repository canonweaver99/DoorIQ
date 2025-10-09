-- Enable realtime for messages table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_rel pr
        JOIN pg_class c ON c.oid = pr.prrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'messages'
          AND n.nspname = 'public'
          AND pr.prpubid = (SELECT oid FROM pg_publication WHERE pubname = 'supabase_realtime')
    ) THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.messages';
    END IF;
END$$;

-- Ensure the messages table exists and has proper permissions
GRANT SELECT ON public.messages TO authenticated;
GRANT INSERT ON public.messages TO authenticated;
GRANT UPDATE ON public.messages TO authenticated;

-- Ensure RLS is enabled
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Verify the update_user_last_seen function exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_proc
        WHERE proname = 'update_user_last_seen'
    ) THEN
        CREATE OR REPLACE FUNCTION update_user_last_seen()
        RETURNS VOID AS $func$
        BEGIN
            UPDATE public.users 
            SET last_seen_at = NOW()
            WHERE id = auth.uid();
        END;
        $func$ LANGUAGE plpgsql SECURITY DEFINER;
        
        GRANT EXECUTE ON FUNCTION update_user_last_seen() TO authenticated;
    END IF;
END$$;
