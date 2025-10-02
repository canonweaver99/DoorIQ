# Transcript System - File Map

## 📡 Transcript Capture (Live Session)

### 1. **ElevenLabs WebRTC Connection & Message Extraction**
**File:** `components/trainer/ElevenLabsConversation.tsx`
- **Lines 86-233:** Message extraction logic (onMessage callback)
- **What it does:**
  - Connects to ElevenLabs via WebRTC
  - Receives messages from the conversation
  - Extracts transcript text from 10+ different message formats
  - Dispatches custom events: `agent:user`, `agent:response`, `agent:delta`
- **Key formats handled:**
  - `conversation_updated` (WebRTC - most common)
  - `user_transcript`, `agent_transcript`
  - `agent_response`, `transcript.final`
  - `transcript.delta` (interim/partial text)
  - Multiple fallback extraction methods

### 2. **Main Trainer Page (Event Listeners & UI)**
**File:** `app/trainer/page.tsx`
- **Lines 389-406:** `pushFinal()` - Adds finalized transcript entries to state
- **Lines 385-387:** `setDelta()` - Sets interim/delta text
- **Lines 408-483:** Event listener setup
  - `agent:message` → Handles raw messages (legacy)
  - `agent:user` → User speech finalized
  - `agent:response` → Agent speech finalized
  - `agent:delta` → Interim text preview
  - `connection:status` → Connection state
- **Lines 1090-1162:** Live Transcript UI
  - Shows finalized transcript entries
  - Shows interim delta text (pulsing gray)
  - Auto-scrolls to bottom
- **Lines 648-691:** `createSessionRecord()` - Creates session via `/api/sessions`
- **Lines 693-754:** `endSession()` - Ends session via `/api/sessions/end`

### 3. **TypeScript Types**
**File:** `lib/trainer/types.ts`
```typescript
export interface TranscriptEntry {
  id: string
  speaker: string
  text: string
  timestamp: Date | string
}
```

---

## 💾 Transcript Storage & Grading

### 4. **Create Session API**
**File:** `app/api/sessions/route.ts`
- **Method:** POST
- **What it does:** Creates a new `live_sessions` record using service role (bypasses RLS)
- **Returns:** `{ id: string }` - the session ID

### 5. **End Session API**
**File:** `app/api/sessions/end/route.ts`
- **Method:** POST
- **Body:** `{ id, duration, transcript, analytics }`
- **What it does:**
  - Updates `live_sessions` with `ended_at`, `duration_seconds`, `full_transcript`, `analytics`
  - Automatically triggers grading if transcript exists
  - Uses service role (bypasses RLS)

### 6. **Grading API**
**File:** `app/api/grade/session/route.ts`
- **Method:** POST
- **Body:** `{ sessionId }`
- **What it does:**
  - Fetches session's `full_transcript` from database
  - Runs AI grading (OpenAI GPT-4o-mini)
  - Generates line-by-line ratings (excellent/good/poor)
  - Calculates scores (rapport, objection handling, safety, closing, etc.)
  - Saves results to `analytics.line_ratings`, `analytics.feedback`
- **Lines 68-92:** Line-level heuristic ratings
- **Lines 53-64:** OpenAI API call for AI feedback

### 7. **Grading Engine (Core Logic)**
**File:** `lib/grader.ts`
- **Lines 834-891:** `gradeSession()` - Main orchestrator
- **What it does:**
  - Computes objective metrics (question rate, filler words, etc.)
  - Detects objections and analyzes how they're handled
  - Pest control specific analysis
  - "Moment of death" detection
  - LLM-based rubric grading
  - Combines all scores into final grade packet

---

## 📊 Transcript Display & Analysis

### 8. **Analytics Page**
**File:** `app/trainer/analytics/[sessionId]/page.tsx`
- **Lines 67-85:** `fetchSessionData()` - Fetches session (with API fallback)
- **Lines 228-235:** Renders `TranscriptView` component
- **Lines 45-65:** Auto-triggers grading if transcript exists but no feedback yet

### 9. **Transcript View Component (With Highlights)**
**File:** `components/analytics/TranscriptView.tsx`
- **Lines 24-78:** `analyzeLineEffectiveness()` - Determines if line is excellent/good/poor
  - Checks AI ratings from `analytics.line_ratings` first
  - Falls back to heuristic analysis
- **Lines 80-107:** `getLineStyles()` - Color coding (green/yellow/red borders)
- **Lines 109-142:** `getHoverExplanation()` - Generates advice text for each line
- **Lines 169-257:** Renders transcript with:
  - Color-coded borders
  - Effectiveness badges (★ Excellent, ✓ Good, ⚠ Poor)
  - Hover tooltips with advice
  - Timestamps
- **Lines 260-276:** Legend (explains color coding)

### 10. **AI Coach Component**
**File:** `components/analytics/AICoach.tsx`
- Displays AI-generated coaching feedback
- Shows strengths, improvements, specific tips

