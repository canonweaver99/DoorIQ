# Next Steps: Transcript & Grading System

## 🎯 Current Status

### ✅ What's Working
- **Grading Pipeline**: Fully implemented with OpenAI GPT-4o-mini
  - Line-by-line analysis (`analytics.line_ratings`)
  - Overall scores (rapport, objection handling, closing, etc.)
  - AI feedback (strengths, improvements, specific tips)
- **Analytics UI**: Ready to display graded results
  - `TranscriptView` component with color-coded highlights
  - Hover explanations for each line
  - "What Worked / What Failed" sections
- **Message Extraction**: Comprehensive logic for all ElevenLabs formats
  - `conversation_updated` (WebRTC - most common)
  - `user_transcript`, `agent_transcript`
  - `agent_response`, `transcript.final`
  - Interim/delta transcripts for live preview
  - Multiple fallback methods

### ⚠️ What Needs Testing
- **Live Transcript Capture**: Messages from ElevenLabs may not be populating `full_transcript`

## 🧪 Step 1: Verify Grading Pipeline

**This proves the grading system works independently of transcript capture.**

### Run the test:

```bash
# Make sure dev server is running in another terminal
npm run dev

# In a new terminal, run the grading test
npm run test:grading
```

### Expected result:
```
📈 GRADING RESULTS
============================================================
🎯 Overall Scores:
   Overall Score:           85/100
   Rapport Score:           90/100
   ...

📝 Line-by-Line Ratings:
   🟢 Line 0: EXCELLENT
      "Hi there! My name is John from Pest Shield..."
      💡 Advanced sale with empathy, assumptive close...
```

### Success criteria:
- ✅ Test session created in Supabase
- ✅ Grading API returns scores and line ratings
- ✅ Analytics page URL shows color-coded transcript
- ✅ Hover over lines shows AI advice
- ✅ "What Worked / What Failed" sections populated

**If this works:** Grading is healthy; issue is transcript capture.  
**If this fails:** Check env vars (OPENAI_API_KEY, Supabase credentials).

---

## 🔍 Step 2: Debug Live Transcript Capture

**If grading test passes but live transcripts are empty, follow these steps:**

### A. Start a trainer session

1. Go to `/trainer`
2. Click the orb to start
3. **Open DevTools (F12) → Console tab**
4. Speak to the AI homeowner

### B. Look for these logs:

#### ✅ Good signs:
```
✅ WebRTC Connected!
📨 Message received: { type: "conversation_updated", ... }
👤 User said: [your speech]
🤖 Agent said: [agent response]
```

#### ❌ Problem signs:
```
ℹ️  Unhandled message type: some_new_format
```
This means ElevenLabs is sending a format we don't handle yet.

#### 🔍 Debug checklist:
1. **Check "📨 Message received:" logs**
   - Expand the JSON object
   - Look for text content in various fields
   - Share the structure if it's not being extracted

2. **Check "👤 User said:" logs**
   - Should appear after you speak
   - If missing, user transcript extraction failed

3. **Check "🤖 Agent said:" logs**
   - Should appear after agent responds
   - If missing, agent transcript extraction failed

4. **End the session and check Supabase**
   - Go to Supabase dashboard → `live_sessions` table
   - Find your session row
   - Check `full_transcript` column
   - Should be an array of objects with `speaker`, `text`, `timestamp`

### C. Common issues & fixes:

| Issue | Likely Cause | Fix |
|-------|-------------|-----|
| No "📨 Message received:" | WebRTC not connecting | Check agent ID, conversation token API |
| Messages received but no text extracted | New message format | Share the message JSON; I'll add support |
| "👤 User said:" appears but `full_transcript` empty | Event listener not firing | Check `handleUserEvent` in page.tsx |
| Duplicate transcript entries | Multiple event dispatches | Add deduplication logic |

---

## 🐛 Step 3: Common Fixes

### If transcripts are duplicated:

Add deduplication to `app/trainer/page.tsx`:

```typescript
const pushFinal = async (
  text: string,
  speaker: 'user' | 'homeowner' = 'homeowner',
) => {
  if (!text?.trim()) return

  // Deduplicate: check if last entry is identical
  if (transcript.length > 0) {
    const last = transcript[transcript.length - 1]
    if (last.text === text.trim() && last.speaker === speaker) {
      console.log('⚠️ Skipping duplicate transcript entry')
      return
    }
  }

  const entry: TranscriptEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    speaker,
    text: text.trim(),
    timestamp: new Date(),
  }
  setTranscript(prev => [...prev, entry])

  setTimeout(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, 100)
}
```

### If specific message types aren't handled:

1. Find the "ℹ️ Unhandled message type:" log
2. Copy the full message JSON from console
3. Share it with me to add support

Example:
```json
{
  "type": "new_format_name",
  "data": {
    "user": "text here"
  }
}
```

---

## 📊 Step 4: Verify End-to-End

Once transcript capture is working:

1. **Start a session** (`/trainer`)
2. **Have a conversation** (aim for 5+ exchanges)
3. **End the session**
4. **Wait for "Calculating Score" screen**
5. **You'll be redirected to analytics page**

### What you should see:

✅ **Transcript Tab:**
- Full conversation with color-coded lines
- Green = Excellent moves
- Yellow = Good moves  
- Red = Poor moves
- Hover over lines for specific advice

✅ **Performance Metrics Tab:**
- Overall score badge
- "What Worked" / "What Failed" sections
- Detailed category scores
- AI coach feedback

---

## 🚀 Quick Start Commands

```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: Test grading (proves system works)
npm run test:grading

# Then test live capture:
# 1. Go to localhost:3000/trainer
# 2. Open DevTools console
# 3. Start session and speak
# 4. Watch for transcript logs
# 5. End session
# 6. Check analytics page
```

---

## 📝 Files Modified

### Transcript extraction (comprehensive format support):
- `components/trainer/ElevenLabsConversation.tsx`
  - Lines 86-233: Message extraction logic
  - Handles 10+ different message formats
  - Added interim/delta support

### Event handling (live transcript updates):
- `app/trainer/page.tsx`
  - Lines 408-483: Event listener setup
  - Handles `agent:user`, `agent:response`, `agent:delta`
  - Saves to local state → Supabase on session end

### Test infrastructure:
- `scripts/test-grading-pipeline.ts` - End-to-end test
- `scripts/README.md` - Test documentation
- `package.json` - Added `test:grading` script

---

## 🆘 If You're Still Stuck

Share these with me:

1. **Console logs from a trainer session:**
   - All "📨 Message received:" entries
   - Any error messages (red text)
   - Screenshot of the console after speaking

2. **Supabase session data:**
   - Go to Supabase → `live_sessions` table
   - Find your test session
   - Copy the `full_transcript` and `analytics` columns

3. **Test grading output:**
   - Run `npm run test:grading`
   - Copy the entire terminal output

With these, I can pinpoint exactly what's failing and fix it.

---

## 💡 Pro Tips

- **Keep DevTools open** during sessions to catch issues live
- **Test with short phrases** first (easier to debug)
- **Check network tab** if connection issues (look for WebRTC or WS connections)
- **Restart dev server** after env var changes

---

## 🎯 Success Criteria

You'll know everything works when:

1. ✅ Test grading script completes successfully
2. ✅ Live transcripts appear in real-time during session
3. ✅ `full_transcript` is populated in Supabase after session
4. ✅ Analytics page shows color-coded transcript with advice
5. ✅ Scores and feedback are generated automatically

**Current estimate:** Grading is 100% ready. Transcript capture is 90% ready (needs live testing).

