-- Ensure message_text column exists in messages table
-- This handles cases where the column might be named differently or missing

DO $$ 
BEGIN
    -- Check if message_text column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'message_text') THEN
        -- Check if there's a 'text' column instead
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'text') THEN
            -- Rename 'text' to 'message_text'
            ALTER TABLE public.messages RENAME COLUMN text TO message_text;
        ELSE
            -- Add message_text column
            ALTER TABLE public.messages ADD COLUMN message_text TEXT NOT NULL DEFAULT '';
        END IF;
    END IF;
END $$;

-- Ensure other required columns exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'message_type') THEN
        ALTER TABLE public.messages ADD COLUMN message_type TEXT DEFAULT 'text' 
            CHECK (message_type IN ('text', 'file', 'image', 'system'));
    END IF;
END $$;
