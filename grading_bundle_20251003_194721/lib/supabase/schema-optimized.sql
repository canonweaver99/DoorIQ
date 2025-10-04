-- DoorIQ Optimized Schema for Live Transcript & Enhanced Feedback
-- This schema focuses on the core functionality needed for the training system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (sales reps)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  rep_id TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'rep' CHECK (role IN ('rep', 'manager', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Training sessions table (enhanced for transcript analysis)
CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  scenario_type TEXT DEFAULT 'standard',
  
  -- Overall and category scores
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  rapport_score INTEGER CHECK (rapport_score >= 0 AND rapport_score <= 100),
  objection_handling_score INTEGER CHECK (objection_handling_score >= 0 AND objection_handling_score <= 100),
  safety_score INTEGER CHECK (safety_score >= 0 AND safety_score <= 100),
  close_effectiveness_score INTEGER CHECK (close_effectiveness_score >= 0 AND close_effectiveness_score <= 100),
  introduction_score INTEGER CHECK (introduction_score >= 0 AND introduction_score <= 100),
  listening_score INTEGER CHECK (listening_score >= 0 AND listening_score <= 100),
  
  -- Full transcript with timestamps
  transcript JSONB DEFAULT '[]'::JSONB,
  
  -- Enhanced analytics from conversationAnalyzer
  analytics JSONB DEFAULT '{}'::JSONB,
  -- Structure: {
  --   keyMoments: { priceDiscussed, safetyAddressed, closeAttempted, objectionHandled },
  --   transcriptSections: { introduction, discovery, presentation, closing },
  --   feedback: { strengths[], improvements[], specificTips[] }
  -- }
  
  -- Sentiment tracking data
  sentiment_data JSONB DEFAULT '{}'::JSONB,
  -- Structure: { finalSentiment, interruptionCount, objectionCount }
  
  -- Analyzed transcript with line-by-line feedback
  analyzed_transcript JSONB DEFAULT '[]'::JSONB,
  -- Structure: [{ speaker, text, timestamp, analysis: { score, feedback, category, sentiment } }]
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Coaching tips table (for pre-session preparation)
CREATE TABLE IF NOT EXISTS coaching_tips (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category TEXT NOT NULL,
  tip TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Achievements table (for gamification)
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  points INTEGER DEFAULT 10,
  criteria JSONB,
  UNIQUE(name)
);

-- User achievements junction table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, achievement_id)
);

-- Insert default achievements
-- Ensure unique index exists for ON CONFLICT to work across existing DBs
CREATE UNIQUE INDEX IF NOT EXISTS achievements_name_key ON achievements(name);

INSERT INTO achievements (name, description, icon, points, criteria) VALUES
  ('First Success', 'Got Austin to schedule an appointment', '🎯', 50, '{"close_success": true}'),
  ('Speed Runner', 'Closed in under 3 minutes', '⚡', 30, '{"max_duration": 180}'),
  ('Trust Builder', 'No interruptions full session', '🤝', 40, '{"interruptions": 0}'),
  ('Safety Star', 'Addressed all safety concerns', '🛡️', 25, '{"safety_concerns_addressed": true}'),
  ('Persistence Pays', 'Handled 5+ objections successfully', '💪', 35, '{"objections_handled": 5}'),
  ('Perfect Pitch', 'Achieved 90+ overall score', '⭐', 100, '{"min_score": 90}'),
  ('Daily Dedication', '7-day practice streak', '🔥', 50, '{"streak_days": 7}'),
  ('Rising Star', 'Improved score by 20+ points', '📈', 30, '{"score_improvement": 20}')
ON CONFLICT (name) DO NOTHING;

-- Insert default coaching tips
INSERT INTO coaching_tips (category, tip, order_index) VALUES
  ('opening', 'Smile before you speak - it comes through in your voice!', 1),
  ('opening', 'Lead with a friendly greeting and your name', 2),
  ('rapport', 'Mirror their energy level - if they''re calm, be calm', 3),
  ('rapport', 'Find common ground quickly - mention the neighborhood', 4),
  ('objections', 'Never argue - acknowledge their concern first', 5),
  ('objections', 'Use "I understand" before addressing objections', 6),
  ('safety', 'Always mention pet and child safety upfront', 7),
  ('safety', 'Have specific EPA registration numbers ready', 8),
  ('closing', 'Create urgency without being pushy', 9),
  ('closing', 'Offer multiple service options to give choice', 10),
  ('discovery', 'Ask open-ended questions about their pest concerns', 11),
  ('discovery', 'Listen actively and take mental notes of their priorities', 12),
  ('presentation', 'Focus on benefits, not just features', 13),
  ('presentation', 'Use stories and examples from the neighborhood', 14)
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON training_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_score ON training_sessions(overall_score);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_coaching_tips_category ON coaching_tips(category);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own profile' AND tablename = 'users'
  ) THEN
    CREATE POLICY "Users can view own profile" ON users
      FOR SELECT USING (auth.uid() = id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile' AND tablename = 'users'
  ) THEN
    CREATE POLICY "Users can update own profile" ON users
      FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own sessions' AND tablename = 'training_sessions'
  ) THEN
    CREATE POLICY "Users can view own sessions" ON training_sessions
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can create own sessions' AND tablename = 'training_sessions'
  ) THEN
    CREATE POLICY "Users can create own sessions" ON training_sessions
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own sessions' AND tablename = 'training_sessions'
  ) THEN
    CREATE POLICY "Users can update own sessions" ON training_sessions
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view achievements' AND tablename = 'achievements'
  ) THEN
    CREATE POLICY "Anyone can view achievements" ON achievements
      FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view coaching tips' AND tablename = 'coaching_tips'
  ) THEN
    CREATE POLICY "Anyone can view coaching tips" ON coaching_tips
      FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own achievements' AND tablename = 'user_achievements'
  ) THEN
    CREATE POLICY "Users can view own achievements" ON user_achievements
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow anonymous session creation' AND tablename = 'training_sessions'
  ) THEN
    CREATE POLICY "Allow anonymous session creation" ON training_sessions
      FOR INSERT WITH CHECK (user_id IS NULL);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow anonymous session updates' AND tablename = 'training_sessions'
  ) THEN
    CREATE POLICY "Allow anonymous session updates" ON training_sessions
      FOR UPDATE USING (user_id IS NULL);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow anonymous session reads' AND tablename = 'training_sessions'
  ) THEN
    CREATE POLICY "Allow anonymous session reads" ON training_sessions
      FOR SELECT USING (user_id IS NULL);
  END IF;
END $$;
