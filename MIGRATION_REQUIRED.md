# ⚠️ DATABASE MIGRATION REQUIRED

**Status:** Migration 010 needs to be run before the new grading system will work

---

## 🚨 Problem

You're getting this error:
```
ERROR: 42703: column "homeowner_response_pattern" does not exist
```

This is because the database columns haven't been created yet. Your TypeScript types are defined, but the actual database columns are missing.

---

## ✅ Solution: Run Migration 010

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**

### Step 2: Run the Migration
Copy and paste the contents of `/lib/supabase/migrations/010_add_grading_system_columns.sql` into the SQL editor and click **Run**.

Or run this command directly:

```sql
-- Migration 010: Add comprehensive grading system columns to live_sessions
-- This adds all columns needed for the new grading system to work properly

-- ============================================
-- CONVERSATION METRICS (3 new columns)
-- ============================================
ALTER TABLE live_sessions 
ADD COLUMN IF NOT EXISTS homeowner_response_pattern TEXT,
ADD COLUMN IF NOT EXISTS time_to_value_seconds INTEGER,
ADD COLUMN IF NOT EXISTS conversation_summary TEXT;

-- ============================================
-- SCORE BREAKDOWN (11 columns)
-- ============================================
ALTER TABLE live_sessions
ADD COLUMN IF NOT EXISTS opening_introduction_score INTEGER CHECK (opening_introduction_score >= 0 AND opening_introduction_score <= 100),
ADD COLUMN IF NOT EXISTS opening_introduction_reason TEXT,
ADD COLUMN IF NOT EXISTS rapport_building_score INTEGER CHECK (rapport_building_score >= 0 AND rapport_building_score <= 100),
ADD COLUMN IF NOT EXISTS rapport_building_reason TEXT,
ADD COLUMN IF NOT EXISTS needs_discovery_score INTEGER CHECK (needs_discovery_score >= 0 AND needs_discovery_score <= 100),
ADD COLUMN IF NOT EXISTS needs_discovery_reason TEXT,
ADD COLUMN IF NOT EXISTS value_communication_score INTEGER CHECK (value_communication_score >= 0 AND value_communication_score <= 100),
ADD COLUMN IF NOT EXISTS value_communication_reason TEXT,
ADD COLUMN IF NOT EXISTS objection_handling_reason TEXT,
ADD COLUMN IF NOT EXISTS closing_score INTEGER CHECK (closing_score >= 0 AND closing_score <= 100),
ADD COLUMN IF NOT EXISTS closing_reason TEXT;

-- ============================================
-- DEDUCTIONS (6 columns)
-- ============================================
ALTER TABLE live_sessions
ADD COLUMN IF NOT EXISTS deductions_interruption_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS deductions_pricing_deflections INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS deductions_pressure_tactics BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deductions_made_up_info BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deductions_rude_or_dismissive BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deductions_total INTEGER DEFAULT 0;

-- ============================================
-- OUTCOME & RESULTS (4 columns)
-- ============================================
ALTER TABLE live_sessions
ADD COLUMN IF NOT EXISTS outcome TEXT CHECK (outcome IN ('SUCCESS', 'FAILURE', 'PARTIAL')),
ADD COLUMN IF NOT EXISTS sale_closed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pass BOOLEAN,
ADD COLUMN IF NOT EXISTS grade_letter TEXT CHECK (grade_letter IN ('A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'));

-- ============================================
-- FEEDBACK ARRAYS (3 columns)
-- ============================================
ALTER TABLE live_sessions
ADD COLUMN IF NOT EXISTS what_worked TEXT[],
ADD COLUMN IF NOT EXISTS what_failed TEXT[],
ADD COLUMN IF NOT EXISTS key_learnings TEXT[];

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_live_sessions_grade_letter ON live_sessions(grade_letter);
CREATE INDEX IF NOT EXISTS idx_live_sessions_outcome ON live_sessions(outcome);
CREATE INDEX IF NOT EXISTS idx_live_sessions_sale_closed ON live_sessions(sale_closed);
CREATE INDEX IF NOT EXISTS idx_live_sessions_pass ON live_sessions(pass);
CREATE INDEX IF NOT EXISTS idx_live_sessions_user_created ON live_sessions(user_id, created_at DESC);
```

### Step 3: Verify Migration Succeeded
Run this query to confirm:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'live_sessions' 
  AND column_name IN (
    'homeowner_response_pattern', 
    'conversation_summary',
    'outcome',
    'grade_letter',
    'what_worked',
    'deductions_total'
  )
ORDER BY column_name;
```

**Expected result:** Should return 6 rows showing the new columns exist.

---

## 📊 What This Migration Does

Adds **27 new columns** to the `live_sessions` table:

### Conversation Analysis (3 columns)
- `homeowner_response_pattern` - Engagement style
- `time_to_value_seconds` - When value was mentioned  
- `conversation_summary` - One-sentence summary

### Score Breakdown (11 columns)
- `opening_introduction_score` + reason
- `rapport_building_score` + reason
- `needs_discovery_score` + reason
- `value_communication_score` + reason
- `objection_handling_reason`
- `closing_score` + reason

### Deductions (6 columns)
- `deductions_interruption_count`
- `deductions_pricing_deflections`
- `deductions_pressure_tactics`
- `deductions_made_up_info`
- `deductions_rude_or_dismissive`
- `deductions_total`

### Outcome (4 columns)
- `outcome` (SUCCESS/FAILURE/PARTIAL)
- `sale_closed` (boolean)
- `pass` (score >= 70)
- `grade_letter` (A+ to F)

### Feedback (3 columns)
- `what_worked` (array)
- `what_failed` (array)
- `key_learnings` (array)

---

## ✅ After Migration

Once the migration runs successfully:

1. ✅ All SQL verification queries will work
2. ✅ Grading system will populate all columns
3. ✅ No more "column does not exist" errors
4. ✅ Analytics dashboards can use direct columns

---

## 🧪 Test After Migration

Run a training session and then check:

```sql
SELECT 
  overall_score,
  grade_letter,
  outcome,
  sale_closed,
  pass,
  conversation_summary,
  what_worked,
  what_failed
FROM live_sessions 
ORDER BY created_at DESC 
LIMIT 1;
```

All fields should have values!

---

## 🚀 Next Steps

After running the migration:
1. ✅ Run the verification SQL from `scripts/verify-grading-columns.sql`
2. ✅ Complete a test training session
3. ✅ Verify all columns are populated
4. ✅ Check analytics page displays correctly

---

## 📝 Notes

- ✅ **Safe to run multiple times** - Uses `IF NOT EXISTS`
- ✅ **Non-destructive** - Only adds columns, doesn't modify data
- ✅ **No downtime** - Can run on live database
- ✅ **Backwards compatible** - Old sessions remain unchanged

---

**Once this migration runs, your grading system will be fully operational! 🎉**

