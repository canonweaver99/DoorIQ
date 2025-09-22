-- Create conversation sessions table
CREATE TABLE IF NOT EXISTS conversation_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Session details
  user_id TEXT NOT NULL,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  
  -- Conversation data
  conversation_history JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  total_turns INTEGER DEFAULT 0,
  user_audio_urls TEXT[] DEFAULT '{}',
  agent_responses TEXT[] DEFAULT '{}',
  
  -- Final results
  final_grade JSONB,
  feedback JSONB
);

-- Create indexes
CREATE INDEX idx_conversation_sessions_user_id ON conversation_sessions(user_id);
CREATE INDEX idx_conversation_sessions_agent_id ON conversation_sessions(agent_id);
CREATE INDEX idx_conversation_sessions_status ON conversation_sessions(status);
CREATE INDEX idx_conversation_sessions_created_at ON conversation_sessions(created_at DESC);

-- Enable RLS
ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own conversation sessions" ON conversation_sessions 
  FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can create own conversation sessions" ON conversation_sessions 
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own conversation sessions" ON conversation_sessions 
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_conversation_sessions_updated_at 
  BEFORE UPDATE ON conversation_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
