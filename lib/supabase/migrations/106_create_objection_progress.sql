-- Create User Objection Progress table
-- This allows tracking completion status for objections similar to modules

CREATE TABLE IF NOT EXISTS user_objection_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  objection_id UUID REFERENCES learning_objections(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE,
  time_spent_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, objection_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_objection_progress_user_id ON user_objection_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_objection_progress_objection_id ON user_objection_progress(objection_id);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_user_objection_progress_updated_at ON user_objection_progress;
CREATE TRIGGER update_user_objection_progress_updated_at
  BEFORE UPDATE ON user_objection_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE user_objection_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_objection_progress
-- Authenticated users can read their own progress
CREATE POLICY "Users can read their own objection progress"
  ON user_objection_progress FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert their own objection progress"
  ON user_objection_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update their own objection progress"
  ON user_objection_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

