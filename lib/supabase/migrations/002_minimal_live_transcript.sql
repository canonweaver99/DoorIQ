-- Minimal schema cleanup for Live Transcript + Grader only
-- Safe/idempotent: all operations guarded by IF EXISTS / IF NOT EXISTS

-- 0) Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1) Ensure core tables exist (users, training_sessions)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  rep_id TEXT UNIQUE,
  role TEXT DEFAULT 'rep' CHECK (role IN ('rep','manager','admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  scenario_type TEXT DEFAULT 'standard',
  overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100),
  rapport_score INTEGER CHECK (rapport_score BETWEEN 0 AND 100),
  objection_handling_score INTEGER CHECK (objection_handling_score BETWEEN 0 AND 100),
  safety_score INTEGER CHECK (safety_score BETWEEN 0 AND 100),
  close_effectiveness_score INTEGER CHECK (close_effectiveness_score BETWEEN 0 AND 100),
  introduction_score INTEGER CHECK (introduction_score BETWEEN 0 AND 100),
  listening_score INTEGER CHECK (listening_score BETWEEN 0 AND 100),
  transcript JSONB DEFAULT '[]'::jsonb,
  analytics JSONB DEFAULT '{}'::jsonb,
  sentiment_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) Drop unused/legacy tables (only if present)
DROP TABLE IF EXISTS scenarios CASCADE;
DROP TABLE IF EXISTS scenario_instructions CASCADE;
DROP TABLE IF EXISTS daily_challenges CASCADE;
DROP TABLE IF EXISTS user_challenge_progress CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS session_events CASCADE;

-- 3) Remove legacy policy that referenced teams/team_id (if present)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Managers can view team sessions' 
      AND tablename = 'training_sessions'
  ) THEN
    DROP POLICY "Managers can view team sessions" ON training_sessions;
  END IF;
END $$;

-- 4) Drop users.team_id if it exists
ALTER TABLE users DROP COLUMN IF EXISTS team_id;

-- 5) Minimal agents table: only Austin remains
DROP TABLE IF EXISTS agents CASCADE;
CREATE TABLE agents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  persona TEXT,
  eleven_agent_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Austin (replace agent id here if needed)
INSERT INTO agents (name, persona, eleven_agent_id, is_active)
VALUES (
  'Austin Rodriguez',
  'Suburban homeowner, safety-conscious, price-aware; friendly but pragmatic.',
  'agent_7001k5jqfjmtejvs77jvhjf254tz',
  TRUE
);

-- 6) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_ts_user_id ON training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ts_created_at ON training_sessions(created_at);

-- 7) RLS (leave as-is if already configured). Enable and add minimal policies if missing
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own profile' AND tablename = 'users'
  ) THEN
    CREATE POLICY "Users can view own profile" ON users
      FOR SELECT USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile' AND tablename = 'users'
  ) THEN
    CREATE POLICY "Users can update own profile" ON users
      FOR UPDATE USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own sessions' AND tablename = 'training_sessions'
  ) THEN
    CREATE POLICY "Users can view own sessions" ON training_sessions
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can create own sessions' AND tablename = 'training_sessions'
  ) THEN
    CREATE POLICY "Users can create own sessions" ON training_sessions
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own sessions' AND tablename = 'training_sessions'
  ) THEN
    CREATE POLICY "Users can update own sessions" ON training_sessions
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;


