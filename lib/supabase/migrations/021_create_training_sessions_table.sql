-- Create new training_sessions table with integer IDs to replace UUID-based live_sessions
-- This eliminates UUID corruption issues and simplifies the session system

CREATE TABLE IF NOT EXISTS training_sessions (
  id SERIAL PRIMARY KEY,                    -- Sequential integer ID (no UUIDs!)
  user_id UUID NOT NULL REFERENCES users(id),
  agent_name TEXT NOT NULL,
  agent_id TEXT,                           -- ElevenLabs agent ID
  
  -- Session timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Core data
  transcript JSONB DEFAULT '[]'::jsonb,    -- Single source of truth for transcript
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
  
  -- Simplified scoring (4 categories only)
  rapport_score INTEGER CHECK (rapport_score >= 0 AND rapport_score <= 100),
  discovery_score INTEGER CHECK (discovery_score >= 0 AND discovery_score <= 100),
  objection_handling_score INTEGER CHECK (objection_handling_score >= 0 AND objection_handling_score <= 100),
  closing_score INTEGER CHECK (closing_score >= 0 AND closing_score <= 100),
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  
  -- Simple feedback
  feedback_strengths TEXT[],
  feedback_improvements TEXT[],
  virtual_earnings DECIMAL DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  graded_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_training_sessions_user_id ON training_sessions(user_id);
CREATE INDEX idx_training_sessions_started_at ON training_sessions(started_at DESC);
CREATE INDEX idx_training_sessions_status ON training_sessions(status);

-- RLS policies
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY training_sessions_user_policy ON training_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Admins can see all sessions
CREATE POLICY training_sessions_admin_policy ON training_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'manager')
    )
  );

-- Function to automatically calculate overall score
CREATE OR REPLACE FUNCTION calculate_training_session_overall_score()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rapport_score IS NOT NULL 
     AND NEW.discovery_score IS NOT NULL 
     AND NEW.objection_handling_score IS NOT NULL 
     AND NEW.closing_score IS NOT NULL THEN
    NEW.overall_score := ROUND((
      NEW.rapport_score + 
      NEW.discovery_score + 
      NEW.objection_handling_score + 
      NEW.closing_score
    ) / 4.0);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate overall score
CREATE TRIGGER calculate_training_session_overall_score_trigger
  BEFORE INSERT OR UPDATE ON training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_training_session_overall_score();

-- Comments for documentation
COMMENT ON TABLE training_sessions IS 'New session system with integer IDs to eliminate UUID corruption issues';
COMMENT ON COLUMN training_sessions.id IS 'Sequential integer primary key - no UUID corruption possible';
COMMENT ON COLUMN training_sessions.transcript IS 'Single source of truth for conversation transcript';
COMMENT ON COLUMN training_sessions.status IS 'Session status: active, completed, or failed';
COMMENT ON COLUMN training_sessions.overall_score IS 'Automatically calculated average of the 4 category scores';
