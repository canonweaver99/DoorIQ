# Live Transcript & Enhanced Feedback Setup Guide

This guide will help you set up the live transcript and color-coded feedback features in DoorIQ.

## 1. Database Setup

### Option A: Clean Install (Recommended)
If you're starting fresh or don't have existing data you need to keep:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run the optimized schema:
   ```sql
   -- Copy and paste the contents of lib/supabase/schema-optimized.sql
   ```

### Option B: Migrate Existing Database
If you have existing data:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run the migration:
   ```sql
   -- Copy and paste the contents of lib/supabase/migrations/001_optimize_schema.sql
   ```

## 2. Environment Variables

Add these to your Vercel project settings (Settings → Environment Variables):

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 3. ElevenLabs Configuration

The app uses ElevenLabs agent ID: `agent_7001k5jqfjmtejvs77jvhjf254tz`

### Make the Agent Public (Easiest)
1. Go to ElevenLabs Dashboard → Conversational AI → Agents
2. Find your Austin Rodriguez agent
3. Under "Security", set to "Public"
4. Save changes

### OR Use Domain Whitelisting
1. In the same security settings
2. Add your Vercel domains:
   - `your-app.vercel.app`
   - `localhost:3000` (for local development)
   - Your custom domain if you have one

## 4. Testing the Features

### Test Live Transcript:
1. Go to `/trainer`
2. Click "Start Training Session"
3. Click the Austin orb to start conversation
4. Speak - you should see your words appear in the left panel in real-time
5. Austin's responses should also appear as he speaks

### Test Enhanced Feedback:
1. Have a conversation with Austin
2. Click "End Session"
3. You'll be redirected to `/feedback`
4. You should see:
   - Color-coded transcript (green/yellow/red lines)
   - Section breakdown with scores
   - Click any line for specific feedback
   - Toggle between transcript and overview tabs

## 5. Features Overview

### Live Transcript Features:
- Real-time display of conversation
- Chat bubble style formatting
- Timestamps for each message
- Auto-scroll to latest message
- Prevents duplicate entries

### Enhanced Feedback Features:
- **Color Coding:**
  - Green (80-100): Excellent performance
  - Yellow (60-79): Good but could improve
  - Red (0-59): Needs improvement
  
- **Section Analysis:**
  - Introduction & Opening
  - Discovery & Needs Assessment
  - Objection Handling
  - Closing & Next Steps
  
- **Interactive Elements:**
  - Click any line for detailed feedback
  - Expand/collapse sections
  - View specific tips for improvement

### Conversation Status (During Session):
- Live sentiment tracking (positive/neutral/negative)
- Current conversation phase
- Duration timer
- Exchange counter

## 6. Troubleshooting

### Live Transcript Not Appearing:
1. Check browser console for errors
2. Ensure microphone permissions are granted
3. Verify ElevenLabs agent is accessible
4. Check that the agent ID matches

### Feedback Page Issues:
1. Ensure Supabase tables are created
2. Check that environment variables are set
3. Verify RLS policies allow anonymous access (for testing)

### Database Connection Issues:
1. Check Supabase URL and anon key
2. Ensure RLS is enabled but policies allow access
3. Check network tab for 401/403 errors

## 7. Database Schema Reference

### training_sessions table:
- `transcript`: Raw conversation data
- `analytics`: Analysis results from conversationAnalyzer
- `analyzed_transcript`: Line-by-line analysis (future enhancement)
- Various score fields for different aspects

### Key JSONB structures:
```javascript
// analytics field structure
{
  keyMoments: {
    priceDiscussed: boolean,
    safetyAddressed: boolean,
    closeAttempted: boolean,
    objectionHandled: boolean
  },
  transcriptSections: {
    introduction: { startIdx, endIdx },
    discovery: { startIdx, endIdx },
    presentation: { startIdx, endIdx },
    closing: { startIdx, endIdx }
  },
  feedback: {
    strengths: string[],
    improvements: string[],
    specificTips: string[]
  }
}

// transcript field structure
[
  {
    speaker: "user" | "austin",
    text: string,
    timestamp: Date,
    sentiment?: "positive" | "neutral" | "negative"
  }
]
```

## 8. Next Steps

Once everything is working:

1. **Customize Scoring Logic**: Edit `lib/trainer/conversationAnalyzer.ts` to adjust how conversations are scored
2. **Add More Tips**: Insert more coaching tips in the database for richer feedback
3. **Enhance Analysis**: Add more sophisticated NLP analysis for better feedback
4. **Track Progress**: Use the historical data to show improvement over time

## Questions or Issues?

If you encounter any problems:
1. Check the browser console for errors
2. Review the network tab for failed API calls
3. Ensure all environment variables are set correctly
4. Verify database migrations ran successfully
