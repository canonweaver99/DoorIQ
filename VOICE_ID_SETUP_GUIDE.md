# Voice ID Setup Guide

The ElevenLabs ConvAI API doesn't expose voice IDs directly, so they need to be added manually from your ElevenLabs dashboard.

## How to Find Voice IDs

### Method 1: From ElevenLabs Dashboard (Recommended)

1. Go to [ElevenLabs Dashboard](https://elevenlabs.io/app/conversational-ai)
2. Click on each agent to open its settings
3. Look for the "Voice" or "Voice Settings" section
4. The voice ID should be visible in the voice configuration
   - It's usually a long string like `pNInz6obpgDQGcFmaJgB`
   - Sometimes it's shown as "Voice ID" or in the URL when editing the voice

### Method 2: From Voice Library

1. Go to [ElevenLabs Voices](https://elevenlabs.io/app/voices)
2. Find the voice used by each agent
3. Click on the voice to see its details
4. The voice ID is usually in the URL or voice settings

### Method 3: Using Browser DevTools

1. Open your browser's Developer Tools (F12)
2. Go to the Network tab
3. Navigate to an agent in the ElevenLabs dashboard
4. Look for API calls that contain voice information
5. The voice_id should be in the response JSON

## Adding Voice IDs to Supabase

Once you have the voice IDs:

1. **Run the migration** (if not already done):
   ```sql
   -- Run this in your Supabase SQL editor:
   -- File: lib/supabase/migrations/113_add_voice_id_to_agents.sql
   ```

2. **Update the populate script** with your voice IDs:
   ```bash
   # Edit scripts/populate-voice-ids-in-supabase.js
   # Update the VOICE_ID_MAP with your voice IDs
   ```

3. **Run the populate script**:
   ```bash
   node scripts/populate-voice-ids-in-supabase.js
   ```

## Quick Update Script

You can also manually update voice IDs directly in Supabase:

```sql
-- Example: Update Average Austin's voice ID
UPDATE agents 
SET eleven_voice_id = 'YOUR_VOICE_ID_HERE'
WHERE eleven_agent_id = 'agent_7001k5jqfjmtejvs77jvhjf254tz';
```

## Agent List

Here are all the agents that need voice IDs:

- Average Austin: `agent_7001k5jqfjmtejvs77jvhjf254tz`
- No Problem Nancy: `agent_0101k6dvb96zejkv35ncf1zkj88m`
- Switchover Steve: `agent_9901k6dvcv32embbydd7nn0prdgq`
- Not Interested Nick: `agent_7601k6dtrf5fe0k9dh8kwmkde0ga`
- DIY Dave: `agent_1701k6dvc3nfejmvydkk7r85tqef`
- Too Expensive Tim: `agent_3901k6dtsjyqfvxbxd1pwzzdham0`
- Spouse Check Susan: `agent_4601k6dvddj8fp89cey35hdj9ef8`
- Busy Beth: `agent_4801k6dvap8tfnjtgd4f99hhsf10`
- Renter Randy: `agent_5701k6dtt9p4f8jbk8rs1akqwtmx`
- Skeptical Sam: `agent_9201k6dts0haecvssk737vwfjy34`
- Just Treated Jerry: `agent_8401k6dv9z2kepw86hhe5bvj4djz`
- Think About It Tina: `agent_2501k6btmv4cf2wt8hxxmq4hvzxv`
- Veteran Victor: `agent_3701k8s40awcf30tbs5mrksskzav`
- Tag Team Tanya & Tom: `agent_4301k8s3mmvvekqb6fdpyszs9md4`

## Verification

After adding voice IDs, verify they're working:

```bash
# Check voice IDs in database
node scripts/fetch-voice-ids-from-supabase.js

# Test the sample audio endpoint
curl "http://localhost:3000/api/eleven/sample-audio?index=0"
```

## Notes

- Voice IDs are different from agent IDs
- Each agent should have its own unique voice ID
- The code will automatically use voice IDs from Supabase once they're added
- Fallback voices will be used until voice IDs are added


