-- Fix RLS policies for messages table to ensure managers can send messages to reps
-- This migration creates simple policies that work for direct messages (recipient_id)
-- without requiring group_members table to exist

-- Drop ALL existing policies that might conflict
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view their messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Recipients can mark messages as read" ON public.messages;
DROP POLICY IF EXISTS "Users can update message read status" ON public.messages;

-- Create SELECT policy - users can view messages they sent or received
-- This works for direct messages (recipient_id) and doesn't require group_members
CREATE POLICY "Users can view their messages" ON public.messages
  FOR SELECT USING (
    sender_id = auth.uid() 
    OR recipient_id = auth.uid()
  );

-- Create INSERT policy - users can send direct messages
-- This allows sending messages when recipient_id is set (direct messages)
-- If group_id column exists and is set, it will also be allowed (group messages work separately)
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND recipient_id IS NOT NULL
  );

-- Create UPDATE policy for senders (editing their own messages)
CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Create UPDATE policy for recipients (marking messages as read)
CREATE POLICY "Recipients can mark messages as read" ON public.messages
  FOR UPDATE
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

