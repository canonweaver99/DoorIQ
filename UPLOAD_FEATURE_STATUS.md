# Audio Upload Feature - Status & Issues

## Current Flow

1. **Upload Audio** (`/trainer/upload`)
   - User selects MP3/WAV/WEBM/MP4/MOV file (max 100MB)
   - File uploaded to Supabase Storage `audio-recordings` bucket
   - Returns signed URL for processing

2. **Transcribe** (`/api/transcribe`)
   - Downloads audio from signed URL
   - Transcribes using OpenAI Whisper
   - Creates formatted transcript with speaker labels
   - Creates session in database with transcript

3. **Grade** (`/api/grade/session`)
   - Grades the transcript using GPT-4
   - Saves scores and analytics to database

4. **Redirect** to `/analytics/[sessionId]`
   - Shows scores, feedback, and analytics

## Known Issues

### 1. **Auth Token Handling** ⚠️
**Problem:** Upload page tries to get auth token incorrectly
```typescript
// Current (lines 54-60):
headers: {
  'Authorization': `Bearer ${(await import('@/lib/supabase/client')).createClient().auth.getSession()}`
}
```

**Issue:** `auth.getSession()` returns a promise, not the token

**Fix Needed:**
```typescript
const supabase = createClient()
const { data: { session } } = await supabase.auth.getSession()
const token = session?.access_token

headers: {
  'Authorization': `Bearer ${token}`
}
```

### 2. **Speaker Diarization** ⚠️
**Problem:** Speaker detection is just alternating (line 104)
```typescript
speaker: index % 2 === 0 ? 'rep' : 'customer'
```

**Impact:** Inaccurate speaker labels mess up grading

**Solutions:**
- **Quick:** Use GPT-4 to identify speakers from transcript
- **Better:** Use Whisper speaker diarization
- **Best:** Use dedicated diarization model (PyAnnote)

### 3. **Transcription Missing audioUrl** ⚠️
**Problem:** `/api/transcribe` expects `audioUrl` but upload flow doesn't match

**Current Flow:**
```typescript
// Upload returns:
{ fileUrl, filename }

// But transcribe expects:
{ audioUrl, filename }
```

**Fix:** Update upload page to send `audioUrl` instead of `fileUrl`

### 4. **Session Creation Happens Twice** ⚠️
**Problem:** 
- `/api/transcribe` creates a session (line 60-74)
- Upload page also tries to create session (line 89-97)

**Impact:** Two sessions created, second one fails

**Fix:** Remove duplicate session creation from upload page

### 5. **No Progress Feedback** 💡
**Issue:** Long transcriptions (5+ min audio) have no progress updates

**Enhancement:** Add SSE or polling for transcription progress

## Proposed Fixes

### Priority 1: Critical Fixes

#### Fix 1: Auth Token
```typescript
// app/trainer/upload/page.tsx
const handleUpload = async () => {
  // ... existing code ...
  
  // Get auth token properly
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    setError('Please log in to upload files')
    return
  }

  const uploadResponse = await fetch('/api/upload/audio', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    },
    body: formData
  })
}
```

#### Fix 2: Match Parameter Names
```typescript
// app/trainer/upload/page.tsx (line 77)
const transcribeResponse = await fetch('/api/transcribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    audioUrl: audioUrl,  // Was: audioUrl
    filename: uploadData.filename  // Add filename
  })
})
```

#### Fix 3: Remove Duplicate Session Creation
```typescript
// app/trainer/upload/page.tsx
// Remove lines 89-104 (session creation)
// Transcribe API already creates the session

const transcribeData = await transcribeResponse.json()
const newSessionId = transcribeData.sessionId  // Get from transcribe response
```

### Priority 2: Speaker Diarization

#### Option A: GPT-4 Speaker Detection (Quick)
```typescript
// In formatTranscriptWithSpeakers:
const prompt = `
Identify speakers in this sales conversation transcript.
Label each sentence as either "rep" (sales rep) or "customer".

Transcript:
${fullText}

Return JSON array: [{ speaker: "rep"|"customer", text: "..." }]
`

const completion = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: prompt }],
  response_format: { type: 'json_object' }
})
```

#### Option B: Whisper Speaker Labels (Better)
Use Whisper's built-in speaker detection if available

### Priority 3: Progress Tracking

Add real-time progress updates for transcription

## Testing Checklist

- [ ] Upload 30-second MP3
- [ ] Upload 5-minute WAV
- [ ] Upload video with audio (MP4)
- [ ] Test with invalid file types
- [ ] Test with oversized files (>100MB)
- [ ] Verify speaker labels are accurate
- [ ] Check grading works on uploaded sessions
- [ ] Verify email notifications sent
- [ ] Test audio playback in analytics

## Quick Test Command

```bash
# Test with a sample MP3
curl -X POST http://localhost:3000/api/upload/audio \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-audio.mp3"
```

## Files to Modify

1. `app/trainer/upload/page.tsx` - Fix auth + remove duplicate session
2. `app/api/transcribe/route.ts` - Improve speaker diarization
3. `app/api/upload/audio/route.ts` - Already good!
4. `app/api/grade/session/route.ts` - Already working!

## Next Steps

1. Fix auth token issue
2. Remove duplicate session creation
3. Test complete flow
4. Improve speaker detection
5. Add progress tracking

