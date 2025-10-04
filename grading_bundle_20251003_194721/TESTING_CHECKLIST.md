# ✅ Grading System Testing Checklist

Use this checklist to verify that all your database columns are being properly populated.

---

## ⚠️ PREREQUISITES

### Step 0: Run Migration 010 (REQUIRED!)
**Before testing, you MUST run the database migration:**

See `MIGRATION_REQUIRED.md` for detailed instructions, or run this in your Supabase SQL Editor:

```sql
-- Run the migration from: lib/supabase/migrations/010_add_grading_system_columns.sql
```

This adds 27 missing columns to the `live_sessions` table.

---

## 🚀 Quick Start

### Step 1: Complete a Test Session
1. Start your dev server: `npm run dev`
2. Go to `/trainer`
3. Select any homeowner agent
4. Complete a full conversation (at least 30 seconds)
5. End the session and wait for grading to complete

### Step 2: Run Verification Queries
Open your Supabase SQL editor and run the queries from `scripts/verify-grading-columns.sql`

---

## ✅ Verification Checklist

### Core Functionality
- [ ] Session completes without errors
- [ ] Grading runs automatically after session ends
- [ ] User is redirected to analytics page
- [ ] No console errors in browser or server logs

### Database Columns - Basic Info
- [ ] `id` - UUID populated ✅
- [ ] `created_at` - Timestamp set ✅
- [ ] `started_at` - Session start time ✅
- [ ] `ended_at` - Session end time ✅
- [ ] `user_id` - User UUID ✅
- [ ] `agent_id` - Agent UUID ✅
- [ ] `agent_name` - Agent name string ✅

### Database Columns - Scores
- [ ] `overall_score` - Number between 0-100
- [ ] `grade_letter` - One of: A+, A, B+, B, C+, C, D, F
- [ ] `pass` - Boolean (true if score >= 70)
- [ ] `rapport_score` - Number 0-100
- [ ] `objection_handling_score` - Number 0-100
- [ ] `safety_score` - Number 0-100
- [ ] `introduction_score` - Number 0-100
- [ ] `listening_score` - Number 0-100
- [ ] `close_effectiveness_score` - Number 0-100

### Database Columns - Score Breakdown
- [ ] `opening_introduction_score` - Number 0-100
- [ ] `opening_introduction_reason` - String explanation
- [ ] `rapport_building_score` - Number 0-100
- [ ] `rapport_building_reason` - String explanation
- [ ] `needs_discovery_score` - Number 0-100
- [ ] `needs_discovery_reason` - String explanation
- [ ] `value_communication_score` - Number 0-100
- [ ] `value_communication_reason` - String explanation
- [ ] `closing_score` - Number 0-100
- [ ] `closing_reason` - String explanation

### Database Columns - Conversation Metrics
- [ ] `total_turns` - Number of exchanges
- [ ] `conversation_duration_seconds` - Length in seconds
- [ ] `questions_asked_by_homeowner` - Count of questions
- [ ] `objections_raised` - Number of objections
- [ ] `objections_resolved` - Number handled successfully
- [ ] `homeowner_response_pattern` - String (short_dismissive, engaged_curious, etc.)
- [ ] `homeowner_first_words` - First 200 chars of first homeowner turn
- [ ] `homeowner_final_words` - Last 200 chars of last homeowner turn
- [ ] `homeowner_key_questions` - Array of question strings
- [ ] `sales_rep_energy_level` - low/moderate/high/too aggressive
- [ ] `close_attempted` - Boolean
- [ ] `closing_technique` - assumptive/trial/direct/alternative/urgency
- [ ] `time_to_value_seconds` - When value was mentioned
- [ ] `interruptions_count` - Number of interruptions
- [ ] `filler_words_count` - Count of um/uh/like

### Database Columns - Deductions
- [ ] `deductions_interruption_count` - Number of interruptions
- [ ] `deductions_pricing_deflections` - Count of price avoidance
- [ ] `deductions_pressure_tactics` - Boolean (detected aggressive tactics)
- [ ] `deductions_made_up_info` - Boolean (misleading claims)
- [ ] `deductions_rude_or_dismissive` - Boolean (unprofessional tone)
- [ ] `deductions_total` - Total penalty points

### Database Columns - Outcome
- [ ] `outcome` - SUCCESS/FAILURE/PARTIAL
- [ ] `sale_closed` - Boolean
- [ ] `conversation_summary` - Human-readable summary string

### Database Columns - Feedback
- [ ] `what_worked` - Array with at least 1 item
- [ ] `what_failed` - Array with at least 1 item
- [ ] `key_learnings` - Array with at least 1 item

### Database Columns - JSON Fields
- [ ] `full_transcript` - Array of turn objects
- [ ] `analytics` - Object with detailed breakdown
- [ ] `conversation_metadata` - Object with agent info

---

## 🔍 SQL Quick Checks

### Check 1: Most Recent Session Has Data
```sql
SELECT 
  overall_score, 
  grade_letter, 
  outcome, 
  sale_closed, 
  total_turns,
  conversation_summary
FROM live_sessions 
ORDER BY created_at DESC 
LIMIT 1;
```
**Expected:** All fields should have values (not NULL)

