# ElevenLabs Connection Debugging Guide

## Quick Test: Agent Comparison

### Step 1: Test with Test Agent
1. Go to `/eleven-labs-test`
2. Click **"Test Agent"** button
3. Click **"Start Conversation"**
4. Watch console logs

### Step 2: Test with Austin Agent
1. Click **"Austin Rodriguez"** button
2. Click **"Start Conversation"**
3. Watch console logs

## Interpreting Results

### ✅ If Test Agent Works but Austin Doesn't
**Problem:** Austin's agent configuration issue

**Fix in ElevenLabs Dashboard:**
1. Go to ElevenLabs Dashboard → Agents → Austin Rodriguez
2. Check **"First Message"** is configured
3. Verify **Voice** is assigned correctly
4. Ensure agent status is **"Active"**
5. Check **"Auto-start conversation"** setting

### ❌ If Both Agents Fail
**Problem:** Network/environment issue

**Debugging Steps:**

#### 1. Check Browser Console
- Open DevTools (F12)
- Look for WebRTC errors
- Check Network tab → Filter "WS" (WebSocket)
- Look for failed WebSocket connections

#### 2. Test Network Environment
- Try mobile hotspot (bypass corporate firewall)
- Try different WiFi network
- Try incognito mode (disables extensions)
- Check if WebRTC works in other apps (Google Meet, etc.)

#### 3. Check Browser Permissions
- Click "🔍 Check Mic Permission" button on test page
- Or run in console:
  ```javascript
  navigator.permissions.query({ name: 'microphone' })
    .then(result => console.log('Microphone permission:', result.state))
  ```

#### 4. Update SDK Version
```bash
npm install @elevenlabs/client@latest
```

#### 5. Minimal Connection Test
Try the simplest possible connection (add to console):
```javascript
import { Conversation } from '@elevenlabs/client'

const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
const conversation = await Conversation.startSession({
  conversationToken: 'YOUR_TOKEN_HERE',
  connectionType: 'webrtc',
  audioStream: stream,
})

console.log('Connection created:', conversation)
```

## What to Look For in Console

### ✅ Good Signs:
- `✅ Microphone granted` with track details
- `✅ WebRTC onConnect fired`
- `📨 Message received` with various types
- `🎙️ AGENT SPOKE:` messages appearing

### ❌ Bad Signs:
- `❌ Microphone denied`
- `❌ WebRTC Error` messages
- `⚠️ 15 seconds elapsed, still waiting for agent greeting` (no first_message)
- `🔌 WebRTC onDisconnect fired` with short duration (< 30s)

## Common Issues & Solutions

### Issue: "15 seconds elapsed, still waiting for agent greeting"
**Cause:** Agent has no `first_message` configured
**Fix:** Configure first message in ElevenLabs Dashboard

### Issue: "Connection dropped unexpectedly" after ~10 seconds
**Cause:** WebRTC connection failure
**Possible fixes:**
- Check network/firewall settings
- Try different network
- Check browser WebRTC support
- Verify token is valid

### Issue: "Microphone permission denied"
**Cause:** Browser blocking microphone access
**Fix:** 
- Grant microphone permission in browser settings
- Check site permissions
- Try incognito mode

### Issue: No messages received
**Cause:** Connection established but agent not speaking
**Check:**
- Agent has first_message configured
- Agent voice is assigned
- Agent is active
- Token is valid

## Network Debugging

### Check WebSocket Connections
1. Open DevTools → Network tab
2. Filter by "WS" (WebSocket)
3. Look for:
   - Failed connections (red)
   - Connection duration
   - Error messages

### Check WebRTC Stats
Add this to your component temporarily:
```typescript
// After connection established
setInterval(() => {
  if (conversationRef.current) {
    // Log WebRTC stats if available
    console.log('Connection state:', conversationRef.current)
  }
}, 5000)
```

## Last Resort: Use Signed URL Instead

If WebRTC keeps failing, try the signed URL approach:

1. Update token endpoint to use signed URL:
```typescript
// In app/api/eleven/conversation-token/route.ts
const response = await fetch(
  `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
  {
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY! }
  }
)
const { signed_url } = await response.json()
```

2. Use signed URL in connection:
```typescript
const conversation = await Conversation.startSession({
  signedUrl: signed_url,
  connectionType: 'webrtc',
  audioStream,
})
```

## Debugging Checklist

- [ ] Test with Test Agent ID
- [ ] Test with Austin Agent ID
- [ ] Check microphone permission
- [ ] Check browser console for errors
- [ ] Check Network tab for WebSocket connections
- [ ] Try different network (mobile hotspot)
- [ ] Try incognito mode
- [ ] Verify token is valid (check length, format)
- [ ] Check ElevenLabs Dashboard for agent configuration
- [ ] Update SDK version
- [ ] Try minimal connection test

## Expected Console Output (Success)

```
🚀 Starting ElevenLabs connection...
📋 Connection params: { agentId: '...', tokenLength: 150, ... }
🎤 Requesting microphone access...
✅ Microphone granted: { tracks: 1, audioTrack: '...', ... }
🔧 Creating conversation session...
✅ Conversation session created
✅ WebRTC onConnect fired
🎙️ Waiting for agent greeting...
📨 Message received: { type: 'conversation_initiation', ... }
📨 Message received: { type: 'conversation_updated', ... }
💬 Conversation update: { totalMessages: 1, ... }
🎙️ AGENT SPOKE: Hello! How can I help you today?
```

## Expected Console Output (Failure)

```
🚀 Starting ElevenLabs connection...
📋 Connection params: { agentId: '...', tokenLength: 150, ... }
🎤 Requesting microphone access...
✅ Microphone granted: { tracks: 1, ... }
🔧 Creating conversation session...
✅ Conversation session created
✅ WebRTC onConnect fired
🎙️ Waiting for agent greeting...
⚠️ 15 seconds elapsed, still waiting for agent greeting
This usually means the agent has no first_message configured
```



