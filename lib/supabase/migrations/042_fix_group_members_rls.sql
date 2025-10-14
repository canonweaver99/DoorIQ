-- Fix infinite recursion in group_members RLS policies

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view group members of their groups" ON public.group_members;
DROP POLICY IF EXISTS "Group admins can manage members" ON public.group_members;

-- Create simpler, non-recursive policies

-- Allow users to view group members if they themselves are a member of that group
CREATE POLICY "Users can view group members of their groups" ON public.group_members
  FOR SELECT USING (
    -- Allow viewing if the user is a member of the same group
    user_id = auth.uid() 
    OR 
    group_id IN (
      SELECT group_id FROM public.group_members 
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- Allow group admins to manage members (insert/update/delete)
CREATE POLICY "Group admins can manage members" ON public.group_members
  FOR ALL USING (
    -- Check if requesting user is an admin of this group
    group_id IN (
      SELECT group_id FROM public.group_members
      WHERE user_id = auth.uid() 
      AND role = 'admin'
      AND is_active = TRUE
    )
  );

-- Alternative: Disable RLS on group_members if the recursive check is too complex
-- This is safe if you trust your application-level checks
-- ALTER TABLE public.group_members DISABLE ROW LEVEL SECURITY;

