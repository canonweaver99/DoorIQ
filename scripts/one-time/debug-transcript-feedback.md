# Debugging Live Session Transcript & Feedback Differences

## Quick Checks

### 1. **Browser Console Errors**
Open browser DevTools (F12) and check for:
- Red errors in Console tab
- Network tab for failed API calls
- React DevTools warnings

### 2. **Transcript Population**
Check if transcript is being populated:
- Open Console during a live session
- Look for logs like:
  - `📝 Adding user transcript entry:`
  - `📝 Adding agent transcript entry:`
  - `✅ User transcript added. Current transcript length:`

### 3. **Feedback Generation**
Check if feedback is being generated:
- Look for logs like:
  - `🔍 Analyzing new transcript entries:`
  - `➕ Adding feedback item:`
  - `📋 Total feedback items:`

### 4. **Network Issues**
Check Network tab for:
- `/api/session/transcript` calls (should be POST requests)
- Failed requests (red status codes)
- CORS errors

## Common Issues

### Issue 1: Transcript Not Populating
**Symptoms:** Empty transcript during live session

**Check:**
1. ElevenLabs events firing:
   ```javascript
   // In browser console during session:
   window.addEventListener('agent:user', (e) => console.log('User event:', e.detail))
   window.addEventListener('agent:response', (e) => console.log('Agent event:', e.detail))
   ```

2. Check `ElevenLabsConversation` component is mounted:
   - Should see `🎬 start() called` in console
   - Should see `✅ Connected to ElevenLabs` message

### Issue 2: Feedback Not Generating
**Symptoms:** Empty feedback feed during session

**Check:**
1. `useLiveSessionAnalysis` hook is running:
   - Should see `🔍 Analyzing new transcript entries:` logs
   - Should see `📊 Calculating metrics` logs

2. Transcript has content:
   - Check `transcript.length > 0` in React DevTools
   - Verify transcript entries have `speaker` and `text` fields

### Issue 3: Styling Differences
**Symptoms:** Components look different but data is there

**Check:**
1. CSS classes applying:
   - Inspect elements in DevTools
   - Compare class names between localhost and production
   - Check if Tailwind classes are being purged incorrectly

2. Font loading:
   - Check Network tab for font files
   - Verify `font-space` class is applying

## Debugging Steps

### Step 1: Clear Everything
```bash
# Clear build cache
rm -rf .next

# Clear browser cache
# Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

# Restart dev server
npm run dev
```

### Step 2: Check Environment Variables
Make sure `.env.local` has:
```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3002
NEXT_PUBLIC_APP_URL=http://localhost:3002
```

### Step 3: Compare Console Outputs
1. Start a session on **production** (Vercel)
2. Open Console and note all logs
3. Start a session on **localhost**
4. Compare the logs - what's different?

### Step 4: Check Component State
Use React DevTools:
1. Find `TrainerPageContent` component
2. Check `transcript` state - is it populated?
3. Check `feedbackItems` state - are items being added?
4. Compare with production

### Step 5: Network Comparison
1. Production: Check Network tab during session
2. Localhost: Check Network tab during session
3. Compare:
   - Which API calls are made?
   - Are there any failed requests?
   - Are response times different?

## Specific Component Checks

### LiveTranscript Component
- Check if `transcript` prop has data
- Verify `transcriptEndRef` is scrolling
- Check avatar images loading (if applicable)

### LiveFeedbackFeed Component
- Check if `feedbackItems` prop has data
- Verify `deduplicatedItems` is working
- Check if animations are running

## If Still Different

Describe the exact differences:
1. **What looks different?**
   - Styling (colors, spacing, fonts)?
   - Content (missing messages, different order)?
   - Functionality (not scrolling, not updating)?

2. **When does it happen?**
   - Immediately on page load?
   - After starting a session?
   - During conversation?

3. **Console errors?**
   - Copy any red error messages
   - Check Network tab for failed requests

