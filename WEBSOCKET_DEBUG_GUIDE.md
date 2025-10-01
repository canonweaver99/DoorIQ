# WebSocket Connection Debug Guide

## Issues Fixed

### ✅ Issue 1: WebSocket Connection Not Working
**Problem**: When clicking "Tap to start", the WebSocket connection to ElevenLabs wasn't being established.

**Root Causes Identified**:
1. Limited error logging made it difficult to diagnose connection failures
2. No visual feedback about connection status
3. Missing error handling in the signed URL fetch process
4. No validation of agent_id or signed_url before attempting connection

**Solutions Implemented**:

1. **Enhanced Console Logging**:
   - Added comprehensive emoji-tagged console logs throughout the connection flow
   - Logs now track: Agent ID validation, signed URL fetching, microphone permissions, WebSocket status changes, message events, and errors
   - Error logs now include detailed error properties (message, code, type, stack)

2. **Connection Status Indicator**:
   - Added real-time connection status display in the UI header
   - Visual indicator shows: `Connected` (green), `Connecting...` (yellow), `Connection Error` (red), `Disconnected` (gray)
   - Animated ping effect on the status dot when active

3. **Improved Error Handling**:
   - Added try-catch blocks with detailed error logging
   - Validates agent_id and signed_url before attempting connection
   - Displays user-friendly error alerts when connection fails
   - Properly handles abort controller for signed URL requests

4. **Better Event Handling**:
   - Added `onDisconnect` callback to track disconnection events
   - Connection status events dispatched to parent component
   - Error events now update the UI connection status

### ✅ Issue 2: Orb Color Consistency
**Problem**: Orb colors on the agent selection page didn't match the training session page.

**Solution Implemented**:
Added complete color definitions for all 11 agents with consistent colors across both pages:

| Agent | Color | Hex Range |
|-------|-------|-----------|
| **Austin** | Emerald/Green | `#86efac` → `#15803d` |
| **Tiger Tom** | Orange | `#fdba74` → `#c2410c` |
| **Tiger Tony** | Amber/Gold | `#fcd34d` → `#b45309` |
| **Sheep Shelley** | Red | `#fca5a5` → `#b91c1c` |
| **Sheep Sam** | Violet/Purple | `#c4b5fd` → `#6d28d9` |
| **Sheep Sandy** | Purple | `#d8b4fe` → `#7e22ce` |
| **Bull Brad** | Blue | `#93c5fd` → `#1e40af` |
| **Bull Barry** | Gray | `#d1d5db` → `#374151` |
| **Bull Brenda** | Rose/Pink | `#fda4af` → `#be123c` |
| **Owl Olivia** | Violet/Purple | `#c4b5fd` → `#6d28d9` |
| **Owl Oscar** | Cyan/Teal | `#67e8f9` → `#0e7490` |

Each agent now has matching colors between:
- The animated bubble selector (selection page)
- The conversation orb (training session page)

## How to Debug WebSocket Connection Issues

### Step 1: Check Browser Console
Open your browser's Developer Tools (F12) and look for these logs:

#### Successful Connection Flow:
```
🎬 Starting training session...
Selected agent: Austin agent_7001k5jqfjmtejvs77jvhjf254tz
🔐 Requesting signed URL for agent: agent_7001k5jqfjmtejvs77jvhjf254tz
📡 Signed URL API response status: 200 OK
✅ Signed URL payload received: { hasSigned: true, expires_at: '...' }
📝 Creating session record...
✅ Session started successfully
🎤 ElevenLabs WebSocket Initialization
Agent ID: agent_7001k5jqfjmtejvs77jvhjf254tz
Signed URL present: true
⏱️ Auto-starting conversation in 100ms...
🚀 Starting ElevenLabs conversation...
🎙️ Requesting microphone permission...
✅ Microphone permission granted
🔌 Connecting to ElevenLabs with Agent ID: agent_7001k5jqfjmtejvs77jvhjf254tz
📊 Status changed: connecting
📊 Status changed: connected
✅ ElevenLabs conversation started successfully
```

#### If Connection Fails - Look for:
1. **Missing Agent ID**:
   ```
   ❌ Missing Agent ID - cannot initialize conversation
   ```
   **Fix**: Ensure you've selected an agent before clicking "Start"

