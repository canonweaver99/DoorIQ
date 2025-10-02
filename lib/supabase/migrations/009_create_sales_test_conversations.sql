-- Create sales_test_conversations table for ElevenLabs conversation analysis
-- This table stores the detailed performance metrics from ElevenLabs API analysis

-- Ensure UUID extension exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing table and policies if they exist (clean slate)
DROP TABLE IF EXISTS sales_test_conversations CASCADE;

-- Create the table
CREATE TABLE sales_test_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Reference fields (remove foreign key constraints to avoid dependency issues)
  user_id UUID NOT NULL,
  conversation_id TEXT UNIQUE NOT NULL,
  agent_id UUID,
  
  -- Outcome
  outcome TEXT CHECK (outcome IN ('SUCCESS', 'FAILURE', 'PARTIAL')),
  sale_closed BOOLEAN DEFAULT FALSE,
  
  -- Basic metrics
  total_turns INTEGER,
  conversation_duration_seconds INTEGER,
  questions_asked_by_homeowner INTEGER,
  homeowner_first_words TEXT,
  homeowner_final_words TEXT,
  homeowner_key_questions TEXT[],
  interruptions_count INTEGER,
  filler_words_count INTEGER,
  time_to_value_seconds INTEGER,
  close_attempted BOOLEAN,
  closing_technique TEXT,
  objections_raised INTEGER,
  objections_resolved INTEGER,
  rapport_score INTEGER,
  
  -- AI analysis text fields
  conversation_summary TEXT,
  what_worked TEXT,
  what_failed TEXT,
  key_learnings TEXT,
  homeowner_response_pattern TEXT,
  sales_rep_energy_level TEXT CHECK (sales_rep_energy_level IN ('low', 'moderate', 'high', 'too aggressive')),
  sentiment_progression TEXT,
  
  -- Full transcript from ElevenLabs
  full_transcript JSONB
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_test_user_id ON sales_test_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_test_conversation_id ON sales_test_conversations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_sales_test_created_at ON sales_test_conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_test_outcome ON sales_test_conversations(outcome);

-- Enable RLS
ALTER TABLE sales_test_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies (use table-qualified column names)
CREATE POLICY sales_test_select_own ON sales_test_conversations
FOR SELECT USING (auth.uid() = sales_test_conversations.user_id);

CREATE POLICY sales_test_insert_own ON sales_test_conversations
FOR INSERT WITH CHECK (auth.uid() = sales_test_conversations.user_id);

CREATE POLICY sales_test_update_own ON sales_test_conversations
FOR UPDATE USING (auth.uid() = sales_test_conversations.user_id) 
WITH CHECK (auth.uid() = sales_test_conversations.user_id);

-- Admin policies
CREATE POLICY sales_test_select_admin ON sales_test_conversations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

CREATE POLICY sales_test_insert_admin ON sales_test_conversations
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

CREATE POLICY sales_test_update_admin ON sales_test_conversations
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

