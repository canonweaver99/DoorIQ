# Database Migration Required

## Issue
The new grading system requires database columns that may not exist yet. If you see errors like:
- "Failed to save instant metrics"
- "Failed to save key moments"

This means the migration `085_add_new_grading_system.sql` has not been run on your database.

## Solution

### For Supabase (Production)
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run the migration file: `lib/supabase/migrations/085_add_new_grading_system.sql`

### For Local Development
```bash
# If using Supabase CLI
supabase migration up

# Or apply manually via Supabase dashboard SQL editor
```

## What the Migration Adds
- `instant_metrics` (JSONB) column
- `key_moments` (JSONB) column  
- `moment_analysis` (JSONB) column
- `elevenlabs_conversation_id` (TEXT) column
- `elevenlabs_metrics` (JSONB) column
- `grading_version` (TEXT) column
- Updates `grading_status` enum to include new statuses
- Creates `moment_patterns` table

## Verify Migration
After running the migration, verify columns exist:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'live_sessions' 
AND column_name IN ('instant_metrics', 'key_moments', 'moment_analysis');
```

