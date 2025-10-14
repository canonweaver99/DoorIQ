# Audio Playback Setup Guide

## Overview
The redesigned SessionTimeline component now includes interactive audio playback with pill-shaped markers and hover controls. Here's how to get audio URLs working for your sessions.

## Current Status ✅

### What's Already Working:
1. ✅ **SessionTimeline Component** - Redesigned with pill markers and playback controls
2. ✅ **Audio URL Support** - Component accepts `audioUrl` prop
3. ✅ **Database Schema** - `live_sessions.audio_url` column exists
4. ✅ **API Endpoint** - Returns all session data including `audio_url`
5. ✅ **Data Flow** - Props correctly passed from analytics page to ScoresViewV2 to SessionTimeline

### What Needs Audio:
The console shows "No audio URL available" because some sessions don't have their audio recorded/uploaded.

## How Audio URLs Are Created

There are **3 ways** audio gets attached to sessions:

### 1. **ElevenLabs Live Conversations** (Automatic)
When users practice with AI agents using ElevenLabs:

**Flow:**
```
1. User starts session → sessionId created
2. ElevenLabsConversation connects → startRecording() called
3. Browser MediaRecorder captures audio chunks
4. User ends session → stopRecording() called
5. Audio blob uploaded to Supabase Storage → 'audio-recordings' bucket
6. Session updated with audio_url, duration, and file size
```

**Key Files:**
- `hooks/useSessionRecording.ts` - Handles recording and upload
- `components/trainer/ElevenLabsConversation.tsx` - Triggers recording on connect/disconnect
- `app/trainer/page.tsx` - Creates session and passes sessionId

**Code Location:**
```typescript
// hooks/useSessionRecording.ts:108-122
const { error: updateError } = await supabase
  .from('live_sessions')
  .update({ 
    audio_url: publicUrl,
    audio_duration: Math.floor(blob.size / 16000),
    audio_file_size: blob.size
  })
  .eq('id', sessionId)
```

### 2. **Uploaded Audio Files** (Manual Upload)
Users can upload pre-recorded audio files:

**Flow:**
```
1. User selects audio file (mp3, wav, m4a)
2. File uploaded to Supabase Storage → 'audio-recordings' bucket
3. Signed URL generated
4. Audio transcribed via Whisper API
5. Session created with audio_url and transcript
```

**Key Files:**
- `app/trainer/upload/page.tsx` - Upload UI
- `app/api/upload/audio/route.ts` - Handles file upload
- `app/api/transcribe/route.ts` - Transcribes and creates session

**Code Location:**
```typescript
// app/api/transcribe/route.ts:60-74
const { data: session, error: sessionError } = await supabase
  .from('live_sessions')
  .insert({
    user_id: user.id,
    agent_name: 'Uploaded Recording',
    audio_url: fileUrl, // ← Audio URL saved here
    duration_seconds: Math.floor(transcription.duration || 0),
    full_transcript: formattedTranscript,
    upload_type: 'file_upload'
  })
```

### 3. **Real-Time API Sessions** (WebRTC - No Recording Yet)
When using OpenAI Realtime API, audio is streamed but not currently saved.

**Status:** ❌ Not implemented yet
**TODO:** Add recording to RT sessions if needed

## Troubleshooting: Why No Audio?

### Check 1: Verify Database
```sql
-- Check if session has audio_url
SELECT id, audio_url, audio_duration, upload_type 
FROM live_sessions 
WHERE id = 'your-session-id';
```

### Check 2: Check Storage Bucket
1. Go to Supabase Dashboard → Storage
2. Look for `audio-recordings` bucket
3. Verify files exist and are accessible

### Check 3: Check RLS Policies
```sql
-- Ensure users can read their own audio files
-- Check: lib/supabase/migrations/033_add_audio_support.sql
```

### Check 4: Browser Console
Look for these logs during session:
- ✅ `Starting audio recording for session: {id}`
- ✅ `Audio chunk received, size: ...`
- ✅ `Audio upload complete, URL: saved`
- ❌ `No sessionId, skipping audio upload` ← Problem!

