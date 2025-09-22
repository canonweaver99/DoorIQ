-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create attempts table
CREATE TABLE IF NOT EXISTS attempts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id TEXT NOT NULL,
  persona JSONB NOT NULL,
  state TEXT NOT NULL DEFAULT 'OPENING',
  turn_count INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  evaluation JSONB
);

-- Create turns table
CREATE TABLE IF NOT EXISTS turns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  turn_number INTEGER NOT NULL,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  user_audio_url TEXT,
  ai_audio_url TEXT
);

-- Create scenarios table
CREATE TABLE IF NOT EXISTS scenarios (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  persona_template JSONB NOT NULL,
  success_criteria JSONB NOT NULL,
  active BOOLEAN DEFAULT true
);

-- Create audio_recordings table for storing audio files
CREATE TABLE IF NOT EXISTS audio_recordings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  turn_number INTEGER NOT NULL,
  audio_url TEXT NOT NULL,
  transcription TEXT,
  duration_seconds REAL,
  role TEXT NOT NULL CHECK (role IN ('user', 'ai'))
);

-- Create indexes for better performance
CREATE INDEX idx_attempts_user_id ON attempts(user_id);
CREATE INDEX idx_attempts_created_at ON attempts(created_at);
CREATE INDEX idx_turns_attempt_id ON turns(attempt_id);
CREATE INDEX idx_audio_recordings_attempt_id ON audio_recordings(attempt_id);

-- Create RLS policies (Row Level Security)
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_recordings ENABLE ROW LEVEL SECURITY;

-- Policies for attempts (users can only see their own attempts)
CREATE POLICY "Users can view own attempts" ON attempts
  FOR SELECT USING (auth.uid()::TEXT = user_id OR user_id = 'demo-user');

CREATE POLICY "Users can insert own attempts" ON attempts
  FOR INSERT WITH CHECK (auth.uid()::TEXT = user_id OR user_id = 'demo-user');

CREATE POLICY "Users can update own attempts" ON attempts
  FOR UPDATE USING (auth.uid()::TEXT = user_id OR user_id = 'demo-user');

-- Policies for turns (users can access turns for their attempts)
CREATE POLICY "Users can view turns for their attempts" ON turns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM attempts 
      WHERE attempts.id = turns.attempt_id 
      AND (attempts.user_id = auth.uid()::TEXT OR attempts.user_id = 'demo-user')
    )
  );

CREATE POLICY "Users can insert turns for their attempts" ON turns
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM attempts 
      WHERE attempts.id = turns.attempt_id 
      AND (attempts.user_id = auth.uid()::TEXT OR attempts.user_id = 'demo-user')
    )
  );

-- Policies for scenarios (everyone can read active scenarios)
CREATE POLICY "Anyone can view active scenarios" ON scenarios
  FOR SELECT USING (active = true);

-- Policies for audio_recordings
CREATE POLICY "Users can view audio for their attempts" ON audio_recordings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM attempts 
      WHERE attempts.id = audio_recordings.attempt_id 
      AND (attempts.user_id = auth.uid()::TEXT OR attempts.user_id = 'demo-user')
    )
  );

CREATE POLICY "Users can insert audio for their attempts" ON audio_recordings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM attempts 
      WHERE attempts.id = audio_recordings.attempt_id 
      AND (attempts.user_id = auth.uid()::TEXT OR attempts.user_id = 'demo-user')
    )
  );
