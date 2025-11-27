# Testing Guide: Auto End Feature

## Implementation Status ✅

The auto end feature has been fully implemented with:
- ✅ `clientTools.end_call` function configured
- ✅ `onAgentEndCall` callback prop wired up
- ✅ Backup event listener (`agent:end_call`) in place
- ✅ Double-firing prevention (`endCallTriggeredRef`)
- ✅ Proper cleanup on disconnect
- ✅ TypeScript compilation successful

## How to Test

### 1. Start a Training Session
- Navigate to `/trainer`
- Select an agent
- Start a session

### 2. Monitor Console Logs
Watch for these log messages when the AI agent calls `end_call`:

```
🚪 ========================================
🚪 end_call TOOL TRIGGERED BY AI AGENT!
🚪 Reason: [reason]
🚪 Session ID: [sessionId]
🚪 ========================================
```

Then you should see:
```
🚪 Calling onAgentEndCall callback with reason: [reason]
🚪 ========================================
🚪 handleAgentEndCall TRIGGERED!
🚪 Reason: [reason]
🚪 Session active: true
🚪 Session ID: [sessionId]
🚪 ========================================
🚪 Triggering door closing sequence with reason: [mapped reason]
```

### 3. Expected Behavior

When the AI agent calls `end_call`:
1. **Immediate**: `endCallTriggeredRef` is set to `true` (prevents double-firing)
2. **Immediate**: `agent:end_call` event is dispatched
3. **After 1.5s delay**: `onAgentEndCall` callback is called
4. **Result**: Door closing sequence should start
5. **Result**: Session should end gracefully

### 4. Test Scenarios

#### Scenario A: Normal End (Goodbye)
- AI says goodbye naturally
- Calls `end_call` with reason `'goodbye'`
- Should trigger door close with reason: "Conversation ended naturally"

#### Scenario B: Rejection
- Homeowner rejects the pitch
- AI calls `end_call` with reason `'rejection'`
- Should trigger door close with reason: "Homeowner rejected - door closed"

#### Scenario C: Sale Complete
- Sale is completed
- AI calls `end_call` with reason `'sale_complete'`
- Should trigger door close with reason: "Sale completed successfully"

#### Scenario D: Hostile Response
- Homeowner becomes hostile
- AI calls `end_call` with reason `'hostile'`
- Should trigger door close with reason: "Homeowner became hostile"

### 5. Verify No Double-Firing

If `end_call` is called multiple times:
- First call should process normally
- Subsequent calls should log: `⚠️ end_call already triggered, ignoring duplicate`
- Only one door closing sequence should occur

### 6. Verify Cleanup

After `end_call` is triggered:
- Health monitoring should skip checks (log: `🏥 Skipping health check - end_call already triggered`)
- On disconnect, should log: `🚪 end_call was already triggered - disconnect is expected, cleaning up`
- No reconnection attempts should occur

## Debugging

If the feature doesn't work:

1. **Check Console Logs**
   - Look for the `🚪 end_call TOOL TRIGGERED` message
   - If missing, the AI agent may not be calling the tool

2. **Check Agent Configuration**
   - Verify the ElevenLabs agent has `end_call` tool available
   - Check agent's system prompt includes instructions to use `end_call`

3. **Check Callback**
   - Verify `handleAgentEndCall` is being called (look for `🚪 handleAgentEndCall TRIGGERED!`)
   - If missing, check that `onAgentEndCall` prop is passed correctly

4. **Check Event Listener**
   - If callback doesn't fire, backup event listener should catch it
   - Look for: `🚪 agent:end_call EVENT received`

5. **Check Session State**
   - Verify `sessionActive` is `true` when `end_call` is triggered
   - Verify `sessionId` matches between event and current session

## Code Verification

Key files to check:
- `components/trainer/ElevenLabsConversation.tsx` - Lines 175-213 (clientTools)
- `app/trainer/page.tsx` - Lines 1284-1312 (handleAgentEndCall)
- `app/trainer/page.tsx` - Lines 1389-1420 (backup event listener)
- `app/trainer/page.tsx` - Line 1883 (component prop)

## Notes

- The `end_call` tool accepts a `reason` parameter (optional, defaults to 'goodbye')
- Valid reasons: `'rejection'`, `'sale_complete'`, `'goodbye'`, `'hostile'`
- The callback has a 1.5s delay to allow final audio to play
- Both callback and event listener are in place for redundancy