## Setup Steps for New Sessions

### For ElevenLabs Sessions:

1. **Ensure sessionId is passed to ElevenLabsConversation:**
```typescript
// app/trainer/page.tsx
<ElevenLabsConversation 
  agentId={selectedAgent.agent_id}
  conversationToken={signedUrl}
  sessionId={sessionId}  // ← Must be set!
  autostart={true}
/>
```

2. **Verify audio recording permissions:**
```typescript
// Browser will prompt for microphone access
const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
```

3. **Check Supabase Storage setup:**
```bash
# Verify bucket exists
Bucket name: audio-recordings
Access: Private (authenticated users only)
RLS: Enabled
```

### For Uploaded Files:

1. **Navigate to:** `/trainer/upload`
2. **Upload audio file** (mp3, wav, m4a, webm)
3. **Wait for transcription** (uses OpenAI Whisper)
4. **Session auto-created** with audio_url

## Testing the Timeline

### With Audio:
1. Go to any session with `audio_url` set
2. Navigate to `/analytics/[sessionId]`
3. Scroll to "SESSION TIMELINE" section
4. **Hover over pill markers** → Playback card appears
5. **Click Play** → Audio plays from that segment
6. **Progress bar** shows real-time playback position

### Without Audio:
- Timeline still shows (with feedback and tips)
- Play buttons are visible but show "No audio URL available" in console
- Non-audio features still work (visual timeline, feedback cards)

## Storage Configuration

### Required Setup in Supabase:

1. **Create bucket:**
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-recordings', 'audio-recordings', false);
```

2. **RLS Policies:**
```sql
-- Allow authenticated users to upload
CREATE POLICY "Users can upload their own audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audio-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to read their own audio
CREATE POLICY "Users can read their own audio"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'audio-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## API Endpoints

### Get Session with Audio:
```bash
GET /api/session?id={sessionId}

Response:
{
  "id": "uuid",
  "audio_url": "https://...",
  "audio_duration": 286,
  "audio_file_size": 4582400,
  "full_transcript": [...],
  ...
}
```

### Upload Audio:
```bash
POST /api/upload/audio
Content-Type: multipart/form-data

Body: { file: File }

Response:
{
  "fileUrl": "https://...",
  "filename": "uuid.webm",
  "size": 4582400,
  "type": "audio/webm"
}
```

## Timeline Component Features

### Interactive Elements:
- ✨ **Pill Markers** - Gradient colors by phase type
- 🎵 **Hover Cards** - Preview segment with play button
- 📊 **Feedback** - What worked, improvements, pro tips
- 🎮 **Playback Controls** - Play/pause, skip, rewind
- 📈 **Progress Bar** - Real-time audio position
- 🌊 **Waveform** - Decorative audio visualization
- ⏱️ **Timestamps** - Accurate segment timing

### Keyboard Shortcuts (Global):
- `Space` - Play/Pause
- `←` - Rewind 10s
- `→` - Skip forward 10s

## Next Steps

To ensure ALL sessions have audio:

1. **Verify existing sessions:**
```sql
SELECT 
  COUNT(*) FILTER (WHERE audio_url IS NOT NULL) as with_audio,
  COUNT(*) FILTER (WHERE audio_url IS NULL) as without_audio
FROM live_sessions;
```

2. **For sessions without audio:**
   - They were created before audio recording was implemented
   - Users can re-record or upload audio separately
   - Timeline still works without audio (shows feedback only)

3. **Future enhancements:**
   - Add waveform visualization from actual audio data
   - Add speed controls (0.5x, 1x, 1.5x, 2x)
   - Add keyboard shortcuts for segment navigation
   - Add download audio button
   - Add share segment feature

## Summary

✅ **Timeline is ready** - Works with or without audio
✅ **Audio recording works** - For ElevenLabs sessions  
✅ **Audio upload works** - For pre-recorded files
✅ **API is ready** - Returns audio URLs when available
✅ **UI is beautiful** - Modern pill markers with hover cards

🎯 **To see it in action:** Start a new ElevenLabs training session or upload an audio file!

