# Environment Setup for DoorIQ

## Required Environment Variables

Create a `.env.local` file in the root directory with BOTH of the following:

```bash
# OpenAI API Key (REQUIRED for speech recognition and conversation)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ElevenLabs API Key (REQUIRED for Amanda's voice)
ELEVENLABS_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# (Optional) ElevenLabs Voice ID override
# Defaults to Rachel (21m00Tcm4TlvDq8ikWAM) if not set
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
```

## How to get your API Keys:

### OpenAI API Key:
1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (it starts with `sk-proj-`)
5. Paste it in your `.env.local` file

### ElevenLabs API Key:
1. Go to https://elevenlabs.io/
2. Sign up for an account (free tier available)
3. Go to Profile Settings > API Key
4. Copy your API key
5. Paste it in your `.env.local` file

## Verifying Setup

After adding BOTH API keys:
1. Restart your development server (`npm run dev`)
2. Click a door to start conversation
3. Check browser console - you should see:
   - "Token generated successfully" (OpenAI working)
   - "Speaking with ElevenLabs:" (ElevenLabs working)
4. You should hear Amanda's voice and she should respond to you

## Troubleshooting

**If you don't hear Amanda's voice:**
- Check for "ELEVENLABS_API_KEY missing" errors in console
- Verify your ElevenLabs API key is correct
- Check your ElevenLabs account quota hasn't been exceeded

**If Amanda doesn't hear you:**
- Check for "OPENAI_API_KEY missing" errors in console
- Ensure microphone permissions are granted in browser
- Verify your OpenAI API key is correct and has Realtime API access

**Other issues:**
- Make sure `.env.local` file exists in the root directory
- Ensure keys are properly formatted (no quotes needed)
- Restart the development server after adding keys
