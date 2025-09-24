-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (sales reps)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  rep_id TEXT UNIQUE NOT NULL,
  team_id UUID,
  role TEXT DEFAULT 'rep' CHECK (role IN ('rep', 'manager', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Training sessions table
CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  scenario_type TEXT DEFAULT 'standard',
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  rapport_score INTEGER CHECK (rapport_score >= 0 AND rapport_score <= 100),
  objection_handling_score INTEGER CHECK (objection_handling_score >= 0 AND objection_handling_score <= 100),
  safety_score INTEGER CHECK (safety_score >= 0 AND safety_score <= 100),
  close_effectiveness_score INTEGER CHECK (close_effectiveness_score >= 0 AND close_effectiveness_score <= 100),
  transcript JSONB,
  audio_url TEXT,
  analytics JSONB,
  sentiment_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Session events table (for real-time tracking)
CREATE TABLE IF NOT EXISTS session_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  data JSONB
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  points INTEGER DEFAULT 10,
  criteria JSONB
);

-- User achievements junction table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, achievement_id)
);

-- Daily challenges table
CREATE TABLE IF NOT EXISTS daily_challenges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE,
  title TEXT NOT NULL,
  description TEXT,
  criteria JSONB,
  points INTEGER DEFAULT 20
);

-- User challenge progress
CREATE TABLE IF NOT EXISTS user_challenge_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES daily_challenges(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, challenge_id)
);

-- Coaching tips table
CREATE TABLE IF NOT EXISTS coaching_tips (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category TEXT NOT NULL,
  tip TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Insert default achievements
INSERT INTO achievements (name, description, icon, points, criteria) VALUES
  ('First Success', 'Got Amanda to say yes', '🎯', 50, '{"close_success": true}'),
  ('Speed Runner', 'Closed in under 3 minutes', '⚡', 30, '{"max_duration": 180}'),
  ('Trust Builder', 'No interruptions full session', '🤝', 40, '{"interruptions": 0}'),
  ('Safety Star', 'Addressed all safety concerns', '🛡️', 25, '{"safety_concerns_addressed": true}'),
  ('Persistence Pays', 'Handled 5+ objections successfully', '💪', 35, '{"objections_handled": 5}'),
  ('Perfect Pitch', 'Achieved 90+ overall score', '⭐', 100, '{"min_score": 90}'),
  ('Daily Dedication', '7-day practice streak', '🔥', 50, '{"streak_days": 7}'),
  ('Rising Star', 'Improved score by 20+ points', '📈', 30, '{"score_improvement": 20}');

-- Insert default coaching tips
INSERT INTO coaching_tips (category, tip, order_index) VALUES
  ('opening', 'Smile before you knock - it comes through in your voice!', 1),
  ('opening', 'Lead with a friendly greeting and your name', 2),
  ('rapport', 'Mirror their energy level - if they''re calm, be calm', 3),
  ('rapport', 'Find common ground quickly - mention the neighborhood', 4),
  ('objections', 'Never argue - acknowledge their concern first', 5),
  ('objections', 'Use "I understand" before addressing objections', 6),
  ('safety', 'Always mention pet and child safety upfront', 7),
  ('safety', 'Have specific EPA registration numbers ready', 8),
  ('closing', 'Create urgency without being pushy', 9),
  ('closing', 'Offer multiple service options to give choice', 10);

-- Create indexes for performance
CREATE INDEX idx_sessions_user_id ON training_sessions(user_id);
CREATE INDEX idx_sessions_created_at ON training_sessions(created_at);
CREATE INDEX idx_sessions_score ON training_sessions(overall_score);
CREATE INDEX idx_events_session_id ON session_events(session_id);
CREATE INDEX idx_events_timestamp ON session_events(timestamp);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenge_progress ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions" ON training_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own sessions
CREATE POLICY "Users can create own sessions" ON training_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions" ON training_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Managers and admins can view all sessions in their team
CREATE POLICY "Managers can view team sessions" ON training_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('manager', 'admin')
      AND users.team_id = (
        SELECT team_id FROM users WHERE id = training_sessions.user_id
      )
    )
  );

-- Similar policies for other tables...
