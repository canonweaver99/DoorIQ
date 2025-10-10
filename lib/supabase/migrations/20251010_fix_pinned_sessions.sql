-- Idempotent fix for pinned_sessions to avoid referencing non-existent public.sessions

DO $$
DECLARE
  pinned_exists BOOLEAN;
  id_type TEXT;
BEGIN
  -- Create table only if it doesn't already exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'pinned_sessions'
  ) INTO pinned_exists;

  IF NOT pinned_exists THEN
    -- Detect training_sessions id type if table exists
    SELECT c.data_type INTO id_type
    FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.table_name = 'training_sessions' AND c.column_name = 'id';

    IF id_type IS NULL THEN
      -- training_sessions not found; create without FK and nullable session_id (uuid)
      EXECUTE 'CREATE TABLE IF NOT EXISTS public.pinned_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          session_id UUID,
          note TEXT,
          pinned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, session_id)
        )';
    ELSIF id_type = 'integer' THEN
      -- training_sessions with integer id
      EXECUTE 'CREATE TABLE IF NOT EXISTS public.pinned_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          session_id INTEGER NOT NULL REFERENCES public.training_sessions(id) ON DELETE CASCADE,
          note TEXT,
          pinned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, session_id)
        )';
    ELSE
      -- default to uuid
      EXECUTE 'CREATE TABLE IF NOT EXISTS public.pinned_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          session_id UUID NOT NULL REFERENCES public.training_sessions(id) ON DELETE CASCADE,
          note TEXT,
          pinned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, session_id)
        )';
    END IF;
  END IF;

  -- Indexes (safe to run repeatedly)
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_pinned_sessions_user_id ON public.pinned_sessions(user_id)';
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_pinned_sessions_session_id ON public.pinned_sessions(session_id)';

  -- Enable RLS and policies
  EXECUTE 'ALTER TABLE public.pinned_sessions ENABLE ROW LEVEL SECURITY';

  -- Policies (drop-and-recreate for idempotency)
  EXECUTE 'DROP POLICY IF EXISTS "Users can view their own pinned sessions" ON public.pinned_sessions';
  EXECUTE 'CREATE POLICY "Users can view their own pinned sessions" ON public.pinned_sessions FOR SELECT USING (user_id = auth.uid())';

  EXECUTE 'DROP POLICY IF EXISTS "Users can pin their own sessions" ON public.pinned_sessions';
  EXECUTE 'CREATE POLICY "Users can pin their own sessions" ON public.pinned_sessions FOR INSERT WITH CHECK (user_id = auth.uid())';

  EXECUTE 'DROP POLICY IF EXISTS "Users can update their own pins" ON public.pinned_sessions';
  EXECUTE 'CREATE POLICY "Users can update their own pins" ON public.pinned_sessions FOR UPDATE USING (user_id = auth.uid())';

  EXECUTE 'DROP POLICY IF EXISTS "Users can unpin their own sessions" ON public.pinned_sessions';
  EXECUTE 'CREATE POLICY "Users can unpin their own sessions" ON public.pinned_sessions FOR DELETE USING (user_id = auth.uid())';
END $$;
