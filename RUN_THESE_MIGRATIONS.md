# 🔧 Run These Migrations NOW

You need to run these migrations in your Supabase database to fix the errors.

## Step 1: Go to Supabase SQL Editor

Open: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new

## Step 2: Run Migration 008 (Score Fields)

Copy and paste this SQL, then click **Run**:

```sql
-- Add missing score fields to live_sessions table for grading system

ALTER TABLE live_sessions 
ADD COLUMN IF NOT EXISTS safety_score INTEGER CHECK (safety_score >= 0 AND safety_score <= 100),
ADD COLUMN IF NOT EXISTS close_effectiveness_score INTEGER CHECK (close_effectiveness_score >= 0 AND close_effectiveness_score <= 100),
ADD COLUMN IF NOT EXISTS introduction_score INTEGER CHECK (introduction_score >= 0 AND introduction_score <= 100),
ADD COLUMN IF NOT EXISTS listening_score INTEGER CHECK (listening_score >= 0 AND listening_score <= 100);

-- Create index for faster score queries
CREATE INDEX IF NOT EXISTS idx_live_sessions_overall_score ON live_sessions(overall_score);
CREATE INDEX IF NOT EXISTS idx_live_sessions_ended_at ON live_sessions(ended_at);
```

✅ You should see: "Success. No rows returned"

---

## Step 3: Run Migration 009 (Performance Metrics Table)

Copy and paste this SQL, then click **Run**:

```sql
-- Create sales_test_conversations table for ElevenLabs conversation analysis
-- This table stores the detailed performance metrics from ElevenLabs API analysis

CREATE TABLE IF NOT EXISTS sales_test_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Reference fields
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  conversation_id TEXT UNIQUE NOT NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  
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

-- RLS Policies
DROP POLICY IF EXISTS sales_test_select_own ON sales_test_conversations;
CREATE POLICY sales_test_select_own ON sales_test_conversations
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS sales_test_insert_own ON sales_test_conversations;
CREATE POLICY sales_test_insert_own ON sales_test_conversations
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS sales_test_update_own ON sales_test_conversations;
CREATE POLICY sales_test_update_own ON sales_test_conversations
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Admin policies
DROP POLICY IF EXISTS sales_test_select_admin ON sales_test_conversations;
CREATE POLICY sales_test_select_admin ON sales_test_conversations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

DROP POLICY IF EXISTS sales_test_insert_admin ON sales_test_conversations;
CREATE POLICY sales_test_insert_admin ON sales_test_conversations
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

DROP POLICY IF EXISTS sales_test_update_admin ON sales_test_conversations;
CREATE POLICY sales_test_update_admin ON sales_test_conversations
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);
```

✅ You should see: "Success. No rows returned"

---

## Step 4: Verify It Worked

Run this query to check:

```sql
-- Check that score columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'live_sessions' 
AND column_name IN ('safety_score', 'close_effectiveness_score', 'introduction_score', 'listening_score');

-- Check that sales_test_conversations table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'sales_test_conversations';
```

You should see:
- 4 rows for the score columns
- 1 row for the table

---

## All Done! 🎉

After running these migrations:
1. **Reload your app** (hard refresh: Cmd+Shift+R)
2. **Try another training session**
3. Both the **Transcript Analysis** and **Performance Metrics** tabs should work!

---

## What These Fix

**Migration 008**: Adds score fields so the AI grading can save:
- Safety score
- Close effectiveness score  
- Introduction score
- Listening score

**Migration 009**: Creates the table for ElevenLabs performance analysis:
- Conversation metrics
- Sentiment analysis
- What worked/failed
- Key learnings