### 11. **Conversation Analysis Component**
**File:** `components/ConversationAnalysis.tsx`
- **Lines 101-129:** "What Worked" / "What Failed" sections
- **Lines 85-98:** Detailed breakdown by category
- **Lines 99:** Sentiment timeline
- Displays grade card, metrics grid, comparison chart

---

## 🔧 Helper APIs & Utils

### 12. **Fetch Session API (Service-Backed)**
**File:** `app/api/sessions/[id]/route.ts`
- **Method:** GET
- **What it does:** Fetches session by ID using service role (bypasses RLS)
- Used by analytics page when client-side fetch fails

### 13. **Supabase Server Utils**
**File:** `lib/supabase/server.ts`
- **`createServerSupabaseClient()`** - User-scoped (respects RLS)
- **`createServiceSupabaseClient()`** - Service role (bypasses RLS) - NEW!

### 14. **ElevenLabs API Utils**
**File:** `api/elevenlabs.ts`
- **Lines 42-52:** `normalizeTranscriptFromEleven()` - Converts ElevenLabs format to simple transcript

---

## 🧪 Testing & Documentation

### 15. **End-to-End Test Script**
**File:** `scripts/test-grading-pipeline.ts`
- Creates synthetic transcript
- Runs grading
- Displays results
- **Run:** `npm run test:grading`

### 16. **Documentation Files**
- `TRANSCRIPT_FIX_SUMMARY.md` - How transcript extraction works
- `NEXT_STEPS.md` - Troubleshooting guide
- `scripts/README.md` - Test script docs
- `TRANSCRIPT_SETUP_GUIDE.md` - Original setup guide

---

## 📋 Data Flow Summary

```
┌─────────────────────────────────────────────────────────────┐
│ 1. LIVE SESSION                                             │
└─────────────────────────────────────────────────────────────┘

ElevenLabs WebRTC → components/trainer/ElevenLabsConversation.tsx
                    ↓ (extracts text from messages)
                    Dispatches: agent:user, agent:response, agent:delta
                    ↓
app/trainer/page.tsx (event listeners)
                    ↓ (calls pushFinal())
                    Updates local state: transcript[], deltaText
                    ↓ (renders)
                    Live Transcript UI (lines 1090-1162)

┌─────────────────────────────────────────────────────────────┐
│ 2. SESSION END                                              │
└─────────────────────────────────────────────────────────────┘

User clicks "End Session"
                    ↓
app/trainer/page.tsx → endSession()
                    ↓
POST /api/sessions/end
   - Saves full_transcript to Supabase
   - Triggers grading
                    ↓
POST /api/grade/session
   - Runs lib/grader.ts
   - Calls OpenAI for AI feedback
   - Saves analytics.line_ratings, analytics.feedback
                    ↓
User redirected to analytics page

┌─────────────────────────────────────────────────────────────┐
│ 3. VIEW ANALYTICS                                           │
└─────────────────────────────────────────────────────────────┘

app/trainer/analytics/[sessionId]/page.tsx
                    ↓
Fetches session (GET /api/sessions/[id] if RLS blocks)
                    ↓
Renders:
   - components/analytics/TranscriptView.tsx (color-coded lines + advice)
   - components/ConversationAnalysis.tsx (What Worked/Failed)
   - components/analytics/AICoach.tsx (AI tips)
```

---

## 🔍 Key Files for Debugging

If transcripts still aren't working, check these in order:

1. **`components/trainer/ElevenLabsConversation.tsx`** (lines 86-233)
   - Are messages being received?
   - Is text being extracted?
   - Look for console logs: "📨 Message received:", "👤 User said:", "🤖 Agent said:"

2. **`app/trainer/page.tsx`** (lines 408-483)
   - Are event listeners firing?
   - Is `pushFinal()` being called?
   - Look for console logs during conversation

3. **`app/api/sessions/end/route.ts`**
   - Is transcript being saved?
   - Check server logs when ending session

4. **Supabase `live_sessions` table**
   - Check `full_transcript` column after ending session
   - Should be an array of objects with `speaker`, `text`, `timestamp`

---

## 🚀 Quick Reference

| Action | File | Key Functions |
|--------|------|---------------|
| Extract transcript from ElevenLabs | `components/trainer/ElevenLabsConversation.tsx` | `extractTranscripts()` |
| Display live transcript | `app/trainer/page.tsx` | `pushFinal()`, `setDelta()` |
| Create session | `app/api/sessions/route.ts` | `POST /api/sessions` |
| End session & save | `app/api/sessions/end/route.ts` | `POST /api/sessions/end` |
| Grade transcript | `app/api/grade/session/route.ts` | `POST /api/grade/session` |
| Show graded transcript | `components/analytics/TranscriptView.tsx` | Line highlighting logic |
| View analytics | `app/trainer/analytics/[sessionId]/page.tsx` | Full analytics UI |

---

Total files involved: **15 core files** + 4 documentation files

All changes are now pushed to GitHub and ready to test!