2. **Missing Signed URL**:
   ```
   ❌ Missing ElevenLabs signed URL - cannot initialize conversation
   ```
   **Fix**: Check the signed URL API endpoint is working

3. **API Errors**:
   ```
   ❌ Signed URL API error: { error: "..." }
   ```
   **Fix**: Check your `ELEVEN_LABS_API_KEY` environment variable

4. **Microphone Permission Denied**:
   ```
   ❌ Microphone permission denied: NotAllowedError
   ```
   **Fix**: Grant microphone permission in your browser settings

5. **WebSocket Connection Error**:
   ```
   ❌ ElevenLabs WebSocket error: { message: "...", code: "..." }
   ```
   **Fix**: Check network connectivity and ElevenLabs API status

### Step 2: Check Visual Connection Status
Look at the header of the training session page:
- **Green dot + "Connected"**: WebSocket is active and working
- **Yellow dot + "Connecting..."**: Connection is in progress (should transition to connected)
- **Red dot + "Connection Error"**: Connection failed - check console for details
- **Gray dot + "Disconnected"**: Not connected (normal when session isn't active)

### Step 3: Verify Environment Variables
Ensure these are set in your `.env.local` file:

```bash
ELEVEN_LABS_API_KEY=your_api_key_here
ELEVENLABS_BASE_URL=https://api.elevenlabs.io  # (optional, defaults to this)
```

### Step 4: Check Network Tab
In Developer Tools → Network tab:
1. Look for a POST request to `/api/eleven/signed-url`
   - Should return `200 OK` with `{ signed_url: "...", expires_at: "..." }`
   - If it fails, check the response for error messages

2. Look for a WebSocket connection to `api.elevenlabs.io`
   - Should show status `101 Switching Protocols`
   - If it shows errors, check CORS and API key

### Step 5: Common Issues & Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| **No agent selected** | Nothing happens when clicking "Tap to start" | Select an agent from the dropdown first |
| **Invalid API key** | 401/403 error in console | Check `ELEVEN_LABS_API_KEY` in `.env.local` |
| **Agent ID mismatch** | Connection fails with agent_id error | Verify agent exists in ElevenLabs dashboard |
| **Expired signed URL** | Connection fails after working previously | Signed URLs expire - refresh the page and try again |
| **Browser blocking mic** | Microphone permission error | Allow microphone access in browser settings |
| **Network firewall** | WebSocket connection timeout | Check firewall/VPN settings blocking WSS connections |

## Testing the Fixes

### Test Connection Flow:
1. Navigate to the trainer page
2. Select an agent (e.g., "Austin")
3. Open browser console (F12)
4. Click "Tap to start"
5. Watch the console logs - you should see the success flow above
6. Verify the connection status indicator turns green
7. Speak into your microphone and verify transcript appears

### Test Orb Colors:
1. Go to the agent selection page
2. Note the color of each agent's bubble
3. Click on an agent to start a session
4. Verify the orb on the training page matches the bubble color
5. Try with different agents to confirm all colors match

## Additional Improvements Made

1. **Better Loading States**: 
   - Loading state is set to `false` after session starts, preventing UI freezing
   - Clear visual feedback during connection process

2. **Error Recovery**:
   - Connection failures properly reset the session state
   - Users can retry without refreshing the page

3. **Abort Controller**:
   - Signed URL requests can be cancelled if user navigates away
   - Prevents memory leaks and stale requests

4. **Type Safety**:
   - All error objects include proper type checking before accessing properties
   - Prevents "Cannot read property of undefined" errors

## What to Check If Issues Persist

1. **ElevenLabs API Status**: Visit [ElevenLabs Status Page](https://status.elevenlabs.io)
2. **Browser Compatibility**: Ensure you're using a modern browser (Chrome, Edge, Firefox, Safari)
3. **HTTPS Required**: WebSocket connections require HTTPS in production
4. **Agent Configuration**: Verify the agent exists and is active in your ElevenLabs account
5. **Supabase Connection**: Ensure database connection is working (for session recording)

## Next Steps

If connection still fails after these fixes:
1. Share the complete console log output (from clicking "Tap to start" until the error)
2. Check the Network tab for the exact error response
3. Verify your ElevenLabs API key has the correct permissions
4. Test with a different agent to rule out agent-specific issues

---

**Last Updated**: October 1, 2025
**Changes**: Added comprehensive logging, connection status indicator, and complete orb color mapping

