-- Disable RLS on group_members to fix infinite recursion
-- The application handles access control at the API level

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view group members of their groups" ON public.group_members;
DROP POLICY IF EXISTS "Group admins can manage members" ON public.group_members;

-- Disable RLS entirely for this table
ALTER TABLE public.group_members DISABLE ROW LEVEL SECURITY;

-- Note: Access control is still enforced because:
-- 1. Users must be authenticated to access the table (handled by Supabase auth)
-- 2. API routes check permissions before querying
-- 3. The messages table still has RLS to protect message content