---

### Check 2: Feedback Arrays Are Populated
```sql
SELECT 
  what_worked, 
  what_failed, 
  key_learnings 
FROM live_sessions 
ORDER BY created_at DESC 
LIMIT 1;
```
**Expected:** Each array should have at least 1-3 items

---

### Check 3: Scores Are In Range
```sql
SELECT 
  overall_score,
  rapport_score,
  objection_handling_score,
  safety_score
FROM live_sessions 
WHERE overall_score NOT BETWEEN 0 AND 100
   OR rapport_score NOT BETWEEN 0 AND 100
   OR objection_handling_score NOT BETWEEN 0 AND 100
   OR safety_score NOT BETWEEN 0 AND 100;
```
**Expected:** Should return 0 rows (all scores should be 0-100)

---

### Check 4: Grade Letters Are Valid
```sql
SELECT grade_letter, COUNT(*) 
FROM live_sessions 
WHERE grade_letter NOT IN ('A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F')
GROUP BY grade_letter;
```
**Expected:** Should return 0 rows

---

### Check 5: Outcomes Are Valid
```sql
SELECT outcome, COUNT(*) 
FROM live_sessions 
WHERE outcome NOT IN ('SUCCESS', 'FAILURE', 'PARTIAL')
GROUP BY outcome;
```
**Expected:** Should return 0 rows

---

## 🐛 Troubleshooting

### Issue: Columns are still NULL
**Cause:** Grading might not have run  
**Fix:** Manually trigger grading:
```bash
curl -X POST http://localhost:3000/api/grade/session \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "YOUR_SESSION_ID"}'
```

---

### Issue: Feedback arrays are empty
**Cause:** LLM didn't return proper feedback  
**Check:** Look at `analytics.feedback` in the analytics JSON field  
**Fix:** Ensure OpenAI API key is valid and has credits

---

### Issue: Scores are all 0 or wrong
**Cause:** Transcript might be empty or malformed  
**Check:** 
```sql
SELECT full_transcript FROM live_sessions ORDER BY created_at DESC LIMIT 1;
```
**Fix:** Ensure ElevenLabs conversation is capturing turns correctly

---

### Issue: Outcome is always FAILURE
**Cause:** Homeowner final words don't match success patterns  
**Check:** 
```sql
SELECT homeowner_final_words FROM live_sessions ORDER BY created_at DESC LIMIT 1;
```
**Fix:** Detection patterns may need adjustment in `lib/grading-helpers.ts`

---

### Issue: Energy level or closing technique is NULL
**Cause:** Patterns not detected in transcript  
**Debug:** Check if rep actually used a closing technique or spoke at all
```sql
SELECT 
  total_turns, 
  conversation_duration_seconds,
  sales_rep_energy_level,
  closing_technique
FROM live_sessions 
ORDER BY created_at DESC 
LIMIT 1;
```

---

## 📊 Expected Results Summary

After completing a normal training session:

| Category | Expected State |
|----------|----------------|
| **Core Scores** | All between 0-100 |
| **Grade Letter** | One of: A+, A, B+, B, C+, C, D, F |
| **Outcome** | SUCCESS, FAILURE, or PARTIAL |
| **Conversation Metrics** | All populated (numbers or strings) |
| **Feedback Arrays** | Each has 1-5 items |
| **Summary** | Human-readable sentence |
| **Deductions** | Numbers >= 0 |
| **Pass Flag** | true if score >= 70, false otherwise |

---

## ✅ Sign-Off Criteria

Your system is fully working when:

1. ✅ All sessions in last 24 hours have `overall_score` populated
2. ✅ No NULL values in critical columns (score, grade, outcome)
3. ✅ Feedback arrays (`what_worked`, `what_failed`) have content
4. ✅ SQL aggregations work: `SELECT AVG(overall_score) FROM live_sessions`
5. ✅ Leaderboard queries work: `ORDER BY overall_score DESC`
6. ✅ Filtering works: `WHERE sale_closed = true`
7. ✅ Analytics page displays all data without errors
8. ✅ No console errors during or after session

---

## 🎯 Performance Benchmarks

### Grading Speed
- **Target:** < 3 seconds from session end to grade complete
- **Acceptable:** < 5 seconds
- **Slow:** > 10 seconds (investigate OpenAI API latency)

### Database Update
- **Target:** All 44 columns updated in single query
- **Acceptable:** Fallback to analytics-only update if needed
- **Error:** Check Supabase logs for schema mismatches

---

## 📞 Need Help?

If any checks fail:
1. Review `GRADING_COLUMN_AUDIT.md` for column details
2. Check `lib/grading-helpers.ts` for helper function logic
3. Inspect `app/api/grade/session/route.ts` for API logic
4. Look at Supabase logs for database errors
5. Run `scripts/verify-grading-columns.sql` for diagnostics

---

**Last Updated:** October 2, 2025  
**Status:** Ready for testing ✅


