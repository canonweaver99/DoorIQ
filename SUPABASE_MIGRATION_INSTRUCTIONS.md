# Supabase Migration Instructions

## 1. Update your `.env.local` file

Add these lines to your `.env.local` file:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://fzhtqmbaxznikmxdglyl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6aHRxbWJheHpuaWtteGRnbHlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NTk3NTksImV4cCI6MjA3NDEzNTc1OX0.8SeovFJWrpLo9qBgHFmyzK92OSp2HN8I_aZRPoF0JwY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6aHRxbWJheHpuaWtteGRnbHlsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODU1OTc1OSwiZXhwIjoyMDc0MTM1NzU5fQ.4puCepuAk9usP8jgVr6Cy2fNLjWILNKoQ3WoWArJSAA
```

## 2. Run the database migrations

Go to your Supabase dashboard:
1. Navigate to https://fzhtqmbaxznikmxdglyl.supabase.co
2. Go to the SQL Editor
3. Copy and paste the contents of `/supabase/migrations/001_initial_schema.sql`
4. Run the migration

## 3. What has been migrated:

### Database Tables:
- `attempts` - Stores practice session attempts
- `turns` - Stores conversation turns
- `scenarios` - Stores training scenarios
- `audio_recordings` - Stores audio file metadata

### API Routes Updated:
- `/api/sim/start` - Creates new attempts in Supabase
- `/api/sim/step` - Saves conversation turns to Supabase
- `/api/sim/end` - Saves evaluation to Supabase
- `/api/health` - Checks Supabase connection

### New Features:
- Audio recordings are now stored in Supabase Storage
- Row Level Security (RLS) policies for data protection
- Better scalability and real-time capabilities

## 4. Update Vercel Environment Variables

Add these to your Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 5. Next Steps for ElevenLabs Agent

To integrate the ElevenLabs conversational agent, you'll need:
1. ElevenLabs Agent ID
2. Update the voice synthesis to use the conversational agent
3. Implement websocket connection for real-time conversation

The infrastructure is now ready for the ElevenLabs agent integration!
