# Grading & Feedback System Fix Guide

## 🎯 Overview

This guide will help you fix the grading and feedback system so it works like it used to. The issue was that the `live_sessions` table was missing several score fields that the grading API was trying to save.

## ✅ What Was Fixed

1. **Created Migration**: Added missing score fields to `live_sessions` table
2. **Updated TypeScript Types**: Added the new fields to `database.types.ts`
3. **Verified API Flow**: Confirmed grading API, analytics page, and feedback page are correctly wired

## 🔧 Step 1: Run the Database Migration

You need to add the missing fields to your `live_sessions` table. Here's how:

### Option A: Via Supabase Dashboard (Recommended)

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new
2. Copy and paste the SQL from `lib/supabase/migrations/008_add_missing_score_fields.sql`:

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

3. Click **Run** (or press Ctrl+Enter / Cmd+Enter)
4. Verify it succeeded - you should see "Success. No rows returned"

### Option B: Via psql (Advanced)

If you have direct database access:

```bash
psql $DATABASE_URL < lib/supabase/migrations/008_add_missing_score_fields.sql
```

## 📊 Step 2: Verify the Fix

After running the migration, test the complete flow:

### Test 1: Complete a Session
1. Go to `/trainer` page
2. Start a session with any agent
3. Have a conversation (at least 30 seconds)
4. Click "End Session"

### Test 2: Check Grading
After ending the session, you should:
1. See a "Calculating Score" animation
2. Be redirected to `/trainer/analytics/[sessionId]`
3. See:
   - Overall score with animated number
   - Transcript with color-coded lines (green/yellow/red)
   - Individual scores (Rapport, Objection Handling, Safety, Close Effectiveness)
   - AI Coach chat button (bottom right)

### Test 3: View Feedback
The analytics page should display:
- **Transcript Analysis Tab**: Full conversation with line-by-line ratings
- **Performance Metrics Tab**: Detailed breakdown from ElevenLabs conversation data

## 🔍 How the System Works

### Flow Diagram
```
1. User starts session
   ↓
2. Transcript collected in real-time
   ↓
3. User clicks "End Session"
   ↓
4. POST /api/sessions/end
   - Saves full_transcript to live_sessions
   - Triggers grading automatically
   ↓
5. POST /api/grade/session
   - Runs lib/grader.ts
   - Calls OpenAI GPT-4o-mini for AI analysis
   - Saves scores and analytics
   ↓
6. User redirected to /trainer/analytics/[sessionId]
   ↓
7. Analytics page loads
   - Fetches session with scores
   - Displays transcript with highlights
   - Shows performance breakdown
```

### Score Fields Saved

The grading API now correctly saves these fields to `live_sessions`:

| Field | Description | Range |
|-------|-------------|-------|
| `overall_score` | Combined overall performance | 0-100 |
| `rapport_score` | Connection and trust building | 0-100 |
| `introduction_score` | Opening and presentation | 0-100 |
| `listening_score` | Active listening and discovery | 0-100 |
| `objection_handling_score` | Objection response effectiveness | 0-100 |
| `safety_score` | Safety discussion quality | 0-100 |
| `close_effectiveness_score` | Closing technique quality | 0-100 |

### Analytics Stored in `analytics` JSONB field

The `analytics` field contains rich analysis data:

```json
{
  "aiGrader": "openai+rule",
  "objective": { /* objective metrics */ },
  "objection_cases": [ /* detected objections */ ],
  "pest_control_objections": [ /* pest-specific objections */ ],
  "moment_of_death": { /* conversation breaking moments */ },
  "difficulty_analysis": { /* difficulty scoring */ },
  "feedback": {
    "strengths": ["array of strengths"],
    "improvements": ["array of improvements"],
    "specificTips": ["array of specific tips"]
  },
  "line_ratings": [
    {"idx": 0, "speaker": "rep", "label": "excellent", "rationale": "..."}
  ],
  "graded_at": "2025-01-01T00:00:00.000Z"
}
```

## 🐛 Troubleshooting

### Issue: Grading Not Happening

**Symptoms**: After ending a session, you're redirected but see no scores

**Solutions**:
1. Check browser console for errors
2. Verify `OPENAI_API_KEY` is set in environment variables
3. Check Supabase logs for the `live_sessions` update query
4. Manually trigger grading:
   ```bash
   curl -X POST https://your-app.vercel.app/api/grade/session \
     -H "Content-Type: application/json" \
     -d '{"sessionId": "YOUR_SESSION_ID"}'
   ```

### Issue: Analytics Page Shows "Session not found"

**Symptoms**: After redirect, analytics page can't find the session

**Solutions**:
1. Check that session ID in URL is valid
2. Verify the session exists in `live_sessions` table:
   ```sql
   SELECT id, started_at, ended_at, overall_score 
   FROM live_sessions 
   ORDER BY started_at DESC 
   LIMIT 10;
   ```
3. Check Row Level Security (RLS) policies - user must have access

### Issue: Scores Show as Null/Undefined

**Symptoms**: Analytics page loads but scores are missing

**Solutions**:
1. Verify migration ran successfully
2. Check if grading API returned errors (check server logs)
3. Re-run grading on that session (see manual trigger above)
4. Verify `full_transcript` field has data:
   ```sql
   SELECT id, full_transcript 
   FROM live_sessions 
   WHERE id = 'YOUR_SESSION_ID';
   ```

### Issue: Transcript Not Color-Coded

**Symptoms**: Transcript displays but all lines look the same

**Solutions**:
1. Verify `analytics.line_ratings` has data
2. Check TranscriptView component is receiving `analytics` prop
3. Grading might not have completed - wait a few seconds and refresh

## 📝 Files Modified

Here are all the files that were updated as part of this fix:

1. **`lib/supabase/migrations/008_add_missing_score_fields.sql`** (NEW)
   - Migration to add missing score fields

2. **`lib/supabase/database.types.ts`** (UPDATED)
   - Added `safety_score`, `close_effectiveness_score`, `introduction_score`, `listening_score` to Row, Insert, and Update types

3. **`app/api/grade/session/route.ts`** (NO CHANGES NEEDED)
   - Already correctly attempts to save all score fields

4. **`app/trainer/analytics/[sessionId]/page.tsx`** (NO CHANGES NEEDED)
   - Already correctly reads `full_transcript` and score fields

5. **`components/analytics/TranscriptView.tsx`** (NO CHANGES NEEDED)
   - Already correctly displays line ratings from `analytics.line_ratings`

## 🎉 Next Steps

After the migration is complete and you've verified the system works:

1. **Test with multiple agents** - Try Austin, Tiger Tom, and Tiger Tony
2. **Review AI Coach** - Click the chat icon to ask questions about your performance
3. **Check History** - Visit `/trainer/history` to see all past sessions
4. **Manager View** - If you're a manager, check `/admin` for team analytics

## 💡 Feature Highlights

The grading system now includes:

- ✅ **Real-time transcript capture** during sessions
- ✅ **AI-powered analysis** using OpenAI GPT-4o-mini
- ✅ **Line-by-line ratings** (excellent/good/average/poor)
- ✅ **7 different score categories**
- ✅ **Personalized feedback** (strengths, improvements, tips)
- ✅ **Objection detection** and handling analysis
- ✅ **"Moment of death" detection** (conversation killers)
- ✅ **AI Coach chat** for post-session Q&A
- ✅ **ElevenLabs conversation analysis** integration

## 📞 Need Help?

If you run into issues:

1. Check the console logs (browser and server)
2. Review the Supabase logs for database errors
3. Verify all environment variables are set
4. Check that the OpenAI API key has sufficient credits

Happy training! 🚀

