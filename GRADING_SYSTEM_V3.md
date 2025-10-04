# Grading System V3 - OpenAI Powered 🚀

**Status:** ✅ Implemented  
**Date:** October 4, 2025  
**Version:** 3.0-openai

## Overview

The grading system has been completely simplified to use **OpenAI GPT-4o-mini** for all conversation analysis instead of complex heuristic pattern matching. This provides:

- ✅ **Contextual Understanding** - AI understands nuance, not just keywords
- ✅ **Line-by-Line Feedback** - Color-coded ratings for every rep response
- ✅ **Alternative Phrases** - Specific suggestions for improvement
- ✅ **Easy Maintenance** - Just update the prompt, no code changes needed
- ✅ **Cost Effective** - ~$0.01-0.05 per session using gpt-4o-mini

---

## What Changed

### 🗑️ Deleted/Archived:
1. **950 lines of heuristic code** → Archived to `/archive/conversationAnalyzer.ts`
2. **Old conversation grading endpoint** → Deleted `/app/api/grade/conversation/route.ts`
3. **Pattern matching logic** → Replaced with AI analysis

### ✨ New Implementation:
1. **Single OpenAI Call** → `app/api/grade/session/route.ts` (230 lines vs 950 lines!)
2. **Structured JSON Output** → Uses OpenAI's strict JSON schema mode
3. **Enhanced Transcript View** → Shows alternative phrases on hover
4. **Test Script** → `scripts/test-grading.js` for quick testing

---

## How It Works

### 1. Session Ends
```
User finishes conversation → Transcript saved to live_sessions.full_transcript
```

### 2. Grading Triggered
```
POST /api/grade/session
Body: { sessionId: "uuid" }
```

### 3. OpenAI Analysis
The API sends the full transcript to OpenAI with instructions to:
- Score 7 categories (0-100): introduction, rapport, listening, sales_technique, closing, safety, overall
- Rate EVERY rep line: excellent, good, average, or poor
- Suggest alternative phrases for weak lines
- Identify key moments (price discussed, safety addressed, close attempted, etc.)
- Calculate virtual earnings (did they close the deal?)

### 4. Results Saved
All results saved to `live_sessions` table:
- `overall_score`, `rapport_score`, `introduction_score`, etc.
- `what_worked[]`, `what_failed[]`, `key_learnings[]`
- `analytics.line_ratings[]` with color codes and alternatives
- `virtual_earnings`

### 5. Frontend Display
The TranscriptView component shows:
- 🟢 Green = Excellent lines (advances sale)
- 🟡 Yellow = Good lines (adequate)
- 🔵 Blue = Average lines (neutral)
- 🔴 Red = Poor lines (needs improvement)

**Hover over any rep line** to see:
- Why it was rated that way
- 💡 Alternative phrase suggestion (if applicable)

---

## Database Schema

All existing columns in `live_sessions` are used:

```sql
-- Score columns (0-100)
overall_score INTEGER
rapport_score INTEGER
introduction_score INTEGER
listening_score INTEGER
objection_handling_score INTEGER
safety_score INTEGER
close_effectiveness_score INTEGER

-- Feedback arrays
what_worked TEXT[]
what_failed TEXT[]
key_learnings TEXT[]

-- Virtual earnings
virtual_earnings NUMERIC

-- Analytics JSONB
analytics JSONB {
  line_ratings: [
    {
      idx: 0,
      rating: "excellent" | "good" | "average" | "poor",
      reason: "Why this was rated this way",
      alternative: "Better phrase suggestion"
    }
  ],
  key_moments: {
    price_discussed: boolean,
    safety_addressed: boolean,
    close_attempted: boolean,
    objection_handled: boolean,
    deal_closed: boolean
  },
  grading_version: "3.0-openai",
  graded_at: "2025-10-04T..."
}
```

---

## Testing

### Option 1: Test Script
```bash
# Make sure your app is running
npm run dev

# In another terminal
node scripts/test-grading.js <session-id>
```

### Option 2: Manual API Call
```bash
curl -X POST http://localhost:3000/api/grade/session \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"your-session-id-here"}'
```

### Option 3: Through UI
1. Complete a training session
2. Navigate to the analytics page
3. Grading happens automatically
4. Hover over rep lines to see feedback

---

## Prompt Engineering

The grading prompt is in `app/api/grade/session/route.ts` line ~118.

To adjust grading criteria:
1. Edit the `prompt` variable
2. No other code changes needed!
3. Test with a sample session

Example adjustments:
- Make scoring more lenient: "Be encouraging but fair"
- Focus on specific skills: "Pay special attention to objection handling"
- Adjust alternative phrases: "Suggest phrases that match a friendly, consultative tone"

---

## Cost Analysis

**Model:** gpt-4o-mini  
**Average tokens per session:** ~2,000-4,000 tokens  
**Pricing:** $0.150 per 1M input tokens, $0.600 per 1M output tokens

**Cost per session:**
- Input: ~2,000 tokens × $0.15 / 1M = $0.0003
- Output: ~1,500 tokens × $0.60 / 1M = $0.0009
- **Total: ~$0.001-0.002 per session**

For 1,000 sessions/month: **~$1-2/month** 💰

---

## Rollback Plan

If you need to revert:
1. Restore old file: `cp archive/conversationAnalyzer.ts lib/trainer/conversationAnalyzer.ts`
2. Revert git: `git checkout HEAD~1 app/api/grade/session/route.ts`
3. Reinstall dependencies: `npm install`

---

## Next Steps (Optional Enhancements)

1. **Fine-tune prompts** based on real results
2. **Add more context** to AI (homeowner persona, scenario type)
3. **Store AI reasoning** for pattern analysis
4. **A/B test** different grading approaches
5. **User feedback** - let reps rate the feedback quality

---

## Files Modified

✅ `app/api/grade/session/route.ts` - Rewritten to use OpenAI  
✅ `components/analytics/TranscriptView.tsx` - Enhanced hover tooltips  
✅ `components/ConversationAnalysis.tsx` - Deprecated, use session analytics instead  
🗄️ `lib/trainer/conversationAnalyzer.ts` - Archived  
🗑️ `app/api/grade/conversation/route.ts` - Deleted  
📝 `scripts/test-grading.js` - New test utility

---

## Support

Questions? Check:
- `app/api/grade/session/route.ts` - Main grading logic
- `components/analytics/TranscriptView.tsx` - Frontend display
- OpenAI docs: https://platform.openai.com/docs/guides/structured-outputs

**Enjoy the simplified system! 🎉**
