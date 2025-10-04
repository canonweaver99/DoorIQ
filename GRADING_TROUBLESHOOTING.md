# Grading System Troubleshooting Guide 🔧

## Quick Diagnostics

If grading shows 0/100 or "No AI feedback available", follow these steps:

### Step 1: Check Your Dev Server Logs

Look at your terminal where `npm run dev` is running. You should see:

**Successful grading:**
```
🤖 Starting OpenAI grading... { transcriptLines: 25, repLines: 12 }
📤 Calling OpenAI API...
📥 OpenAI response received
🔍 Parsing OpenAI response...
✅ OpenAI grading successful: { overall: 75, ... }
💾 Saving grading results to database...
✅ Grading completed successfully for session: xyz
```

**If you see errors:**
```
❌ OpenAI grading failed: [error message]
❌ Failed to update session with grades: [error]
```

### Step 2: Check Environment Variables

```bash
# Make sure OpenAI API key is set
cat .env | grep OPENAI_API_KEY

# Should show:
# OPENAI_API_KEY="sk-..."
```

### Step 3: Check if Session Has Transcript

The grading system needs a transcript to work. Check if:
1. You completed a full conversation
2. The session has `full_transcript` data in the database

### Step 4: Browser Console

Open browser DevTools (F12) → Console tab and look for:
- Network errors (red)
- Failed API calls to `/api/grade/session`

### Step 5: Manual Test

```bash
# Test the grading API directly
node scripts/test-grading.js <your-session-id>

# Example:
node scripts/test-grading.js 89049738-c1f1-488b-94fb-333102?
```

---

## Common Issues & Solutions

### Issue 1: "No transcript available for grading"

**Cause:** Session has no transcript data

**Solution:**
- Complete a full conversation first
- Make sure the session isn't interrupted
- Check that `app/api/sessions/end/route.ts` is saving the transcript

### Issue 2: "OpenAI API key not configured"

**Cause:** Missing or invalid API key

**Solution:**
```bash
# Add to .env file
echo 'OPENAI_API_KEY="sk-your-key-here"' >> .env

# Restart dev server
npm run dev
```

### Issue 3: OpenAI API Error

**Cause:** Rate limit, invalid request, or API issue

**Solution:**
- Check OpenAI API status: https://status.openai.com/
- Check your API key usage: https://platform.openai.com/usage
- Look for specific error in server logs

### Issue 4: "Failed to save grading results"

**Cause:** Database schema mismatch or permission issue

**Solution:**
- Check Supabase connection
- Verify `live_sessions` table has required columns:
  - `overall_score`, `rapport_score`, `introduction_score`, etc.
  - `what_worked[]`, `what_failed[]`, `key_learnings[]`
  - `analytics` (JSONB)

### Issue 5: Grading Stuck at "Calculating..."

**Cause:** API call not completing

**Solution:**
1. Check browser Network tab for failed requests
2. Look for timeout errors in server logs
3. Try refreshing the page after 30 seconds

---

## Testing Checklist

✅ Dev server running (`npm run dev`)  
✅ `.env` has `OPENAI_API_KEY`  
✅ Session has completed conversation with transcript  
✅ Browser console shows no errors  
✅ Server logs show successful API calls  

---

## Force Re-grade a Session

If a session was graded before the new system:

```bash
# Option 1: Use test script
node scripts/test-grading.js <session-id>

# Option 2: API call
curl -X POST http://localhost:3000/api/grade/session \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"your-session-id"}'

# Option 3: UI
# Just refresh the analytics page - it auto-grades if no feedback exists
```

---

## Debug Mode

To see detailed logs, look at your **terminal** where `npm run dev` is running:

- 🤖 = OpenAI grading starting
- 📤 = API call being made  
- 📥 = Response received
- ✅ = Success
- ❌ = Error
- 💾 = Saving to database

---

## Still Not Working?

1. **Share your server logs** - Copy the terminal output
2. **Share browser console** - F12 → Console → screenshot errors
3. **Share session ID** - From the analytics page URL
4. **Check API response** - Network tab → look for `/api/grade/session` response

---

## Quick Fixes

```bash
# Restart everything
killall node
npm run dev

# Clear .next cache
rm -rf .next
npm run dev

# Verify OpenAI key works
node -e "console.log(process.env.OPENAI_API_KEY ? '✅ Key found' : '❌ No key')"
```

---

**Still stuck?** Check the logs and share the specific error message!
