-- Create tables for ElevenLabs speech analytics
-- This migration creates tables to store raw conversation data and computed speech metrics

-- Table to store raw ElevenLabs conversation data from webhooks
CREATE TABLE IF NOT EXISTS elevenlabs_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id TEXT UNIQUE NOT NULL,
  agent_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES live_sessions(id) ON DELETE SET NULL,
  
  -- Raw webhook data
  transcript JSONB,
  metadata JSONB,
  analysis JSONB,
  raw_payload JSONB, -- Store full webhook payload for reference
  
  -- Extracted metadata
  duration_seconds INTEGER,
  message_count INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store computed speech analytics metrics
CREATE TABLE IF NOT EXISTS speech_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id TEXT REFERENCES elevenlabs_conversations(conversation_id) ON DELETE CASCADE,
  session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
  
  -- Speech Metrics
  words_per_minute FLOAT,
  speech_rate_variance FLOAT,
  pause_frequency FLOAT,
  average_pause_duration FLOAT,
  
  -- Voice Quality Metrics (will be populated in later phases)
  voice_clarity_score FLOAT,
  tone_consistency FLOAT,
  energy_level FLOAT,
  pitch_variance FLOAT,
  
  -- Conversation Flow
  interruption_count INTEGER,
  talk_time_ratio FLOAT, -- Rep vs Customer
  response_latency FLOAT,
  dead_air_time FLOAT,
  
  -- Linguistic Analysis
  filler_word_count INTEGER,
  vocabulary_richness FLOAT,
  sentence_complexity FLOAT,
  question_ratio FLOAT,
  
  -- Emotional Intelligence
  empathy_moments INTEGER,
  mirror_language_count INTEGER,
  positive_language_ratio FLOAT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add conversation_id column back to live_sessions for easy lookup
-- (It was dropped in migration 024 but we need it for correlation)
ALTER TABLE live_sessions
ADD COLUMN IF NOT EXISTS conversation_id TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_elevenlabs_conversations_conversation_id ON elevenlabs_conversations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_elevenlabs_conversations_agent_id ON elevenlabs_conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_elevenlabs_conversations_session_id ON elevenlabs_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_elevenlabs_conversations_user_id ON elevenlabs_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_elevenlabs_conversations_created_at ON elevenlabs_conversations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_speech_analytics_conversation_id ON speech_analytics(conversation_id);
CREATE INDEX IF NOT EXISTS idx_speech_analytics_session_id ON speech_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_speech_analytics_created_at ON speech_analytics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_live_sessions_conversation_id ON live_sessions(conversation_id);

-- RLS Policies for elevenlabs_conversations
ALTER TABLE elevenlabs_conversations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own conversations
CREATE POLICY elevenlabs_conversations_user_policy ON elevenlabs_conversations
  FOR ALL USING (auth.uid() = user_id);

-- Admins can see all conversations
CREATE POLICY elevenlabs_conversations_admin_policy ON elevenlabs_conversations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for speech_analytics
ALTER TABLE speech_analytics ENABLE ROW LEVEL SECURITY;

-- Users can only see analytics for their own sessions
CREATE POLICY speech_analytics_user_policy ON speech_analytics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM live_sessions
      WHERE live_sessions.id = speech_analytics.session_id
      AND live_sessions.user_id = auth.uid()
    )
  );

-- Admins can see all analytics
CREATE POLICY speech_analytics_admin_policy ON speech_analytics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Comments for documentation
COMMENT ON TABLE elevenlabs_conversations IS 'Raw conversation data from ElevenLabs webhooks';
COMMENT ON TABLE speech_analytics IS 'Computed speech metrics and analysis for training sessions';
COMMENT ON COLUMN live_sessions.conversation_id IS 'ElevenLabs conversation ID for correlation with webhook data';

