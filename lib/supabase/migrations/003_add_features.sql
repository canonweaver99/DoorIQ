-- Add new features migration
-- This migration adds support for audio storage, virtual earnings, and manager messaging

-- 1) Add audio_url to training_sessions if not exists
ALTER TABLE training_sessions 
ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- 2) Add virtual_earnings to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS virtual_earnings DECIMAL(10, 2) DEFAULT 0.00;

-- 3) Add virtual_earnings to training_sessions for tracking per-session earnings
ALTER TABLE training_sessions 
ADD COLUMN IF NOT EXISTS virtual_earnings DECIMAL(10, 2) DEFAULT 0.00;

-- 4) Create messages table for manager-rep communication
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5) Create manager_rep_assignments table to track which managers oversee which reps
CREATE TABLE IF NOT EXISTS manager_rep_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  manager_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rep_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(manager_id, rep_id)
);

-- 6) Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_manager_rep_assignments_manager_id ON manager_rep_assignments(manager_id);
CREATE INDEX IF NOT EXISTS idx_users_virtual_earnings ON users(virtual_earnings DESC);

-- 7) Add a trigger to update user's total virtual_earnings when a session completes
CREATE OR REPLACE FUNCTION update_user_virtual_earnings()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if virtual_earnings is set and session is ended
  IF NEW.virtual_earnings IS NOT NULL AND NEW.ended_at IS NOT NULL THEN
    UPDATE users 
    SET virtual_earnings = COALESCE(virtual_earnings, 0) + NEW.virtual_earnings
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_earnings_trigger ON training_sessions;
CREATE TRIGGER update_user_earnings_trigger
AFTER INSERT OR UPDATE OF virtual_earnings, ended_at ON training_sessions
FOR EACH ROW
EXECUTE FUNCTION update_user_virtual_earnings();

-- 8) Row Level Security (RLS) policies for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Allow users to see messages they sent or received
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT USING (auth.uid()::uuid = sender_id OR auth.uid()::uuid = recipient_id);

-- Allow users to create messages
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid()::uuid = sender_id);

-- Allow users to update their own sent messages or mark received messages as read
CREATE POLICY "Users can update message read status" ON messages
  FOR UPDATE USING (auth.uid()::uuid = recipient_id) WITH CHECK (auth.uid()::uuid = recipient_id);

-- 9) RLS policies for manager_rep_assignments
ALTER TABLE manager_rep_assignments ENABLE ROW LEVEL SECURITY;

-- Managers can see their rep assignments
CREATE POLICY "Managers can view their assignments" ON manager_rep_assignments
  FOR SELECT USING (
    auth.uid()::uuid = manager_id OR 
    auth.uid()::uuid = rep_id OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND role = 'admin')
  );

-- Only admins can manage assignments
CREATE POLICY "Admins can manage assignments" ON manager_rep_assignments
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND role = 'admin'));
