# Grading Stream Fix

## Issue
The grading stream endpoint was returning 400 errors with "No transcript to grade" because the transcript wasn't saved yet when the stream endpoint was called.

## Root Cause
1. Session ends → transcript is saved via `/api/session` PATCH
2. Page immediately redirects to loading page
3. `StreamingGradingDisplay` only waits 500ms before calling `/api/grade/stream`
4. The stream endpoint only retried for 5 seconds (10 attempts)
5. Database save might not be immediately visible, causing the error

## Fixes Applied

### 1. Increased Retry Time in Stream Endpoint (`app/api/grade/stream/route.ts`)
- **Before**: 10 attempts × 500ms = 5 seconds max wait
- **After**: 30 attempts × 500ms = 15 seconds max wait
- Added better logging to track retry attempts
- Improved error messages with sessionId for debugging

### 2. Increased Initial Delay in Frontend (`components/trainer/StreamingGradingDisplay.tsx`)
- **Before**: 500ms delay before calling stream endpoint
- **After**: 2000ms (2 seconds) delay before calling stream endpoint
- This gives the database more time to save and replicate

## Result
The grading stream should now work reliably by:
1. Waiting 2 seconds on the frontend before calling the stream endpoint
2. The backend retrying up to 15 seconds if transcript isn't found
3. Better error messages if transcript still isn't found after all retries

## Testing
- Complete a conversation with an agent
- Verify session ends and redirects to loading page
- Confirm streaming grading starts successfully
- Check that grading completes and redirects to analytics page
