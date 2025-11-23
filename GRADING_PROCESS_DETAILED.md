# Complete Grading Process Documentation
## Start to Finish - Every Last Detail

This document describes the complete grading flow from when a session ends to when results are displayed to the user.

---

## Table of Contents
1. [Session End Trigger](#1-session-end-trigger)
2. [Session Finalization](#2-session-finalization)
3. [Grading Initiation](#3-grading-initiation)
4. [Grading Execution](#4-grading-execution)
5. [Database Updates](#5-database-updates)
6. [Status Polling](#6-status-polling)
7. [Results Display](#7-results-display)
8. [Line-by-Line Grading (Background)](#8-line-by-line-grading-background)
9. [Error Handling](#9-error-handling)

---

## 1. Session End Trigger

### 1.1 User Actions That End Session
- **Manual End**: User clicks "End Session" button
- **Agent Disconnect**: ElevenLabs agent disconnects (timeout, error, or conversation complete)
- **Door Closing Sequence**: Automatic sequence triggered by agent disconnect

### 1.2 Code Location
- **File**: `app/trainer/page.tsx`
- **Function**: `handleDoorClosingSequence()` (line ~1029)
- **Trigger Points**:
  - `handleCallEnd()` callback (line ~1242)
  - Agent disconnect event listener (line ~1252)
  - Manual end button click (line ~1721)

### 1.3 Door Closing Sequence Flow
```
1. handleDoorClosingSequence() called with reason
2. Check if agent has video animations
3. If yes:
   a. Wait for loop video to reach beginning (if in loop mode)
   b. Switch to closing door video
   c. Wait for closing video to finish playing (max 10s timeout)
4. Capture current transcript state (before state changes)
5. Call endSession() with skipRedirect=true
6. After endSession completes, call triggerGradingAfterDoorClose()
```

### 1.4 Key State Management
- `sessionActive`: Set to false AFTER endSession completes
- `sessionState`: Tracks 'door-closing' state
- `transcript`: Captured BEFORE session becomes inactive
- `sessionId`: Must exist to proceed

---

## 2. Session Finalization

### 2.1 endSession() Function
- **File**: `app/trainer/page.tsx`
- **Line**: ~829
- **Parameters**:
  - `endReason`: Why session ended (optional)
  - `skipRedirect`: If true, don't redirect (used for auto-grading)

### 2.2 Session Save Process

#### Step 1: State Cleanup
```javascript
- Set loading = true
- Set sessionActive = false
- Clear conversationToken
- Reset videoMode (unless showing closing animation)
- Clear intervals (duration, signedUrl)
- Stop recording (if active)
```

#### Step 2: Gather Voice Analysis Data
```javascript
- Call getVoiceAnalysisData() hook
- Extract metrics:
  * avgWPM (words per minute)
  * totalFillerWords
  * avgPitch
  * avgVolume
  * speakingRate
  * pauseFrequency
```

#### Step 3: Prepare Session Data
```javascript
Data sent to /api/session (PATCH):
{
  id: sessionId,
  transcript: full_transcript array,
  duration_seconds: total duration,
  end_reason: reason for ending,
  agent_name: selected agent name,
  voice_analysis: voice analysis object
}
```

#### Step 4: API Call to Save Session
- **Endpoint**: `PATCH /api/session`
- **File**: `app/api/session/route.ts` (line ~51)
- **Process**:
  1. Fetch current session from database
  2. Merge transcript (incremental saves may have occurred)
  3. Build analytics object with voice_analysis
  4. Update database:
     - `ended_at`: Current timestamp
     - `duration_seconds`: Total duration
     - `full_transcript`: Complete transcript array
     - `analytics.voice_analysis`: Voice metrics
     - `end_reason`: Why session ended

#### Step 5: Transcript Saving Strategy
- **Incremental Saves**: During session, transcript is saved incrementally via `/api/session/transcript`
- **Final Save**: On endSession, full transcript is sent as backup/verification
- **Database Field**: `live_sessions.full_transcript` (JSONB array)

### 2.3 Voice Analysis Preservation
- Voice analysis is stored in `analytics.voice_analysis` JSONB field
- CRITICAL: Must be preserved during grading updates
- Structure:
```json
{
  "avgWPM": number,
  "totalFillerWords": number,
  "avgPitch": number,
  "avgVolume": number,
  "speakingRate": number,
  "pauseFrequency": number
}
```

---

## 3. Grading Initiation

### 3.1 Automatic Grading Trigger
- **Function**: `triggerGradingAfterDoorClose()` (line ~786)
- **Flow**:
  1. Wait 2 seconds for transcript to be saved
  2. Verify transcript exists via `/api/session?id={sessionId}`
  3. If no transcript, wait additional 2 seconds
  4. Fire grading request (fire and forget)
  5. Redirect to loading page

### 3.2 Grading Endpoints Available

#### Option 1: Streaming Grading (Preferred)
- **Endpoint**: `POST /api/grade/stream`
- **File**: `app/api/grade/stream/route.ts`
- **Response**: Server-Sent Events (SSE) stream
- **UI Component**: `StreamingGradingDisplay` component

#### Option 2: Non-Streaming Grading (Fallback)
- **Endpoint**: `POST /api/grade/session`
- **File**: `app/api/grade/session/route.ts`
- **Response**: JSON response after completion
- **Used When**: Streaming fails or times out

### 3.3 Loading Page
- **Route**: `/trainer/loading/[sessionId]`
- **File**: `app/trainer/loading/[sessionId]/page.tsx`
- **Behavior**:
  - Shows streaming grading display by default
  - Falls back to polling if streaming unavailable
  - Polls `/api/session` every 2-3 seconds for completion

### 3.4 Analytics Page Fallback
- **Route**: `/analytics/[sessionId]`
- **File**: `app/analytics/[sessionId]/page.tsx`
- **Behavior**:
  - If no grading found, triggers grading automatically
  - Polls every 3 seconds (up to 2 minutes)
  - Displays results when `overall_score` exists

---

## 4. Grading Execution

### 4.1 Streaming Grading Flow (`/api/grade/stream`)

#### Step 1: Initial Setup
```javascript
1. Validate sessionId exists
2. Check OpenAI API key configured
3. Create Supabase client
4. Fetch session from database
```

#### Step 2: Wait for Data Availability
```javascript
- If session ended < 3 seconds ago:
  * Wait up to 2 seconds for voice_analysis to be saved
- Fetch fresh analytics to ensure voice_analysis exists
- Merge voice_analysis into session data if missing
```

#### Step 3: Transcript Validation
```javascript
- Check transcript exists and is array
- If missing, wait up to 5 seconds (if recently ended)
- Re-fetch session to get transcript
- If still missing, return 400 error
```

#### Step 4: Transcript Sampling (Performance Optimization)
```javascript
If transcript > 300 lines:
  - If > 800 lines: Sample first 100, middle 100, last 100
  - If 300-800 lines: Sample first 150, middle 150, last 150
Else:
  - Use full transcript
```

#### Step 5: Pre-compute Objective Metrics
```javascript
Before LLM call, calculate:
- Filler words count (um, uh, uhh, erm, err, hmm)
- Words per minute (WPM)
- Question ratio (% of statements that are questions)
```

#### Step 6: Format Transcript for OpenAI
```javascript
Format each line:
"[index] (timestamp) Speaker: text"

Example:
"[0] (0:15) You: Hi, I'm here about pest control"
"[1] (0:20) Homeowner: Oh, I already have service"
```

#### Step 7: Build OpenAI Prompt
```javascript
System Prompt includes:
- Role: "expert door-to-door sales coach"
- Company context (if team config exists)
- Pre-computed metrics (filler words, WPM, question ratio)
- JSON schema requirements
- Scoring guidelines (0-100 scale)
- Earnings calculation rules
```

#### Step 8: Create Streaming Response
```javascript
1. Create ReadableStream
2. Send initial status: "Starting AI analysis..."
3. Start heartbeat (every 15 seconds)
4. Call OpenAI API with stream: true
5. Process chunks as they arrive:
   - Extract completed sections
   - Send section updates via SSE
   - Accumulate full response
6. Parse final JSON
7. Save to database
8. Send completion event
```

#### Step 9: Section Extraction
```javascript
As JSON streams in, extract completed sections:
- session_summary
- scores
- feedback
- objection_analysis
- coaching_plan
- timeline_key_moments
```

Each completed section is sent immediately via SSE.

### 4.2 Non-Streaming Grading Flow (`/api/grade/session`)

#### Similar Steps, But:
- Single OpenAI API call (no streaming)
- Wait for complete response
- Return JSON after completion
- No incremental updates

#### Retry Logic:
- Max 3 attempts
- Exponential backoff (2s, 4s)
- Handles rate limits, timeouts, server errors

---

## 5. Database Updates

### 5.1 Grading Results Structure

#### Scores (stored in columns AND analytics)
```javascript
{
  overall_score: number (0-100),
  rapport_score: number,
  discovery_score: number,
  objection_handling_score: number,
  close_score: number,
  safety_score: number,
  speaking_pace_score: number,
  question_ratio_score: number,
  active_listening_score: number,
  assumptive_language_score: number,
  filler_words_score: number (count, not score)
}
```

#### Analytics JSONB Object
```javascript
{
  // Preserved from session end:
  voice_analysis: { ... },
  
  // Added by grading:
  scores: { overall, rapport, discovery, ... },
  feedback: {
    strengths: string[],
    improvements: string[],
    specific_tips: string[]
  },
  objection_analysis: {
    total_objections: number,
    objections: [...]
  },
  coaching_plan: {
    immediate_fixes: [...],
    skill_development: [...],
    role_play_scenarios: [...]
  },
  timeline_key_moments: [...],
  enhanced_metrics: {
    filler_words: { total_count, per_minute, common_fillers }
  },
  conversation_dynamics: {...},
  failure_analysis: {...},
  earnings_data: {...},
  deal_details: {...},
  graded_at: ISO timestamp,
  grading_version: "9.0-optimized"
}
```

### 5.2 Update Process

#### Step 1: Extract Scores
```javascript
- Extract numeric scores from grading result
- Handle null/undefined values
- Calculate overall score if not provided
```

#### Step 2: Calculate Overall Score
```javascript
If OpenAI provided overall score:
  - Use it directly
Else:
  - Average of: rapport, discovery, objection, closing, safety,
    speaking_pace, active_listening, assumptive_language
  - Apply penalties:
    * Missing critical categories: -10% per category
    * Filler words: -1% per 2 filler words (max -10%)
```

#### Step 3: Preserve Voice Analysis
```javascript
CRITICAL: Voice analysis must be preserved
1. Extract existing analytics
2. Extract voice_analysis from existing analytics
3. Build new analytics object
4. Add voice_analysis LAST (ensures it's not overwritten)
5. Verify voice_analysis exists in final object
```

#### Step 4: Database Update
```javascript
Update live_sessions:
- Set all score columns
- Set sale_closed, return_appointment, virtual_earnings
- Update analytics JSONB (merge, preserve voice_analysis)
- Set graded_at timestamp
```

### 5.3 Update Query Structure
```sql
UPDATE live_sessions
SET 
  overall_score = ?,
  rapport_score = ?,
  discovery_score = ?,
  -- ... all other scores
  sale_closed = ?,
  return_appointment = ?,
  virtual_earnings = ?,
  analytics = ? -- JSONB with all analytics
WHERE id = ?
```

---

## 6. Status Polling

### 6.1 Loading Page Polling
- **Interval**: Every 2 seconds
- **Endpoint**: `GET /api/session?id={sessionId}`
- **Check**: `overall_score` OR `analytics.scores.overall` exists
- **Timeout**: None (but shows skip button after 5 minutes)

### 6.2 Analytics Page Polling
- **Interval**: Every 3 seconds
- **Endpoint**: `GET /api/session?id={sessionId}`
- **Check**: Same as loading page
- **Timeout**: 40 attempts (2 minutes)

### 6.3 Grading Status Endpoint
- **Endpoint**: `GET /api/grading/status?sessionId={sessionId}`
- **File**: `app/api/grading/status/route.ts`
- **Returns**:
```json
{
  sessionId: string,
  graded: boolean,
  lineRatingsStatus: "not_started" | "queued" | "processing" | "completed" | "failed",
  lineRatingsCount: number,
  totalBatches: number,
  completedBatches: number,
  progress: number (0-100),
  isComplete: boolean
}
```

**NOTE**: This endpoint currently has a bug - it's missing a closing brace in the return statement (line 60), causing 500 errors.

---

## 7. Results Display

### 7.1 Analytics Page Components

#### Main Components:
- **ScoresView**: Displays all scores
- **TranscriptViewV2**: Shows transcript with line ratings
- **FeedbackDisplay**: Shows strengths, improvements, tips
- **ObjectionAnalysis**: Shows objection handling
- **CoachingPlan**: Shows personalized coaching

#### Data Flow:
```
1. Fetch session via /api/session?id={sessionId}
2. Extract:
   - overall_score (from column)
   - analytics.scores (from JSONB)
   - analytics.feedback
   - analytics.objection_analysis
   - analytics.coaching_plan
   - analytics.line_ratings
   - full_transcript
3. Render components with data
```

### 7.2 Score Calculation Display
- Overall score shown prominently
- Individual category scores shown in grid
- Color coding: Green (80+), Yellow (60-79), Red (<60)

---

## 8. Line-by-Line Grading (Background)

### 8.1 Purpose
- Provides detailed ratings for each transcript line
- Runs in background after main grading completes
- Optional enhancement (not required for core functionality)

### 8.2 Queue System

#### Supabase Queue (Current Implementation)
- **File**: `lib/queue/supabase-queue.ts`
- **Table**: `grading_jobs` (created by migration 082)
- **Process**:
  1. Split transcript into batches (5 lines per batch)
  2. Create job record for each batch
  3. Worker processes jobs sequentially
  4. Update `analytics.line_ratings` as batches complete

#### BullMQ Queue (Alternative - Not Currently Active)
- **File**: `lib/queue/grading-queue.ts`
- **Requires**: Redis connection
- **Status**: Code exists but not actively used

### 8.3 Line Rating Job Flow

#### Step 1: Queue Jobs
```javascript
- Split transcript into batches of 5 lines
- Create job for each batch
- Store in grading_jobs table
- Update session: line_ratings_status = 'queued'
```

#### Step 2: Worker Processing
- **Endpoint**: `POST /api/grading/process`
- **File**: `app/api/grading/process/route.ts`
- **Function**: `processNextJob()` from `lib/queue/supabase-worker.ts`
- **Process**:
  1. Fetch next pending job
  2. Call OpenAI for line ratings
  3. Update session analytics with ratings
  4. Mark job as completed
  5. Update completed_batches count

#### Step 3: Status Updates
```javascript
As batches complete:
- Update analytics.line_ratings_completed_batches
- When all batches done:
  - Set line_ratings_status = 'completed'
  - Set grading_status = 'completed' (via trigger)
```

### 8.4 Database Trigger
- **File**: `lib/supabase/migrations/081_add_grading_status.sql`
- **Function**: `update_grading_status()`
- **Trigger**: `trigger_update_grading_status`
- **Behavior**: Auto-updates `grading_status` column based on `line_ratings_status`

---

## 9. Error Handling

### 9.1 Transcript Missing
- **Detection**: Check transcript exists before grading
- **Wait**: Up to 5 seconds if session recently ended
- **Error**: Return 400 if still missing
- **User Message**: "No transcript to grade"

### 9.2 OpenAI API Errors

#### Rate Limit (429)
- **Retry**: Yes, with exponential backoff
- **Max Attempts**: 3
- **User Message**: "OpenAI rate limit exceeded"

#### Timeout
- **Detection**: 30 second timeout
- **Retry**: Yes
- **User Message**: "Request timed out"

#### Server Error (500+)
- **Retry**: Yes
- **User Message**: "OpenAI service temporarily unavailable"

### 9.3 Database Errors

#### Session Not Found
- **Error Code**: PGRST116
- **Response**: 404
- **User Message**: "Session not found"

#### Update Failure
- **Log**: Full error details
- **Response**: 500
- **User Message**: "Failed to save grading results"

### 9.4 Streaming Errors

#### Connection Lost
- **Detection**: No data received for 10+ seconds
- **Retry**: Yes, up to 3 times
- **Fallback**: Switch to non-streaming grading

#### Parse Errors
- **Detection**: Invalid JSON in stream
- **Recovery**: Attempt to repair incomplete JSON
- **Fallback**: Extract completed sections only

### 9.5 Voice Analysis Loss Prevention
- **Critical**: Voice analysis must be preserved
- **Strategy**:
  1. Extract before any updates
  2. Add to analytics object LAST
  3. Verify after update
  4. Log warnings if lost

---

## 10. Performance Optimizations

### 10.1 Transcript Sampling
- Long transcripts (>300 lines) are sampled
- Reduces token count and processing time
- Maintains key sections (beginning, middle, end)

### 10.2 Pre-computed Metrics
- Filler words, WPM, question ratio calculated before LLM call
- Reduces LLM computation time
- More accurate than LLM calculation

### 10.3 Parallel Database Queries
- User profile fetched with session (JOIN)
- Team config fetched separately (if needed)
- Reduces total query time

### 10.4 Streaming Updates
- User sees progress in real-time
- Reduces perceived wait time
- Better UX than waiting for complete response

---

## 11. Current Issues & Bugs

### 11.1 Grading Status Endpoint Bug
- **File**: `app/api/grading/status/route.ts`
- **Line**: 60
- **Issue**: Missing closing brace in return statement
- **Error**: 500 Internal Server Error
- **Fix Needed**: Add closing brace

### 11.2 Share Modal Error
- **File**: `share-modal.js` (likely in public folder)
- **Issue**: `addEventListener` called on null element
- **Error**: "Cannot read properties of null (reading 'addEventListener')"
- **Fix Needed**: Add null check before adding event listener

### 11.3 Voice Analysis Preservation
- **Risk**: Voice analysis can be lost during analytics merge
- **Mitigation**: Multiple checks and explicit preservation
- **Status**: Working but fragile

---

## 12. Data Flow Summary

```
Session End
    ↓
endSession() saves transcript + voice_analysis
    ↓
triggerGradingAfterDoorClose() waits 2-4 seconds
    ↓
POST /api/grade/stream (or /api/grade/session)
    ↓
Fetch session + transcript
    ↓
Wait for voice_analysis (if recently ended)
    ↓
Sample transcript (if >300 lines)
    ↓
Pre-compute metrics (filler words, WPM, etc.)
    ↓
Format transcript for OpenAI
    ↓
Call OpenAI API (streaming or non-streaming)
    ↓
Parse response JSON
    ↓
Extract scores + analytics
    ↓
Preserve voice_analysis
    ↓
Update database (scores + analytics)
    ↓
Queue line-by-line grading (background)
    ↓
Return response / stream completion
    ↓
Client polls for completion
    ↓
Display results on analytics page
```

---

## 13. Key Files Reference

### Frontend
- `app/trainer/page.tsx` - Session management, endSession()
- `app/trainer/loading/[sessionId]/page.tsx` - Loading page with polling
- `app/analytics/[sessionId]/page.tsx` - Results display
- `components/trainer/StreamingGradingDisplay.tsx` - Streaming UI

### Backend - Grading
- `app/api/grade/session/route.ts` - Non-streaming grading
- `app/api/grade/stream/route.ts` - Streaming grading
- `app/api/grading/status/route.ts` - Status endpoint (BUGGY)
- `app/api/grading/queue/route.ts` - Queue line ratings
- `app/api/grading/process/route.ts` - Process queued jobs

### Backend - Session Management
- `app/api/session/route.ts` - Session CRUD (PATCH saves session)
- `app/api/session/transcript/route.ts` - Incremental transcript saves

### Queue System
- `lib/queue/supabase-queue.ts` - Supabase queue helpers
- `lib/queue/supabase-worker.ts` - Worker processing logic
- `lib/queue/grading-queue.ts` - BullMQ queue (not active)

### Database
- `lib/supabase/migrations/081_add_grading_status.sql` - Grading status trigger
- `lib/supabase/migrations/082_create_grading_jobs_table.sql` - Jobs table

---

## End of Documentation

This document covers every step of the grading process from session end to results display. Use this as a reference when redesigning or debugging the grading system.

