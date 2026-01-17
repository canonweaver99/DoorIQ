# Angry Indian Agent Setup Guide

## Overview
A new "Angry Indian" agent has been created for content creator sessions. This agent uses the "FUNNY INDIAN" ElevenLabs voice and includes custom door videos. Sessions with this agent skip feedback questions and go straight to grading and analytics.

## What Was Created

### 1. Videos
- ✅ Copied videos from Downloads to `/public` folder:
  - `indian-door-open.mp4` (door opening)
  - `indian-loop.mp4` (idle loop)
  - `indian-closing-door.mp4` (door closing)

### 2. Database Migration
- ✅ Created migration: `lib/supabase/migrations/129_add_angry_indian_agent.sql`
- ⚠️ **ACTION REQUIRED**: Update the `eleven_agent_id` placeholder with the actual ElevenLabs agent ID

### 3. Code Updates
- ✅ Added video paths in `app/trainer/page.tsx` (`getAgentVideoPaths` function)
- ✅ Added "Angry Indian" to `agentHasVideos` function
- ✅ Modified `app/api/session/route.ts` to skip feedback for Angry Indian sessions
- ✅ Created new page route: `app/creator/angry-indian/page.tsx`

## Next Steps

### 1. Create ElevenLabs Agent
1. Go to [ElevenLabs Dashboard](https://elevenlabs.io/app/conversational-ai)
2. Create a new conversational AI agent
3. Name it "Angry Indian" (or similar)
4. Set the voice to "FUNNY INDIAN"
5. Copy the agent ID (format: `agent_xxxxxxxxxxxxx`)

### 2. Update Database
Run the migration and update the agent ID:

```sql
-- Run this in Supabase SQL Editor
-- First, update the agent ID:
UPDATE agents 
SET eleven_agent_id = 'YOUR_ACTUAL_AGENT_ID_HERE'
WHERE name = 'Angry Indian';

-- Verify it was created:
SELECT * FROM agents WHERE name = 'Angry Indian';
```

Or run the migration file and then update:
```bash
# The migration file is at:
# lib/supabase/migrations/129_add_angry_indian_agent.sql
```

### 3. Test the Page
Visit: `http://localhost:3000/creator/angry-indian`

This will:
- Pre-select the "Angry Indian" agent
- Start a session with door knock
- Skip feedback questions after session ends
- Go straight to grading and analytics

## Features

### Session Flow
1. User visits `/creator/angry-indian`
2. Page redirects to trainer with Angry Indian pre-selected
3. User knocks on door (door opening video plays)
4. Full session conversation
5. Door closes (door closing video plays)
6. **Feedback form is skipped** (user_feedback_submitted_at is set automatically)
7. Goes directly to grading/analytics page

### Video Integration
- Door opening: `/indian-door-open.mp4`
- Idle loop: `/indian-loop.mp4`
- Door closing: `/indian-closing-door.mp4`

## Link to Share
Once setup is complete, share this link with content creators:
```
https://yourdomain.com/creator/angry-indian
```

## Troubleshooting

### Agent Not Found
- Ensure migration has been run
- Verify agent is active: `SELECT * FROM agents WHERE name = 'Angry Indian';`
- Check that `eleven_agent_id` is set correctly

### Videos Not Playing
- Verify files exist in `/public` folder
- Check file names match exactly (case-sensitive)
- Ensure videos are valid MP4 files

### Feedback Still Showing
- Check that `user_feedback_submitted_at` is being set in session creation
- Verify agent name matches exactly: "Angry Indian" (case-sensitive)
- Check browser console for errors

## Notes
- The agent uses the same trainer components as regular sessions
- All analytics and grading features work normally
- Only difference is feedback form is skipped
- Session is still saved to database with full transcript and analytics

