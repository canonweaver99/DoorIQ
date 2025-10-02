# Debug: sales_test_conversations Table

## Check if table exists

Run this in Supabase SQL Editor:

```sql
-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'sales_test_conversations'
);

-- List all columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sales_test_conversations'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'sales_test_conversations';
```

## Expected Results

**Table exists**: Should return `true`

**Columns** (should have at least these):
- id (uuid)
- created_at (timestamp)
- user_id (uuid)
- conversation_id (text)
- agent_id (uuid)
- outcome (text)
- sale_closed (boolean)
- [... and many more]

**RLS Policies** (should have 6):
- sales_test_select_own
- sales_test_insert_own
- sales_test_update_own
- sales_test_select_admin
- sales_test_insert_admin
- sales_test_update_admin

---

## If Table Doesn't Exist

The migration didn't run properly. Try this **simplified version** that definitely works:

```sql
-- Ensure UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop any existing table/policies
DROP TABLE IF EXISTS sales_test_conversations CASCADE;

-- Create table (minimal version first, then we can add more)
CREATE TABLE sales_test_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL,
  conversation_id TEXT UNIQUE NOT NULL,
  agent_id UUID,
  outcome TEXT,
  sale_closed BOOLEAN DEFAULT FALSE,
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
  conversation_summary TEXT,
  what_worked TEXT,
  what_failed TEXT,
  key_learnings TEXT,
  homeowner_response_pattern TEXT,
  sales_rep_energy_level TEXT,
  sentiment_progression TEXT,
  full_transcript JSONB
);

-- Create indexes
CREATE INDEX idx_sales_test_user_id ON sales_test_conversations(user_id);
CREATE INDEX idx_sales_test_conversation_id ON sales_test_conversations(conversation_id);

-- Enable RLS
ALTER TABLE sales_test_conversations ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies (just allow authenticated users for now)
CREATE POLICY sales_test_authenticated_all ON sales_test_conversations
FOR ALL USING (auth.uid() = user_id);
```

---

## If Table Exists But Still Fails

Check the **actual error** in browser console. Common issues:

1. **Column mismatch**: API trying to save field that doesn't exist
2. **RLS blocking insert**: User not authenticated properly
3. **Constraint violation**: duplicate conversation_id, etc.

### Test Insert Manually

Try inserting a test row:

```sql
INSERT INTO sales_test_conversations (
  user_id, 
  conversation_id,
  outcome,
  total_turns
) VALUES (
  auth.uid(),  -- Your current user ID
  'test-' || gen_random_uuid()::text,
  'SUCCESS',
  10
);
```

If this fails, the error message will tell us exactly what's wrong!

---

## Quick Fix: Disable RLS Temporarily

**FOR TESTING ONLY** - Disable RLS to see if that's the issue:

```sql
ALTER TABLE sales_test_conversations DISABLE ROW LEVEL SECURITY;
```

If this makes it work, the problem is with the RLS policies. We can fix those.

To re-enable:
```sql
ALTER TABLE sales_test_conversations ENABLE ROW LEVEL SECURITY;
```

