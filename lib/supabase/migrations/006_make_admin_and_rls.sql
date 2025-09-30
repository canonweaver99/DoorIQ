-- Set specific user as admin
UPDATE public.users
SET role = 'admin'
WHERE email = 'canonweaver@loopline.design';

-- Ensure RLS enabled on live_sessions
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

-- Allow admins to SELECT all rows
DROP POLICY IF EXISTS live_sessions_select_admin ON public.live_sessions;
CREATE POLICY live_sessions_select_admin ON public.live_sessions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- Allow admins to INSERT any rows
DROP POLICY IF EXISTS live_sessions_insert_admin ON public.live_sessions;
CREATE POLICY live_sessions_insert_admin ON public.live_sessions
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- Allow admins to UPDATE any rows
DROP POLICY IF EXISTS live_sessions_update_admin ON public.live_sessions;
CREATE POLICY live_sessions_update_admin ON public.live_sessions
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- Allow admins to DELETE any rows
DROP POLICY IF EXISTS live_sessions_delete_admin ON public.live_sessions;
CREATE POLICY live_sessions_delete_admin ON public.live_sessions
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- Keep existing own-user policies (create if missing)
DROP POLICY IF EXISTS live_sessions_select_own ON public.live_sessions;
CREATE POLICY live_sessions_select_own ON public.live_sessions
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS live_sessions_insert_own ON public.live_sessions;
CREATE POLICY live_sessions_insert_own ON public.live_sessions
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS live_sessions_update_own ON public.live_sessions;
CREATE POLICY live_sessions_update_own ON public.live_sessions
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


